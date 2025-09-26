import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { IvrFlow, IvrNode, IvrConnection, IvrNodeType, IvrNodePort, CalendarEvent, DayOfWeek } from '../types.ts';
import {
    MenuIcon, SpeakerWaveIcon, InboxArrowDownIcon, PhoneArrowUpRightIcon, PhoneXMarkIcon, DateIcon,
    PlayIcon, SettingsIcon, TrashIcon, PlusIcon, XMarkIcon, MinusIcon, ResetViewIcon
} from './Icons.tsx';

interface IvrDesignerProps {
    flow: IvrFlow;
    onSave: (flow: IvrFlow) => void;
    onClose: () => void;
}

const nodeMetadata: { [key in IvrNodeType]: {
    icon: React.FC<any>;
    name: string;
    defaultContent: any;
    defaultWidth: number;
    defaultHeight: number;
    ports: IvrNodePort[];
} } = {
    start: { icon: PlayIcon, name: 'Début', defaultContent: {}, defaultWidth: 150, defaultHeight: 60, ports: [{ id: 'out', type: 'output', label: 'Suivant' }] },
    menu: { icon: MenuIcon, name: 'Menu', defaultContent: { prompt: 'Tapez 1 pour...', options: [{ key: '1', portId: 'out-1', label: 'Option 1' }] }, defaultWidth: 220, defaultHeight: 150, ports: [{ id: 'in', type: 'input', label: '' }] },
    calendar: { icon: DateIcon, name: 'Calendrier', defaultContent: { timezone: 'Europe/Paris', events: [] }, defaultWidth: 220, defaultHeight: 120, ports: [{ id: 'in', type: 'input', label: '' }] }, // Output ports are now dynamic
    media: { icon: SpeakerWaveIcon, name: 'Média', defaultContent: { prompt: 'Bonjour et bienvenue.' }, defaultWidth: 220, defaultHeight: 100, ports: [{ id: 'in', type: 'input', label: '' }, { id: 'out', type: 'output', label: 'Suivant' }] },
    voicemail: { icon: InboxArrowDownIcon, name: 'Messagerie', defaultContent: { prompt: 'Laissez un message.' }, defaultWidth: 200, defaultHeight: 100, ports: [{ id: 'in', type: 'input', label: '' }] },
    transfer: { icon: PhoneArrowUpRightIcon, name: 'Transfert', defaultContent: { number: '+33...' }, defaultWidth: 200, defaultHeight: 100, ports: [{ id: 'in', type: 'input', label: '' }, { id: 'out', type: 'output', label: 'Échec' }] },
    hangup: { icon: PhoneXMarkIcon, name: 'Raccrocher', defaultContent: {}, defaultWidth: 150, defaultHeight: 60, ports: [{ id: 'in', type: 'input', label: '' }] },
};

const NODE_COLORS: { [key in IvrNodeType]: string } = {
    start: 'bg-green-100 border-green-300',
    menu: 'bg-blue-100 border-blue-300',
    calendar: 'bg-amber-100 border-amber-300',
    media: 'bg-violet-100 border-violet-300',
    voicemail: 'bg-sky-100 border-sky-300',
    transfer: 'bg-rose-100 border-rose-300',
    hangup: 'bg-slate-200 border-slate-400',
};

const WEEK_DAYS: { key: DayOfWeek; label: string }[] = [
    { key: 'mon', label: 'L' },
    { key: 'tue', label: 'M' },
    { key: 'wed', label: 'M' },
    { key: 'thu', label: 'J' },
    { key: 'fri', label: 'V' },
    { key: 'sat', label: 'S' },
    { key: 'sun', label: 'D' }
];

const Port: React.FC<{ node: IvrNode; port: IvrNodePort; onStartConnect: (nodeId: string, portId: string, e: React.MouseEvent) => void; onEndConnect: (nodeId: string, portId: string) => void }> = ({ node, port, onStartConnect, onEndConnect }) => {
    const isInput = port.type === 'input';
    return (
        <div
            className={`absolute ${isInput ? '-left-2.5' : '-right-2.5'} top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 rounded-full cursor-pointer hover:bg-indigo-200 ${isInput ? 'border-green-500' : 'border-blue-500'}`}
            data-node-id={node.id}
            data-port-id={port.id}
            onMouseDown={e => isInput ? null : onStartConnect(node.id, port.id, e)}
            onMouseUp={() => isInput ? onEndConnect(node.id, port.id) : null}
            title={port.label}
        />
    );
};


