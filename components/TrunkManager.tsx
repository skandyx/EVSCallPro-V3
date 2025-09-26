import React, { useState } from 'react';
import type { Feature, Trunk } from '../types.ts';
import { PlusIcon, EditIcon, TrashIcon, InformationCircleIcon } from './Icons.tsx';

interface TrunkModalProps {
    trunk: Trunk | null;
    onSave: (trunk: Trunk) => void;
    onClose: () => void;
}

const TrunkModal: React.FC<TrunkModalProps> = ({ trunk, onSave, onClose }) => {
    const [formData, setFormData] = useState<Trunk>(trunk || {
        id: `trunk-${Date.now()}`,
        name: '',
        domain: '',
        login: '',
        password: '',
        authType: 'register',
        dialPattern: '_0.',
        inboundContext: 'from-trunk',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-medium leading-6 text-slate-900">{trunk ? 'Modifier le Trunk SIP' : 'Nouveau Trunk SIP'}</h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nom</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Ex: Fournisseur A"/>
                            </div>
                            <div>
                                <label htmlFor="authType" className="block text-sm font-medium text-slate-700">Type d'Authentification</label>
                                <select name="authType" id="authType" value={formData.authType} onChange={handleChange} className="mt-1 block w-full p-2 border bg-white border-slate-300 rounded-md">
                                    <option value="register">Par Enregistrement (Login/Pass)</option>
                                    <option value="ip">Par Adresse IP</option>
                                </select>
                            </div>
                            {formData.authType === 'register' ? (
                                <>
                                    <div>
                                        <label htmlFor="domain" className="block text-sm font-medium text-slate-700">Domaine / Hôte</label>
                                        <input type="text" name="domain" id="domain" value={formData.domain} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="sip.fournisseur.com"/>
                                    </div>
                                    <div>
                                        <label htmlFor="login" className="block text-sm font-medium text-slate-700">Identifiant</label>
                                        <input type="text" name="login" id="login" value={formData.login} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md"/>
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Mot de passe</label>
                                        <input type="password" name="password" id="password" value={formData.password || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md"/>
                                    </div>
                                    <div>
                                        <label htmlFor="registerString" className="block text-sm font-medium text-slate-700">Chaîne d'enregistrement (Optionnel)</label>
                                        <input type="text" name="registerString" id="registerString" value={formData.registerString || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md font-mono text-xs" placeholder="login:password@sip.provider.com/login"/>
                                        <p className="text-xs text-slate-500 mt-1">À remplir uniquement si votre fournisseur vous donne une chaîne spécifique.</p>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label htmlFor="domain" className="block text-sm font-medium text-slate-700">Adresse IP du Fournisseur</label>
                                    <input type="text" name="domain" id="domain" value={formData.domain} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="123.45.67.89"/>
                                </div>
                            )}
                             <hr className="my-2"/>
                             <div>
                                <label htmlFor="dialPattern" className="block text-sm font-medium text-slate-700">Modèle de Numérotation (Dial Pattern)</label>
                                <input type="text" name="dialPattern" id="dialPattern" value={formData.dialPattern} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md font-mono text-sm" placeholder="_0."/>
                                <p className="text-xs text-slate-500 mt-1">Définit quels numéros sortent par ce trunk. Ex: `_0.` pour les numéros français, `_00.` pour l'international.</p>
                            </div>
                            <div>
                                <label htmlFor="inboundContext" className="block text-sm font-medium text-slate-700">Contexte Entrant</label>
                                <input type="text" name="inboundContext" id="inboundContext" value={formData.inboundContext} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md font-mono text-sm"/>
                                <p className="text-xs text-slate-500 mt-1">Contexte Asterisk pour les appels entrants via ce trunk.</p>
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

interface TrunkManagerProps {
    feature: Feature;
    trunks: Trunk[];
    onSaveTrunk: (trunk: Trunk) => void;
    onDeleteTrunk: (trunkId: string) => void;
}

const TrunkManager: React.FC<TrunkManagerProps> = ({ feature, trunks, onSaveTrunk, onDeleteTrunk }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrunk, setEditingTrunk] = useState<Trunk | null>(null);

    const handleAddNew = () => {
        setEditingTrunk(null);
        setIsModalOpen(true);
    };

    const handleEdit = (trunk: Trunk) => {
        setEditingTrunk(trunk);
        setIsModalOpen(true);
    };

    const handleSave = (trunk: Trunk) => {
        onSaveTrunk(trunk);
        setIsModalOpen(false);
        setEditingTrunk(null);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {isModalOpen && <TrunkModal trunk={editingTrunk} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Trunks configurés</h2>
                    <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />Ajouter un Trunk
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Domaine / IP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type Auth.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dial Pattern</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {trunks.map(trunk => (
                                <tr key={trunk.id}>
                                    <td className="px-6 py-4 font-medium text-slate-800">{trunk.name}</td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{trunk.domain}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{trunk.authType === 'register' ? 'Enregistrement' : 'IP'}</td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{trunk.dialPattern}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleEdit(trunk)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"><EditIcon className="w-4 h-4 mr-1"/> Modifier</button>
                                        <button onClick={() => onDeleteTrunk(trunk.id)} className="text-red-600 hover:text-red-900 inline-flex items-center"><TrashIcon className="w-4 h-4 mr-1"/> Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {trunks.length === 0 && <p className="text-center py-8 text-slate-500">Aucun Trunk SIP configuré.</p>}
                </div>
            </div>
        </div>
    );
};

export default TrunkManager;