

import React, { useState } from 'react';
import type { Feature, Qualification, QualificationGroup } from '../types.ts';
import { PlusIcon, EditIcon, TrashIcon, ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from './Icons.tsx';

const TYPE_DOT_COLORS: { [key in Qualification['type']]: string } = {
    positive: 'bg-green-500',
    neutral: 'bg-slate-400',
    negative: 'bg-red-500',
};

const getNextAvailableCode = (allQualifications: Qualification[]): string => {
    const numericCodes = allQualifications
        .map(q => parseInt(q.code, 10))
        .filter(n => !isNaN(n));
    if (numericCodes.length === 0) return '100';
    const maxCode = Math.max(...numericCodes);
    return (Math.max(maxCode, 99) + 1).toString();
};

// --- MODAL: Create/Edit Qualification ---
interface QualificationModalProps {
    qualificationToEdit?: Qualification | null;
    allQualifications: Qualification[];
    onSave: (qualification: Qualification) => void;
    onClose: () => void;
}

const QualificationModal: React.FC<QualificationModalProps> = ({ qualificationToEdit, allQualifications, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Qualification, 'id' | 'groupId' | 'isStandard'>>({
        code: qualificationToEdit ? qualificationToEdit.code : getNextAvailableCode(allQualifications),
        description: qualificationToEdit ? qualificationToEdit.description : '',
        type: qualificationToEdit ? qualificationToEdit.type : 'neutral',
        parentId: qualificationToEdit ? qualificationToEdit.parentId : null,
    });
    const [error, setError] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const isCodeUsed = allQualifications.some(q => q.code.trim() === formData.code.trim() && q.id !== qualificationToEdit?.id);
        if (isCodeUsed) {
            setError('Ce code est déjà utilisé.');
            return;
        }
        
        const qualToSave: Qualification = {
            id: qualificationToEdit?.id || `qual-${Date.now()}`,
            groupId: qualificationToEdit?.groupId || null,
            isStandard: false,
            ...formData,
        };
        onSave(qualToSave);
    };

    const isEditing = !!qualificationToEdit;
    // A qualification can be a parent if it's not standard and not already a child.
    const parentCandidates = allQualifications.filter(q => !q.isStandard && !q.parentId && q.id !== qualificationToEdit?.id);

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-medium leading-6 text-slate-900">{isEditing ? 'Modifier la Qualification' : 'Ajouter une Qualification'}</h3>
                        <div className="mt-4 space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Parent (Optionnel)</label>
                                <select value={formData.parentId || ''} onChange={e => setFormData(f => ({ ...f, parentId: e.target.value || null }))} className="mt-1 block w-full p-2 border bg-white border-slate-300 rounded-md">
                                    <option value="">Aucun parent</option>
                                    {parentCandidates.map(p => <option key={p.id} value={p.id}>{p.description}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Code</label>
                                <input type="number" value={formData.code} onChange={e => { setFormData(f => ({ ...f, code: e.target.value })); if (error) setError(''); }} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md"/>
                                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Description</label>
                                <input type="text" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Type</label>
                                <select value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value as Qualification['type'] }))} className="mt-1 block w-full p-2 border bg-white border-slate-300 rounded-md">
                                    <option value="positive">Positif</option>
                                    <option value="neutral">Neutre</option>
                                    <option value="negative">Négatif</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button type="submit" className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 sm:ml-3 sm:w-auto">Enregistrer</button>
                        <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:mt-0 sm:w-auto">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- MODAL: Edit Group ---
type TreeQualification = Qualification & { children: TreeQualification[] };
const buildTree = (qualifications: Qualification[], parentId: string | null = null): TreeQualification[] => {
    return qualifications
        .filter(q => (q.parentId || null) === parentId)
        .map(q => ({ ...q, children: buildTree(qualifications, q.id) }))
        .sort((a,b) => parseInt(a.code) - parseInt(b.code));
};

interface GroupEditModalProps {
    group: QualificationGroup | null;
    allQualifications: Qualification[];
    onSave: (group: QualificationGroup, assignedQualIds: string[]) => void;
    onClose: () => void;
    onSaveQualification: (qualification: Qualification) => void;
    onDeleteQualification: (qualificationId: string) => void;
}