const IvrDesigner: React.FC<IvrDesignerProps> = ({ flow: initialFlow, onSave, onClose }) => {
    const [flow, setFlow] = useState<IvrFlow>(initialFlow);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [connecting, setConnecting] = useState<{ fromNodeId: string; fromPortId: string; toMouse: { x: number, y: number } } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef<{ id: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null);
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, zoom: 1 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });

    const updateFlow = (updater: (draft: IvrFlow) => void) => {
        setFlow(prev => {
            const newFlow = JSON.parse(JSON.stringify(prev));
            updater(newFlow);
            return newFlow;
        });
    };

    const getPortPosition = (nodeId: string, portId: string) => {
        const node = flow.nodes.find(n => n.id === nodeId);
        if (!node) return null;
        const allPorts = getAllPortsForNode(node);
        const port = allPorts.find(p => p.id === portId);
        if (!port) return null;

        const portsOfType = allPorts.filter(p => p.type === port.type);
        const portIndex = portsOfType.findIndex(p => p.id === portId);

        const nodeHeight = nodeMetadata[node.type].defaultHeight;
        
        return {
            x: node.x + (port.type === 'output' ? nodeMetadata[node.type].defaultWidth : 0),
            y: node.y + (nodeHeight * (portIndex + 1)) / (portsOfType.length + 1),
        };
    };

     const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.target !== canvasRef.current && !(e.target as HTMLElement).closest('.canvas-background')) return;
        isPanning.current = true;
        panStart.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
        canvasRef.current!.style.cursor = 'grabbing';
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const canvasBounds = canvasRef.current?.getBoundingClientRect();
        if (!canvasBounds) return;
        const mouseX = (e.clientX - canvasBounds.left - viewTransform.x) / viewTransform.zoom;
        const mouseY = (e.clientY - canvasBounds.top - viewTransform.y) / viewTransform.zoom;

        if (isPanning.current) {
            const x = e.clientX - panStart.current.x;
            const y = e.clientY - panStart.current.y;
            setViewTransform(v => ({...v, x, y}));
            return;
        }

        if (dragInfo.current) {
            const { id, startX, startY, nodeStartX, nodeStartY } = dragInfo.current;
            const dx = (e.clientX - startX) / viewTransform.zoom;
            const dy = (e.clientY - startY) / viewTransform.zoom;
            updateFlow(draft => {
                const node = draft.nodes.find(n => n.id === id);
                if (node) {
                    node.x = nodeStartX + dx;
                    node.y = nodeStartY + dy;
                }
            });
        }
        if (connecting) {
            setConnecting(c => c ? { ...c, toMouse: { x: mouseX, y: mouseY } } : null);
        }
    }, [viewTransform.x, viewTransform.y, viewTransform.zoom, connecting]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
        if(canvasRef.current) canvasRef.current.style.cursor = 'grab';
        dragInfo.current = null;
        setConnecting(null);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('nodeType') as IvrNodeType;
        const canvasBounds = canvasRef.current?.getBoundingClientRect();
        if (!type || !canvasBounds) return;

        const metadata = nodeMetadata[type];
        const newNode: IvrNode = {
            id: `node-${type}-${Date.now()}`,
            name: metadata.name,
            type,
            x: (e.clientX - canvasBounds.left - viewTransform.x) / viewTransform.zoom,
            y: (e.clientY - canvasBounds.top - viewTransform.y) / viewTransform.zoom,
            content: JSON.parse(JSON.stringify(metadata.defaultContent)),
        };
        updateFlow(draft => { draft.nodes.push(newNode); });
    };

    const handleStartConnect = (fromNodeId: string, fromPortId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const canvasBounds = canvasRef.current!.getBoundingClientRect();
        setConnecting({ fromNodeId, fromPortId, toMouse: { x: (e.clientX - canvasBounds.left - viewTransform.x) / viewTransform.zoom, y: (e.clientY - canvasBounds.top - viewTransform.y) / viewTransform.zoom } });
    };

    const handleEndConnect = (toNodeId: string, toPortId: string) => {
        if (!connecting) return;
        const { fromNodeId, fromPortId } = connecting;
        if (fromNodeId === toNodeId) return;

        updateFlow(draft => {
            // Remove any existing connection from the same output port
            draft.connections = draft.connections.filter(c => c.fromNodeId !== fromNodeId || c.fromPortId !== fromPortId);
            // Remove any existing connection to the same input port
            draft.connections = draft.connections.filter(c => c.toNodeId !== toNodeId || c.toPortId !== toPortId);
            // Add the new connection
            draft.connections.push({ id: `conn-${Date.now()}`, fromNodeId, fromPortId, toNodeId, toPortId });
        });
        setConnecting(null);
    };
    
    const getAllPortsForNode = (node: IvrNode): IvrNodePort[] => {
        const metaPorts = nodeMetadata[node.type].ports;

        if (node.type === 'menu' && node.content.options) {
            const dynamicPorts = node.content.options.map((opt: any) => ({
                id: opt.portId,
                type: 'output',
                label: opt.label || `Touche ${opt.key}`
            }));
            return [...metaPorts.filter(p => p.type === 'input'), ...dynamicPorts, { id: 'out-timeout', type: 'output', label: 'Timeout' }];
        }
        if (node.type === 'calendar' && node.content.events) {
             const eventPorts = node.content.events.map((event: CalendarEvent) => ({
                id: event.id,
                type: 'output',
                label: event.name,
             }));
             return [
                ...metaPorts.filter(p => p.type === 'input'), 
                ...eventPorts,
                { id: 'out-default', type: 'output', label: 'Aucun événement' }
             ];
        }

        return metaPorts;
    };
    
    const updateNodeContent = (nodeId: string, contentProperty: string, value: any) => {
     updateFlow(draft => {
        const node = draft.nodes.find(n => n.id === nodeId);
        if (node) node.content[contentProperty] = value;
    });
  };
  
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newZoom = Math.min(Math.max(viewTransform.zoom + scaleAmount, 0.2), 3);
        
        const canvasBounds = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - canvasBounds.left;
        const mouseY = e.clientY - canvasBounds.top;

        const newX = mouseX - (mouseX - viewTransform.x) * (newZoom / viewTransform.zoom);
        const newY = mouseY - (mouseY - viewTransform.y) * (newZoom / viewTransform.zoom);

        setViewTransform({ x: newX, y: newY, zoom: newZoom });
    };

    const selectedNode = flow.nodes.find(n => n.id === selectedNodeId);

    const renderProperties = () => {
        if (!selectedNode) return <div className="p-4 text-sm text-slate-500">Sélectionnez un noeud pour voir ses propriétés.</div>;
        const meta = nodeMetadata[selectedNode.type];
        const Icon = meta.icon;

        const handleAddEvent = (type: 'open' | 'closed') => {
            const today = new Date().toISOString().split('T')[0];
            const newEvent: CalendarEvent = {
                id: `evt-${Date.now()}`,
                name: type === 'open' ? 'Nouveaux horaires' : 'Nouvelle fermeture',
                eventType: type,
                isRecurring: type === 'open',
                allDay: type === 'closed',
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                startTime: '09:00',
                endTime: '17:00',
                startDate: today,
                endDate: today
            };
            const newEvents = [...(selectedNode.content.events || []), newEvent];
            updateNodeContent(selectedNode.id, 'events', newEvents);
        };

        const handleEventChange = (index: number, field: keyof CalendarEvent, value: any) => {
             const newEvents = selectedNode.content.events.map((event: CalendarEvent, evtIndex: number) => {
                if (index !== evtIndex) return event;
                return { ...event, [field]: value };
            });
            updateNodeContent(selectedNode.id, 'events', newEvents);
        }

        return (
            <div className="p-4 space-y-4 text-sm">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center"><Icon className="w-5 h-5 mr-2"/> {selectedNode.name}</h3>
                    {selectedNode.type !== 'start' && <button onClick={() => {
                        updateFlow(draft => {
                            const deletedNodeId = selectedNode.id;
                            draft.nodes = draft.nodes.filter(n => n.id !== deletedNodeId);
                            draft.connections = draft.connections.filter(c => c.fromNodeId !== deletedNodeId && c.toNodeId !== deletedNodeId);
                        });
                        setSelectedNodeId(null);
                    }} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>}
                </div>
                <div>
                    <label className="font-semibold text-slate-600">Nom du noeud</label>
                    <input type="text" value={selectedNode.name} onChange={e => updateFlow(draft => { const n = draft.nodes.find(n => n.id === selectedNode.id); if(n) n.name = e.target.value; })} className="w-full p-1.5 border rounded-md mt-1"/>
                </div>

                {selectedNode.type === 'media' && <div><label className="font-semibold text-slate-600">Message à diffuser</label><textarea value={selectedNode.content.prompt} onChange={e => updateNodeContent(selectedNode.id, 'prompt', e.target.value)} className="w-full p-1.5 border rounded-md mt-1" rows={3}/></div>}
                
                {selectedNode.type === 'menu' && <div>
                    <label className="font-semibold text-slate-600">Message du menu</label>
                    <textarea value={selectedNode.content.prompt} onChange={e => updateNodeContent(selectedNode.id, 'prompt', e.target.value)} className="w-full p-1.5 border rounded-md mt-1" rows={3}/>
                    <label className="font-semibold text-slate-600 mt-2 block">Options du menu</label>
                    {selectedNode.content.options.map((opt:any, index:number) => (
                        <div key={opt.portId} className="flex items-center gap-2 mt-1">
                            <input type="text" value={opt.key} placeholder="Touche" className="w-12 p-1.5 border rounded-md"/>
                            <input type="text" value={opt.label} placeholder="Label" className="flex-1 p-1.5 border rounded-md"/>
                            <button className="text-red-500"><XMarkIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                     <button className="text-indigo-600 text-xs mt-2">+ Ajouter une option</button>
                </div>}

                {selectedNode.type === 'calendar' && (
                    <div>
                        <label className="font-semibold text-slate-600">Fuseau Horaire</label>
                        <select value={selectedNode.content.timezone} onChange={e => updateNodeContent(selectedNode.id, 'timezone', e.target.value)} className="w-full p-1.5 border rounded-md mt-1 bg-white">
                            <option>Europe/Paris</option>
                            <option>Europe/London</option>
                            <option>America/New_York</option>
                        </select>
                        <label className="font-semibold text-slate-600 mt-4 block">Événements (priorité de haut en bas)</label>
                        <div className="space-y-2 mt-1 max-h-80 overflow-y-auto pr-1">
                            {selectedNode.content.events?.map((event: CalendarEvent, index: number) => {
                                const eventClasses = event.eventType === 'closed' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200';
                                return (
                                <div key={event.id} className={`p-3 border rounded-md space-y-2 ${eventClasses}`}>
                                    <div className="flex justify-between items-center">
                                        <input 
                                            type="text" 
                                            value={event.name}
                                            onChange={e => handleEventChange(index, 'name', e.target.value)}
                                            className="p-1 border rounded-md font-medium w-full text-sm"
                                            placeholder="Nom de l'événement"
                                        />
                                        <button onClick={() => {
                                            const eventIdToRemove = selectedNode.content.events[index].id;
                                            const newEvents = selectedNode.content.events.filter((_:any, i:number) => i !== index);
                                            updateFlow(draft => {
                                                const node = draft.nodes.find(n => n.id === selectedNode.id);
                                                if (node) node.content.events = newEvents;
                                                draft.connections = draft.connections.filter(c => c.fromNodeId !== selectedNode.id || c.fromPortId !== eventIdToRemove);
                                            });
                                        }} className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                    
                                     <div>
                                        <label className="text-xs font-medium">Type d'horaire</label>
                                        <select
                                            value={event.isRecurring ? 'recurring' : 'daterange'}
                                            onChange={e => handleEventChange(index, 'isRecurring', e.target.value === 'recurring')}
                                            className="p-1.5 border rounded-md w-full text-sm mt-1 bg-white"
                                        >
                                            <option value="recurring">Récurrent (semaine)</option>
                                            <option value="daterange">Plage de dates</option>
                                        </select>
                                    </div>

                                    {event.isRecurring ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <input type="time" value={event.startTime} onChange={e => handleEventChange(index, 'startTime', e.target.value)} className="p-1 border rounded-md w-full text-sm"/>
                                                <span>à</span>
                                                <input type="time" value={event.endTime} onChange={e => handleEventChange(index, 'endTime', e.target.value)} className="p-1 border rounded-md w-full text-sm"/>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                {WEEK_DAYS.map(day => (
                                                    <button
                                                        key={day.key}
                                                        onClick={() => {
                                                            const currentDays = event.days || [];
                                                            const newDays = currentDays.includes(day.key)
                                                                ? currentDays.filter((d: DayOfWeek) => d !== day.key)
                                                                : [...currentDays, day.key];
                                                            handleEventChange(index, 'days', newDays);
                                                        }}
                                                        className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${event.days?.includes(day.key) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                                    >
                                                        {day.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-medium">Du</label>
                                                    <input type="date" value={event.startDate} onChange={e => handleEventChange(index, 'startDate', e.target.value)} className="p-1 border rounded-md w-full text-sm mt-1"/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium">Au</label>
                                                    <input type="date" value={event.endDate} onChange={e => handleEventChange(index, 'endDate', e.target.value)} className="p-1 border rounded-md w-full text-sm mt-1"/>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <input type="checkbox" id={`allDay-${event.id}`} checked={event.allDay} onChange={e => handleEventChange(index, 'allDay', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600"/>
                                                <label htmlFor={`allDay-${event.id}`} className="ml-2 text-xs">Toute la journée</label>
                                            </div>
                                            {!event.allDay && <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-medium">De</label>
                                                    <input type="time" value={event.startTime} onChange={e => handleEventChange(index, 'startTime', e.target.value)} className="p-1 border rounded-md w-full text-sm mt-1"/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium">À</label>
                                                    <input type="time" value={event.endTime} onChange={e => handleEventChange(index, 'endTime', e.target.value)} className="p-1 border rounded-md w-full text-sm mt-1"/>
                                                </div>
                                            </div>}
                                        </div>
                                    )}
                                </div>
                                )
                            })}
                        </div>
                        <div className="mt-3 space-x-2">
                            <button onClick={() => handleAddEvent('open')} className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 inline-flex items-center"><PlusIcon className="w-4 h-4 mr-1"/> Ajouter des horaires</button>
                             <button onClick={() => handleAddEvent('closed')} className="text-red-600 text-sm font-semibold hover:text-red-800 inline-flex items-center"><PlusIcon className="w-4 h-4 mr-1"/> Ajouter une fermeture</button>
                        </div>
                    </div>
                )}
            </div>
        )
    };
    
    return (
        <div className="h-full flex flex-col bg-slate-50">
            <header className="flex justify-between items-center p-3 border-b bg-white shadow-sm flex-shrink-0">
                <input type="text" value={flow.name} onChange={e => setFlow(s => ({ ...s, name: e.target.value }))} className="text-xl font-bold text-slate-800 p-2 border border-transparent hover:border-slate-300 rounded-md" />
                <div className="space-x-2">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">Fermer</button>
                    <button onClick={() => onSave(flow)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Enregistrer</button>
                </div>
            </header>
            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                <div className="col-span-2 bg-white p-3 border-r overflow-y-auto">
                    <h3 className="font-semibold text-slate-800 mb-3">Noeuds</h3>
                    <div className="space-y-2">
                        {Object.entries(nodeMetadata).filter(([type]) => type !== 'start').map(([type, { icon: Icon, name }]) => (
                            <div key={type} draggable onDragStart={e => e.dataTransfer.setData('nodeType', type as IvrNodeType)} className="flex items-center space-x-2 p-2 bg-slate-100 hover:bg-slate-200 rounded cursor-grab">
                                <Icon className="w-5 h-5 text-slate-600" /><span className="text-sm font-medium text-slate-700">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div 
                    className="col-span-7 bg-slate-200 relative overflow-hidden cursor-grab" 
                    ref={canvasRef} 
                    onDrop={handleDrop} 
                    onDragOver={e => e.preventDefault()} 
                    onClick={() => setSelectedNodeId(null)}
                    onMouseDown={handleCanvasMouseDown}
                    onWheel={handleWheel}
                >
                    <div 
                        className="w-full h-full canvas-background" 
                        style={{ 
                            transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.zoom})`, 
                            transformOrigin: 'top left', 
                            backgroundImage: `radial-gradient(#d1d5db 1px, transparent 0)`,
                            backgroundSize: `16px 16px`
                        }}
                    >
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                </marker>
                            </defs>
                            {flow.connections.map(conn => {
                                const fromPos = getPortPosition(conn.fromNodeId, conn.fromPortId);
                                const toPos = getPortPosition(conn.toNodeId, conn.toPortId);
                                if (!fromPos || !toPos) return null;
                                const d = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + 50} ${fromPos.y}, ${toPos.x - 50} ${toPos.y}, ${toPos.x-5} ${toPos.y}`;
                                return <path key={conn.id} d={d} stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />;
                            })}
                            {connecting && getPortPosition(connecting.fromNodeId, connecting.fromPortId) && <path d={`M ${getPortPosition(connecting.fromNodeId, connecting.fromPortId)!.x} ${getPortPosition(connecting.fromNodeId, connecting.fromPortId)!.y} L ${connecting.toMouse.x} ${connecting.toMouse.y}`} stroke="#4f46e5" strokeWidth="2" fill="none" strokeDasharray="5,5" />}
                        </svg>

                        {flow.nodes.map(node => {
                            const Icon = nodeMetadata[node.type].icon;
                            const colorClasses = NODE_COLORS[node.type] || 'bg-white border-slate-300';
                            return (
                                <div
                                    key={node.id}
                                    className={`absolute rounded-lg shadow-lg border-2 p-2 flex flex-col ${selectedNodeId === node.id ? 'ring-4 ring-indigo-200 border-indigo-500' : ''} ${colorClasses}`}
                                    style={{ left: node.x, top: node.y, width: nodeMetadata[node.type].defaultWidth, minHeight: nodeMetadata[node.type].defaultHeight }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                                >
                                    <div 
                                        className={`font-bold text-sm flex items-center mb-1 text-slate-800 ${node.type === 'start' ? 'cursor-default' : 'cursor-grab'}`}
                                        onMouseDown={e => {
                                            if (node.type === 'start' || isPanning.current) return;
                                            e.stopPropagation();
                                            dragInfo.current = { id: node.id, startX: e.clientX, startY: e.clientY, nodeStartX: node.x, nodeStartY: node.y };
                                        }}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {node.name}
                                    </div>
                                    <div className="text-xs text-slate-600 flex-grow">{node.content.prompt || node.content.number}</div>
                                    {getAllPortsForNode(node).map(port => {
                                        const portPos = getPortPosition(node.id, port.id);
                                        if (!portPos) return null;
                                        const y = portPos.y - node.y;
                                        
                                        return (
                                        <div key={port.id} className="relative h-6 flex items-center" style={{ position: 'absolute', top: `${y - 12}px`, width: '100%'}}>
                                            {port.type === 'output' && <span className="absolute right-6 text-xs text-slate-600 truncate" title={port.label}>{port.label}</span>}
                                            <Port node={node} port={port} onStartConnect={handleStartConnect} onEndConnect={handleEndConnect} />
                                        </div>
                                        )
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-md flex items-center border">
                        <button onClick={() => setViewTransform(v => ({...v, zoom: v.zoom * 1.2}))} className="p-2 hover:bg-slate-100" title="Zoom avant"><PlusIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewTransform(v => ({...v, zoom: v.zoom / 1.2}))} className="p-2 hover:bg-slate-100 border-l" title="Zoom arrière"><MinusIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewTransform({x:20, y:20, zoom:1})} className="p-2 hover:bg-slate-100 border-l" title="Réinitialiser la vue"><ResetViewIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="col-span-3 bg-white border-l overflow-y-auto">
                    {renderProperties()}
                </div>
            </div>
        </div>
    );
};

export default IvrDesigner;