import React, { useState } from 'react';
import type { Feature, Did, Trunk, IvrFlow } from '../types.ts';
import { PlusIcon, EditIcon, TrashIcon } from './Icons.tsx';

interface DidModalProps {
    did: Did | null;
    trunks: Trunk[];
    ivrFlows: IvrFlow[];
    onSave: (did: Did) => void;
    onClose: () => void;
}

const DidModal: React.FC<DidModalProps> = ({ did, trunks, ivrFlows, onSave, onClose }) => {
    const [formData, setFormData] = useState<Did>(did || {
        id: `did-${Date.now()}`,
        number: '',
        description: '',
        trunkId: trunks[0]?.id || '',
        ivrFlowId: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === 'null' ? null : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-medium leading-6 text-slate-900">{did ? 'Modifier le numéro' : 'Nouveau Numéro (SDA)'}</h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="number" className="block text-sm font-medium text-slate-700">Numéro de téléphone</label>
                                <input type="tel" name="number" id="number" value={formData.number} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Ex: 0123456789"/>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                                <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Ex: Numéro du support technique"/>
                            </div>
                            <div>
                                <label htmlFor="trunkId" className="block text-sm font-medium text-slate-700">Trunk SIP</label>
                                <select name="trunkId" id="trunkId" value={formData.trunkId} onChange={handleChange} required className="mt-1 block w-full p-2 border bg-white border-slate-300 rounded-md">
                                    {trunks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="ivrFlowId" className="block text-sm font-medium text-slate-700">Destination (Flux SVI)</label>
                                <select name="ivrFlowId" id="ivrFlowId" value={formData.ivrFlowId || 'null'} onChange={handleChange} className="mt-1 block w-full p-2 border bg-white border-slate-300 rounded-md">
                                    <option value="null">Aucune (appel non routé)</option>
                                    {ivrFlows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
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

interface DidManagerProps {
    feature: Feature;
    dids: Did[];
    trunks: Trunk[];
    ivrFlows: IvrFlow[];
    onSaveDid: (did: Did) => void;
    onDeleteDid: (didId: string) => void;
}

const DidManager: React.FC<DidManagerProps> = ({ feature, dids, trunks, ivrFlows, onSaveDid, onDeleteDid }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDid, setEditingDid] = useState<Did | null>(null);

    const handleAddNew = () => {
        if (trunks.length === 0) {
            alert("Veuillez d'abord créer un Trunk SIP avant d'ajouter un numéro.");
            return;
        }
        setEditingDid(null);
        setIsModalOpen(true);
    };

    const handleEdit = (did: Did) => {
        setEditingDid(did);
        setIsModalOpen(true);
    };

    const handleSave = (did: Did) => {
        onSaveDid(did);
        setIsModalOpen(false);
        setEditingDid(null);
    };

    const getIvrFlowName = (flowId: string | null) => {
        if (!flowId) return <span className="text-slate-400 italic">Non assigné</span>;
        return ivrFlows.find(f => f.id === flowId)?.name || <span className="text-red-500">Flux introuvable</span>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {isModalOpen && <DidModal did={editingDid} trunks={trunks} ivrFlows={ivrFlows} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Numéros configurés</h2>
                    <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />Ajouter un numéro
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Numéro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Destination</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {dids.map(did => (
                                <tr key={did.id}>
                                    <td className="px-6 py-4 font-medium text-slate-800 font-mono">{did.number}</td>
                                    <td className="px-6 py-4 text-slate-600">{did.description}</td>
                                    <td className="px-6 py-4 text-slate-600">{getIvrFlowName(did.ivrFlowId)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleEdit(did)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="w-4 h-4 inline-block -mt-1"/> Modifier</button>
                                        <button onClick={() => onDeleteDid(did.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-4 h-4 inline-block -mt-1"/> Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {dids.length === 0 && <p className="text-center py-8 text-slate-500">Aucun numéro configuré.</p>}
                </div>
            </div>
        </div>
    );
};

export default DidManager;
