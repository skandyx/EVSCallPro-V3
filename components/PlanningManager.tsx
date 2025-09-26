import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Feature, PlanningEvent, ActivityType, User, UserGroup } from '../types.ts';
import { PlusIcon, ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon } from './Icons.tsx';

interface PlanningManagerProps {
    feature: Feature;
    planningEvents: PlanningEvent[];
    activityTypes: ActivityType[];
    users: User[];
    userGroups: UserGroup[];
    onSavePlanningEvent: (event: PlanningEvent) => void;
    onDeletePlanningEvent: (eventId: string) => void;
}

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const HOUR_HEIGHT = 60; // 60px per hour
const HEADER_HEIGHT = 40; // h-10 -> 2.5rem -> 40px

// --- PlanningEventModal ---
interface PlanningEventModalProps {
    event: Partial<PlanningEvent> | null;
    onSave: (eventData: Omit<PlanningEvent, 'id' | 'agentId'>, targetId: string) => void;
    onDelete: (eventId: string) => void;
    onClose: () => void;
    agents: User[];
    userGroups: UserGroup[];
    activities: ActivityType[];
}

const PlanningEventModal: React.FC<PlanningEventModalProps> = ({ event, onSave, onDelete, onClose, agents, userGroups, activities }) => {
    const isEditing = !!event?.id;
    
    const [targetId, setTargetId] = useState(() => {
        if (isEditing && event?.agentId) return `user-${event.agentId}`;
        return '';
    });
    
    const [formData, setFormData] = useState({
        activityId: event?.activityId || '',
        startDate: event?.startDate || new Date().toISOString(),
        endDate: event?.endDate || new Date().toISOString(),
    });

    const handleSave = () => {
        if (!targetId || !formData.activityId) {
            alert("Veuillez sélectionner une cible (agent/groupe) et une activité.");
            return;
        }
        onSave(formData, targetId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-medium text-slate-900">{isEditing ? "Modifier l'événement" : "Nouvel événement"}</h3>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Pour</label>
                            <select value={targetId} onChange={e => setTargetId(e.target.value)} disabled={isEditing} className="mt-1 w-full p-2 border bg-white rounded-md disabled:bg-slate-100">
                                <option value="">Sélectionner...</option>
                                <optgroup label="Groupes">
                                    {userGroups.map(g => <option key={g.id} value={`group-${g.id}`}>{g.name}</option>)}
                                </optgroup>
                                <optgroup label="Agents">
                                    {agents.map(a => <option key={a.id} value={`user-${a.id}`}>{a.firstName} {a.lastName}</option>)}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Activité</label>
                            <select value={formData.activityId} onChange={e => setFormData(f => ({...f, activityId: e.target.value}))} className="mt-1 w-full p-2 border bg-white rounded-md">
                                 <option value="">Sélectionner une activité</option>
                                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Début</label>
                                <input type="datetime-local" value={new Date(new Date(formData.startDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={e => setFormData(f => ({...f, startDate: new Date(e.target.value).toISOString()}))} className="mt-1 w-full p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Fin</label>
                                <input type="datetime-local" value={new Date(new Date(formData.endDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={e => setFormData(f => ({...f, endDate: new Date(e.target.value).toISOString()}))} className="mt-1 w-full p-2 border rounded-md"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-3 flex justify-between">
                     {isEditing && event?.id && <button onClick={() => { onDelete(event.id!); onClose(); }} className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200">Supprimer</button>}
                    <div className="flex justify-end gap-2 w-full">
                        <button onClick={onClose} className="bg-white border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50">Annuler</button>
                        <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Enregistrer</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlanningManager: React.FC<PlanningManagerProps> = ({ feature, planningEvents, activityTypes, users, userGroups, onSavePlanningEvent, onDeletePlanningEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTargetId, setSelectedTargetId] = useState('all');
    const [modalState, setModalState] = useState<{ isOpen: boolean; event: Partial<PlanningEvent> | null }>({ isOpen: false, event: null });
    
    const [ghostEvent, setGhostEvent] = useState<PlanningEvent | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef<{
        type: 'move' | 'resize', 
        originalEvent: PlanningEvent,
        timeOffset?: number,
    } | null>(null);

    const gridRef = useRef<HTMLDivElement>(null);
    const activeAgents = useMemo(() => users.filter(u => u.role === 'Agent' && u.isActive), [users]);

    const weekInfo = useMemo(() => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });

        return { start, end, days };
    }, [currentDate]);

    const handleDateChange = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + offset);
            return newDate;
        });
    };

    const getDateFromPosition = useCallback((clientX: number, clientY: number): Date | null => {
        if (!gridRef.current) return null;
        
        const gridRect = gridRef.current.getBoundingClientRect();
        const dayWidth = gridRect.width / 7;
        const snapMinutes = 15;

        const clampedClientX = Math.max(gridRect.left, Math.min(clientX, gridRect.right - 1));
        const clampedClientY = Math.max(gridRect.top + HEADER_HEIGHT, Math.min(clientY, gridRect.bottom - 1));

        const relativeX = clampedClientX - gridRect.left;
        const relativeY = clampedClientY - (gridRect.top + HEADER_HEIGHT);
        
        const dayIndex = Math.floor(relativeX / dayWidth);
        const minutesInDay = (relativeY / HOUR_HEIGHT) * 60;
        
        const snappedMinutes = Math.round(minutesInDay / snapMinutes) * snapMinutes;

        const date = new Date(weekInfo.start);
        date.setDate(date.getDate() + dayIndex);
        date.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);
        
        return date;
    }, [weekInfo.start]);
    
    const handleCellClick = (day: Date, hour: number) => {
        const startDate = new Date(day);
        startDate.setHours(hour, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(hour + 1, 0, 0, 0);
        
        let agentId = '';
        const [type, id] = selectedTargetId.split('-');
        if(type === 'user') agentId = id;
        
        setModalState({ isOpen: true, event: { agentId, startDate: startDate.toISOString(), endDate: endDate.toISOString() } });
    }
    
    const handleModalSave = (eventData: Omit<PlanningEvent, 'id' | 'agentId'>, targetId: string) => {
        const [type, id] = targetId.split('-');
        if (type === 'group') {
            const group = userGroups.find(g => g.id === id);
            if (group) {
                group.memberIds.forEach((memberId, index) => {
                    const newEvent = { ...eventData, id: `plan-${Date.now() + index}`, agentId: memberId };
                    onSavePlanningEvent(newEvent);
                });
            }
        } else {
            onSavePlanningEvent({ ...eventData, id: `plan-${Date.now()}`, agentId: id });
        }
    };
    
    const handleEventMouseDown = useCallback((e: React.MouseEvent, event: PlanningEvent, isResizeHandle: boolean) => {
        e.stopPropagation();
        e.preventDefault();
        if (dragState.current) return;
        
        const startMouseDate = getDateFromPosition(e.clientX, e.clientY);
        if (!startMouseDate) return;

        dragState.current = { 
            type: isResizeHandle ? 'resize' : 'move', 
            originalEvent: event,
            timeOffset: isResizeHandle ? undefined : startMouseDate.getTime() - new Date(event.startDate).getTime(),
        };
        setGhostEvent(event);
        setIsDragging(true);
    }, [getDateFromPosition]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.current) return;
        e.preventDefault();
        
        const { type, originalEvent, timeOffset } = dragState.current;
        const currentMouseDate = getDateFromPosition(e.clientX, e.clientY);
        if (!currentMouseDate) return;

        if (type === 'move') {
            const newStartMillis = currentMouseDate.getTime() - timeOffset!;
            const originalDuration = new Date(originalEvent.endDate).getTime() - new Date(originalEvent.startDate).getTime();
            const newStartDate = new Date(newStartMillis);
            const newEndDate = new Date(newStartMillis + originalDuration);

            setGhostEvent(prev => prev ? { 
                ...prev, 
                startDate: newStartDate.toISOString(), 
                endDate: newEndDate.toISOString() 
            } : null);
        } else { // resize
            const originalStartDate = new Date(originalEvent.startDate);
            let newEndDate = currentMouseDate;

            if (newEndDate.getTime() < originalStartDate.getTime() + 15 * 60000) {
                newEndDate = new Date(originalStartDate.getTime() + 15 * 60000);
            }
            setGhostEvent(prev => prev ? { ...prev, endDate: newEndDate.toISOString() } : null);
        }
    }, [getDateFromPosition]);
    
    const handleMouseUp = useCallback(() => {
        if (dragState.current && ghostEvent) {
            const { originalEvent } = dragState.current;
            if(ghostEvent.startDate !== originalEvent.startDate || ghostEvent.endDate !== originalEvent.endDate) {
                onSavePlanningEvent(ghostEvent);
            }
        }
        dragState.current = null;
        setGhostEvent(null);
        setIsDragging(false);
    }, [ghostEvent, onSavePlanningEvent]);

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = dragState.current?.type === 'resize' ? 'ns-resize' : 'grabbing';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        } else {
            document.body.style.cursor = 'default';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);
    
    const eventsToDisplay = useMemo(() => {
        let baseEvents = planningEvents.filter(event => {
            const eventEnd = new Date(event.endDate);
            const eventStart = new Date(event.startDate);
            if (eventEnd < weekInfo.start || eventStart > weekInfo.end) return false;
            if (selectedTargetId === 'all') return true;
            const [type, id] = selectedTargetId.split('-');
            if (type === 'user') return event.agentId === id;
            if (type === 'group') {
                const group = userGroups.find(g => g.id === id);
                return group ? group.memberIds.includes(event.agentId) : false;
            }
            return false;
        });

        if (ghostEvent) {
            baseEvents = baseEvents.filter(e => e.id !== ghostEvent.id);
            baseEvents.push(ghostEvent);
        }
        return baseEvents;
    }, [planningEvents, weekInfo, selectedTargetId, userGroups, ghostEvent]);

    const eventsToRender = useMemo(() => {
        const segments: Array<{ id: string; originalEvent: PlanningEvent; startDate: Date; endDate: Date; isStart: boolean; isEnd: boolean; }> = [];
        eventsToDisplay.forEach(event => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            
            // Clamp event rendering to the visible week
            const renderStart = start > weekInfo.start ? start : weekInfo.start;
            const renderEnd = end < weekInfo.end ? end : weekInfo.end;

            let currentDay = new Date(renderStart);
            currentDay.setHours(0, 0, 0, 0);

            while (currentDay < renderEnd) {
                const dayEnd = new Date(currentDay);
                dayEnd.setDate(dayEnd.getDate() + 1);

                const segmentStart = currentDay > renderStart ? currentDay : renderStart;
                const segmentEnd = dayEnd < renderEnd ? dayEnd : renderEnd;

                if (segmentStart < segmentEnd) {
                    segments.push({
                        id: `${event.id}-${currentDay.toISOString().split('T')[0]}`,
                        originalEvent: event,
                        startDate: segmentStart,
                        endDate: segmentEnd,
                        isStart: start.getTime() >= segmentStart.getTime() && start.getTime() < segmentEnd.getTime(),
                        isEnd: end.getTime() > segmentStart.getTime() && end.getTime() <= segmentEnd.getTime(),
                    });
                }
                currentDay.setDate(currentDay.getDate() + 1);
            }
        });
        return segments;
    }, [eventsToDisplay, weekInfo.start, weekInfo.end]);


    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {modalState.isOpen && (
                <PlanningEventModal
                    event={modalState.event}
                    onSave={handleModalSave}
                    onDelete={onDeletePlanningEvent}
                    onClose={() => setModalState({ isOpen: false, event: null })}
                    agents={activeAgents}
                    userGroups={userGroups}
                    activities={activityTypes}
                />
            )}
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center"><CalendarDaysIcon className="w-9 h-9 mr-3"/>{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => handleDateChange(-7)} className="p-2 rounded-md hover:bg-slate-100"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <span className="text-lg font-semibold text-slate-700">
                        {weekInfo.start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} - {weekInfo.end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => handleDateChange(7)} className="p-2 rounded-md hover:bg-slate-100"><ArrowRightIcon className="w-5 h-5"/></button>
                     <button onClick={() => setCurrentDate(new Date())} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Aujourd'hui</button>
                </div>
                <div>
                     <label className="text-sm font-medium text-slate-600 mr-2">Afficher:</label>
                     <select value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)} className="p-2 border bg-white rounded-md">
                        <option value="all">Tous</option>
                        <optgroup label="Groupes">
                           {userGroups.map(g => <option key={g.id} value={`group-${g.id}`}>{g.name}</option>)}
                        </optgroup>
                         <optgroup label="Agents">
                            {activeAgents.map(a => <option key={a.id} value={`user-${a.id}`}>{a.firstName} {a.lastName}</option>)}
                        </optgroup>
                     </select>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-[75vh] overflow-auto relative grid grid-cols-[auto_1fr] text-sm select-none">
                    <div className="sticky left-0 top-0 z-20 bg-white border-r">
                        <div className="h-10 border-b flex items-center justify-center font-semibold text-slate-500">Heure</div>
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div key={hour} className="h-[60px] text-right pr-2 text-xs text-slate-400 border-t pt-1 font-mono">
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 relative" ref={gridRef}>
                        {weekInfo.days.map((day, i) => (
                            <div key={i} className="sticky top-0 h-10 bg-white border-b border-r flex items-center justify-center font-semibold z-10">
                                {WEEKDAYS[i]} <span className="text-slate-500 ml-2">{day.getDate()}</span>
                            </div>
                        ))}
                        {weekInfo.days.map((day, dayIndex) => (
                            <div key={dayIndex} className="relative border-r day-column">
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={hour} onClick={() => handleCellClick(day, hour)} className="h-[60px] border-t hover:bg-indigo-50"/>
                                ))}
                            </div>
                        ))}
                        <div className="absolute top-[40px] left-0 right-0 bottom-0 pointer-events-none">
                           {eventsToRender.map(segment => {
                                const { originalEvent, startDate, endDate, isStart, isEnd } = segment;
                                const isDraggingGhost = ghostEvent?.id === originalEvent.id;
                                const startDayIndex = (startDate.getDay() + 6) % 7;
                                const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
                                const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
                                
                                const top = (startMinutes / 60) * HOUR_HEIGHT;
                                const height = (durationMinutes / 60) * HOUR_HEIGHT;
                                const left = `${(startDayIndex / 7) * 100}%`;
                                const width = `${(1 / 7) * 100}%`;
                                
                                const activity = activityTypes.find(a => a.id === originalEvent.activityId);
                                const agent = users.find(u => u.id === originalEvent.agentId);

                                return (
                                    <div
                                        key={segment.id}
                                        onClick={e => { e.stopPropagation(); setModalState({ isOpen: true, event: originalEvent })}}
                                        onMouseDown={e => handleEventMouseDown(e, originalEvent, false)}
                                        className={`absolute p-1 rounded-sm shadow-sm border overflow-hidden flex flex-col pointer-events-auto ${isDraggingGhost ? 'opacity-70 z-30' : 'cursor-grab'}`}
                                        style={{ top: `${top}px`, height: `${Math.max(height, 15)}px`, left, width, backgroundColor: activity?.color || '#ccc', borderColor: activity ? `${activity.color}99` : '#bbb' }}
                                        title={`${activity?.name} - ${agent?.firstName} ${agent?.lastName}`}
                                    >
                                        {isStart && <p className="font-bold text-white text-xs truncate">{activity?.name}</p>}
                                        {isStart && selectedTargetId === 'all' && <p className="text-white text-xs opacity-80 truncate">{agent?.firstName}</p>}
                                        {isEnd && height > 20 && (
                                            <div className="mt-auto h-3 w-full flex justify-center items-end pointer-events-auto">
                                               <div onMouseDown={e => handleEventMouseDown(e, originalEvent, true)} className="resize-handle h-1.5 w-8 bg-white opacity-50 rounded-full cursor-ns-resize"/>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanningManager;