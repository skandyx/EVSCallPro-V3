import React, { useState } from 'react';
import type { Feature, Site } from '../types.ts';
import { PlusIcon, EditIcon, TrashIcon } from './Icons.tsx';

interface SiteModalProps {
    site: Site | null;
    onSave: (site: Site) => void;
    onClose: () => void;
}

const SiteModal: React.FC<SiteModalProps> = ({ site, onSave, onClose }) => {
    const [formData, setFormData] = useState<Site>(site || {
        id: `site-${Date.now()}`,
        name: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                        <h3 className="text-lg font-medium leading-6 text-slate-900">{site ? 'Modifier le Site' : 'Nouveau Site'}</h3>
                        <p className="mt-1 text-sm text-slate-500">Configurez le nom du site pour le routage des appels.</p>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nom du site</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Ex: Agence de Paris"/>
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

interface SiteManagerProps {
    feature: Feature;
    sites: Site[];
    onSaveSite: (site: Site) => void;
    onDeleteSite: (siteId: string) => void;
}

const SiteManager: React.FC<SiteManagerProps> = ({ feature, sites, onSaveSite, onDeleteSite }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);

    const handleAddNew = () => {
        setEditingSite(null);
        setIsModalOpen(true);
    };

    const handleEdit = (site: Site) => {
        setEditingSite(site);
        setIsModalOpen(true);
    };

    const handleSave = (site: Site) => {
        onSaveSite(site);
        setIsModalOpen(false);
        setEditingSite(null);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {isModalOpen && <SiteModal site={editingSite} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Sites configurés</h2>
                    <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />Ajouter un Site
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {sites.map(site => (
                                <tr key={site.id}>
                                    <td className="px-6 py-4 font-medium text-slate-800">{site.name}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleEdit(site)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="w-4 h-4 inline-block -mt-1"/> Modifier</button>
                                        <button onClick={() => onDeleteSite(site.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-4 h-4 inline-block -mt-1"/> Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sites.length === 0 && <p className="text-center py-8 text-slate-500">Aucun site configuré.</p>}
                </div>
            </div>
        </div>
    );
};

export default SiteManager;