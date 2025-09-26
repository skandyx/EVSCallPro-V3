
import React, { useState } from 'react';
import type { Feature, User, UserGroup } from '../types.ts';
import { PlusIcon, EditIcon, TrashIcon } from './Icons.tsx';

// Modal component for creating/editing a group
interface GroupModalProps {
    group: UserGroup | null;
    users: User[];
    onSave: (group: UserGroup) => void;
    onClose: () => void;
}

const GroupModal: React.FC<GroupModalProps> = ({ group, users, onSave, onClose }) => {
    const [formData, setFormData] = useState<UserGroup>(group || {
        id: `group-${Date.now()}`,
        name: '',
        memberIds: [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, name: e.target.value }));
    };

    const handleMemberChange = (userId: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentMembers = prev.memberIds || [];
            if (isChecked) {
                return { ...prev, memberIds: [...new Set([...currentMembers, userId])] };
            } else {
                return { ...prev, memberIds: currentMembers.filter(id => id !== userId) };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const agents = users.filter(u => u.role === 'Agent' && u.isActive);

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-medium leading-6 text-slate-900">{group ? 'Modifier le Groupe' : 'Nouveau Groupe'}</h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nom du groupe</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Membres du groupe (Agents)</label>
                                <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-slate-300 p-2 space-y-2 bg-slate-50">
                                    {agents.length > 0 ? agents.map(agent => (
                                        <div key={agent.id} className="flex items-center">
                                            <input
                                                id={`agent-${agent.id}`}
                                                type="checkbox"
                                                checked={formData.memberIds.includes(agent.id)}
                                                onChange={(e) => handleMemberChange(agent.id, e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                            />
                                            <label htmlFor={`agent-${agent.id}`} className="ml-3 text-sm text-slate-600">{agent.firstName} {agent.lastName}</label>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-slate-500 italic">Aucun agent actif disponible.</p>
                                    )}
                                </div>
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


// Main component for the Group Management feature
interface GroupManagerProps {
    feature: Feature;
    users: User[];
    userGroups: UserGroup[];
    onSaveUserGroup: (group: UserGroup) => void;
    onDeleteUserGroup: (groupId: string) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ feature, users, userGroups, onSaveUserGroup, onDeleteUserGroup }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);

    const handleAddNew = () => {
        setEditingGroup(null);
        setIsModalOpen(true);
    };

    const handleEdit = (group: UserGroup) => {
        setEditingGroup(group);
        setIsModalOpen(true);
    };

    const handleSave = (group: UserGroup) => {
        onSaveUserGroup(group);
        setIsModalOpen(false);
        setEditingGroup(null);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {isModalOpen && <GroupModal group={editingGroup} users={users} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Groupes d'agents</h2>
                    <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Créer un groupe
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom du Groupe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre de Membres</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {userGroups.map(group => (
                                <tr key={group.id}>
                                    <td className="px-6 py-4 font-medium text-slate-800">{group.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{group.memberIds.length}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleEdit(group)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="w-4 h-4 inline-block -mt-1"/> Modifier</button>
                                        <button onClick={() => onDeleteUserGroup(group.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-4 h-4 inline-block -mt-1"/> Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {userGroups.length === 0 && <p className="text-center py-8 text-slate-500">Aucun groupe créé.</p>}
                </div>
            </div>
        </div>
    );
};

export default GroupManager;
