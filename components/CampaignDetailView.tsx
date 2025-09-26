
import React, { useState } from 'react';
import type { Campaign, Contact, SavedScript } from '../types.ts';
import { ArrowLeftIcon, UserCircleIcon, ChartBarIcon, WrenchScrewdriverIcon, TrashIcon } from './Icons.tsx';

interface CampaignDetailViewProps {
    campaign: Campaign;
    script: SavedScript | null;
    onBack: () => void;
    onSaveCampaign: (campaign: Campaign) => void;
    onUpdateContact: (contact: Contact) => void;
    onDeleteContacts: (contactIds: string[]) => void;
}

const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({ campaign, script, onBack, onSaveCampaign, onUpdateContact, onDeleteContacts }) => {
    const [activeTab, setActiveTab] = useState<'contacts' | 'stats' | 'settings'>('contacts');

    const renderContent = () => {
        switch (activeTab) {
            case 'contacts':
                return <ContactList contacts={campaign.contacts} />;
            case 'stats':
                return <div className="text-center p-8 text-slate-500">Les statistiques de la campagne seront affichées ici.</div>;
            case 'settings':
                return <div className="text-center p-8 text-slate-500">Les paramètres de la campagne seront modifiables ici.</div>;
            default:
                return null;
        }
    };
    
    const TabButton: React.FC<{ tab: 'contacts' | 'stats' | 'settings', label: string, icon: React.FC<any> }> = ({ tab, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header>
                <button onClick={onBack} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-2 mb-4">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Retour à la liste des campagnes
                </button>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{campaign.name}</h1>
                <p className="mt-2 text-lg text-slate-600">{campaign.description}</p>
                {script && <p className="mt-1 text-sm text-slate-500">Script associé: <span className="font-semibold">{script.name}</span></p>}
            </header>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-2 border-b">
                    <nav className="flex space-x-2">
                       <TabButton tab="contacts" label="Contacts" icon={UserCircleIcon} />
                       <TabButton tab="stats" label="Statistiques" icon={ChartBarIcon} />
                       <TabButton tab="settings" label="Paramètres" icon={WrenchScrewdriverIcon} />
                    </nav>
                </div>
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};


const ContactList: React.FC<{ contacts: Contact[] }> = ({ contacts }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(contacts.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    return (
        <div>
            <div className="p-4 flex justify-between items-center bg-slate-50 border-b">
                 <h3 className="text-lg font-semibold text-slate-800">Liste des Contacts ({contacts.length})</h3>
                 <button disabled={selectedIds.length === 0} className="text-sm text-red-600 font-semibold inline-flex items-center gap-1 disabled:text-slate-400 disabled:cursor-not-allowed">
                     <TrashIcon className="w-4 h-4" /> Supprimer la sélection ({selectedIds.length})
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === contacts.length && contacts.length > 0} /></th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase">Prénom</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase">Nom</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase">Téléphone</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase">Code Postal</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {contacts.map(contact => (
                            <tr key={contact.id}>
                                <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={e => handleSelectOne(contact.id, e.target.checked)} /></td>
                                <td className="px-4 py-2">{contact.firstName}</td>
                                <td className="px-4 py-2">{contact.lastName}</td>
                                <td className="px-4 py-2 font-mono">{contact.phoneNumber}</td>
                                <td className="px-4 py-2">{contact.postalCode}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        contact.status === 'pending' ? 'bg-blue-100 text-blue-800' : 
                                        contact.status === 'called' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {contact.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {contacts.length === 0 && <p className="text-center py-8 text-slate-500">Aucun contact dans cette campagne.</p>}
            </div>
        </div>
    );
};

export default CampaignDetailView;