const GroupEditModal: React.FC<GroupEditModalProps> = ({ group, allQualifications, onSave, onClose, onSaveQualification, onDeleteQualification }) => {
    const [isQualModalOpen, setIsQualModalOpen] = useState(false);
    const [editingQual, setEditingQual] = useState<Qualification | null>(null);
    const [groupName, setGroupName] = useState(group?.name || '');
    const [assignedIds, setAssignedIds] = useState<string[]>(() => 
        group ? allQualifications.filter(q => !q.isStandard && q.groupId === group.id).map(q => q.id) : []
    );
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    const handleSaveAndCloseQualification = (qualification: Qualification) => {
        onSaveQualification(qualification);
        setIsQualModalOpen(false);
    };

    const handleAssign = (qualId: string) => {
        const toAdd = new Set<string>();
        const findChildrenRecursive = (id: string) => {
            toAdd.add(id);
            allQualifications.forEach(q => q.parentId === id && findChildrenRecursive(q.id));
        };
        findChildrenRecursive(qualId);
        setAssignedIds(prev => [...new Set([...prev, ...toAdd])]);
    };

    const handleUnassign = (qualId: string) => {
        const toRemove = new Set<string>();
        const findChildrenRecursive = (id: string) => {
            toRemove.add(id);
            allQualifications.forEach(q => q.parentId === id && findChildrenRecursive(q.id));
        };
        findChildrenRecursive(qualId);
        setAssignedIds(prev => prev.filter(id => !toRemove.has(id)));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) return;
        const groupToSave = group || { id: `qg-${Date.now()}`, name: '' };
        onSave({ ...groupToSave, name: groupName }, assignedIds);
    };

    // --- Qualification Tree Rendering ---
    const QualificationTree: React.FC<{
        nodes: TreeQualification[];
        isAssignedList: boolean;
        level?: number;
    }> = ({ nodes, isAssignedList, level = 0 }) => {
        if (nodes.length === 0 && level === 0) {
            return <p className="text-center text-sm text-slate-500 italic py-4">Aucune qualification.</p>;
        }
        return (
            <div className="space-y-2">
                {nodes.map(node => {
                    const isExpanded = expandedNodes[node.id] || false;
                    const canExpand = node.children.length > 0;
                    return (
                        <div key={node.id} style={{ marginLeft: `${level * 1.25}rem` }}>
                            <div className={`flex items-center justify-between p-2 bg-white border rounded-md text-sm ${node.isStandard ? 'opacity-70' : 'hover:bg-slate-50'}`}>
                                <div className="flex-1 min-w-0 pr-2 flex items-center">
                                    {canExpand ? (
                                        <button type="button" onClick={() => setExpandedNodes(p => ({...p, [node.id]: !p[node.id]}))} className="mr-1 p-0.5 rounded hover:bg-slate-200">
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                        </button>
                                    ) : <div className="w-5 h-5 mr-1"/>}
                                    <span className="font-mono text-xs bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 mr-2">{node.code}</span>
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${TYPE_DOT_COLORS[node.type]}`}></span>
                                    <span className="truncate font-medium text-slate-800" title={node.description}>{node.description}</span>
                                </div>
                                {!node.isStandard && (
                                    <div className="flex items-center gap-1">
                                        {!isAssignedList && <button type="button" onClick={() => {setEditingQual(node); setIsQualModalOpen(true)}} title="Modifier" className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-indigo-600"><EditIcon className="w-4 h-4"/></button>}
                                        {!isAssignedList && <button type="button" onClick={() => onDeleteQualification(node.id)} title="Supprimer" className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>}
                                        <button type="button" onClick={() => isAssignedList ? handleUnassign(node.id) : handleAssign(node.id)} title={isAssignedList ? "Retirer" : "Assigner"} className="p-1.5 rounded-full bg-slate-200 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600">
                                            {isAssignedList ? <ArrowLeftIcon className="w-4 h-4" /> : <ArrowRightIcon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {canExpand && isExpanded && <QualificationTree nodes={node.children} isAssignedList={isAssignedList} level={level + 1} />}
                        </div>
                    );
                })}
            </div>
        );
    };

    const availableTree = buildTree(allQualifications.filter(q => !q.isStandard && !assignedIds.includes(q.id)));
    const assignedTree = buildTree([...allQualifications.filter(q => q.isStandard), ...allQualifications.filter(q => assignedIds.includes(q.id))]);

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            {isQualModalOpen && <QualificationModal qualificationToEdit={editingQual} allQualifications={allQualifications} onSave={handleSaveAndCloseQualification} onClose={() => setIsQualModalOpen(false)} />}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b flex-shrink-0">
                        <h3 className="text-xl font-semibold leading-6 text-slate-900">{group ? 'Modifier le Groupe' : 'Nouveau Groupe'}</h3>
                        <div className="mt-4">
                            <label htmlFor="groupName" className="block text-sm font-medium text-slate-700">Nom du groupe</label>
                            <input type="text" name="groupName" id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border"/>
                        </div>
                    </div>
                    <div className="flex-1 p-6 flex gap-6 overflow-hidden">
                        <div className="w-1/2 flex flex-col bg-slate-100 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center p-3 border-b border-slate-200 flex-shrink-0">
                                <h4 className="font-semibold text-slate-800">Qualifications Disponibles</h4>
                                <button type="button" onClick={() => {setEditingQual(null); setIsQualModalOpen(true);}} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm py-1 px-3 rounded-md inline-flex items-center"><PlusIcon className="w-4 h-4 mr-1"/> Ajouter</button>
                            </div>
                            <div className="flex-1 p-3 overflow-y-auto min-h-0"><QualificationTree nodes={availableTree} isAssignedList={false} /></div>
                        </div>
                        <div className="w-1/2 flex flex-col bg-slate-100 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-800 p-3 border-b border-slate-200 flex-shrink-0">Qualifications du Groupe</h4>
                            <div className="flex-1 p-3 overflow-y-auto min-h-0"><QualificationTree nodes={assignedTree} isAssignedList={true} /></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 mt-auto flex-shrink-0 border-t">
                        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50">Annuler</button>
                        <button type="submit" className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Component ---
interface QualificationsManagerProps {
    feature: Feature;
    qualifications: Qualification[];
    qualificationGroups: QualificationGroup[];
    onSaveQualification: (qualification: Qualification) => void;
    onDeleteQualification: (qualificationId: string) => void;
    onSaveQualificationGroup: (group: QualificationGroup, assignedQualIds: string[]) => void;
    onDeleteQualificationGroup: (groupId: string) => void;
}

const QualificationsManager: React.FC<QualificationsManagerProps> = ({ feature, qualifications, qualificationGroups, onSaveQualification, onDeleteQualification, onSaveQualificationGroup, onDeleteQualificationGroup }) => {
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<QualificationGroup | null>(null);

    const handleSaveGroup = (group: QualificationGroup, assignedQualIds: string[]) => {
        onSaveQualificationGroup(group, assignedQualIds);
        setIsGroupModalOpen(false);
    };
    
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {isGroupModalOpen && <GroupEditModal 
                group={editingGroup} 
                allQualifications={qualifications} 
                onSave={handleSaveGroup} 
                onClose={() => setIsGroupModalOpen(false)}
                onSaveQualification={onSaveQualification}
                onDeleteQualification={onDeleteQualification}
            />}
            
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Groupes de Qualifications</h2>
                     <button onClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2"/>Créer un Groupe
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom du Groupe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Qualifications</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {qualificationGroups.map(group => (
                                <tr key={group.id}>
                                    <td className="px-6 py-4 font-medium text-slate-800">{group.name}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {qualifications.filter(q => q.groupId === group.id || q.isStandard).length}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => { setEditingGroup(group); setIsGroupModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                                            <EditIcon className="w-4 h-4 mr-1"/> Modifier
                                        </button>
                                        <button onClick={() => onDeleteQualificationGroup(group.id)} className="text-red-600 hover:text-red-900 inline-flex items-center">
                                            <TrashIcon className="w-4 h-4 mr-1"/> Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QualificationsManager;