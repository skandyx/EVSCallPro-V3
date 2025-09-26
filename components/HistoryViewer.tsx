
import React, { useState, useMemo } from 'react';
import type { Feature, CallHistoryRecord, User, Campaign, Qualification } from '../types.ts';
import { InformationCircleIcon } from './Icons.tsx';

interface HistoryViewerProps {
    feature: Feature;
    callHistory: CallHistoryRecord[];
    users: User[];
    campaigns: Campaign[];
    qualifications: Qualification[];
}

const HistoryViewer: React.FC<HistoryViewerProps> = ({ feature, callHistory, users, campaigns, qualifications }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        direction: 'all',
        startDate: '',
        endDate: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredHistory = useMemo(() => {
        return callHistory.filter(record => {
            const recordDate = new Date(record.timestamp);

            if (filters.direction !== 'all' && record.direction !== filters.direction) {
                return false;
            }
            if (filters.startDate && recordDate < new Date(filters.startDate)) {
                return false;
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (recordDate > endDate) {
                    return false;
                }
            }
            if (searchTerm) {
                const lowerSearchTerm = searchTerm.toLowerCase();
                const agentName = users.find(u => u.id === record.agentId)?.firstName.toLowerCase() || '';
                const campaignName = campaigns.find(c => c.id === record.campaignId)?.name.toLowerCase() || '';
                return (
                    record.callerNumber.includes(lowerSearchTerm) ||
                    agentName.includes(lowerSearchTerm) ||
                    campaignName.includes(lowerSearchTerm)
                );
            }
            return true;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [callHistory, searchTerm, filters, users, campaigns]);
    
    const findEntityName = (id: string | null, collection: Array<{id: string, name?: string, firstName?: string, lastName?: string, description?: string}>) => {
        if (!id) return <span className="text-slate-400 italic">N/A</span>;
        const item = collection.find(i => i.id === id);
        return item?.name || `${item?.firstName} ${item?.lastName}` || item?.description || 'Inconnu';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="search"
                        placeholder="Rechercher par numéro, agent..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="md:col-span-2 p-2 border border-slate-300 rounded-md"
                    />
                    <select name="direction" value={filters.direction} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-md bg-white">
                        <option value="all">Toutes directions</option>
                        <option value="inbound">Entrant</option>
                        <option value="outbound">Sortant</option>
                    </select>
                     <div className="grid grid-cols-2 gap-2">
                         <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-md bg-white"/>
                         <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-md bg-white"/>
                     </div>
                </div>

                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & Heure</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Direction</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Numéro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Agent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Campagne</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Durée</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Qualification</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                            {filteredHistory.map(record => (
                                <tr key={record.id}>
                                    <td className="px-6 py-4 text-slate-600">{new Date(record.timestamp).toLocaleString('fr-FR')}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${record.direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{record.direction}</span></td>
                                    <td className="px-6 py-4 font-mono text-slate-800">{record.callerNumber}</td>
                                    <td className="px-6 py-4 font-medium">{findEntityName(record.agentId, users)}</td>
                                    <td className="px-6 py-4">{findEntityName(record.campaignId, campaigns)}</td>
                                    <td className="px-6 py-4 font-mono">{`${Math.floor(record.duration / 60)}m ${record.duration % 60}s`}</td>
                                    <td className="px-6 py-4">{findEntityName(record.qualificationId, qualifications)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredHistory.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <InformationCircleIcon className="w-12 h-12 mx-auto text-slate-400"/>
                            <h3 className="mt-2 text-lg font-semibold">Aucun enregistrement trouvé</h3>
                            <p className="mt-1 text-sm">Essayez d'ajuster vos filtres de recherche.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryViewer;
