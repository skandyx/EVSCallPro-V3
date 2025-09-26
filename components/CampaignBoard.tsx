import React from 'react';
import type { CampaignState } from '../types.ts';
import { PauseIcon, PlayIcon, BoltIcon, TrashIcon } from './Icons.tsx';

interface CampaignBoardProps {
    campaignStates: CampaignState[];
}

const CampaignBoard: React.FC<CampaignBoardProps> = ({ campaignStates }) => {

    const handleAction = (action: string, campaignName: string) => {
        alert(`Action (simulation): ${action} sur la campagne ${campaignName}`);
    };
    
    const handleStop = (campaignName: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir arrêter définitivement la campagne ${campaignName} ?`)) {
            handleAction('Arrêter', campaignName);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Campagne</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Offerts</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Répondus</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Taux de succès</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                    {campaignStates.map(campaign => {
                        const isRunning = campaign.status === 'running';
                        return (
                            <tr key={campaign.id}>
                                <td className="px-4 py-3 font-medium text-slate-800">{campaign.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        isRunning ? 'bg-green-100 text-green-800' : 
                                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-200 text-slate-800'
                                    }`}>
                                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{campaign.offered}</td>
                                <td className="px-4 py-3 text-slate-600">{campaign.answered}</td>
                                <td className="px-4 py-3 text-slate-600">{campaign.hitRate.toFixed(1)}%</td>
                                <td className="px-4 py-3 text-center space-x-1">
                                    {isRunning ? (
                                        <button onClick={() => handleAction('Mettre en pause', campaign.name)} title="Mettre en pause" className="p-1 rounded-md text-slate-500 hover:bg-slate-100"><PauseIcon className="w-4 h-4"/></button>
                                    ) : (
                                        <button onClick={() => handleAction('Démarrer', campaign.name)} title="Démarrer" className="p-1 rounded-md text-slate-500 hover:bg-slate-100"><PlayIcon className="w-4 h-4"/></button>
                                    )}
                                    <button onClick={() => handleAction('Booster', campaign.name)} title="Booster la campagne" className="p-1 rounded-md text-slate-500 hover:bg-slate-100"><BoltIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleStop(campaign.name)} title="Arrêter la campagne" className="p-1 rounded-md text-red-500 hover:bg-red-100"><TrashIcon className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {campaignStates.length === 0 && <p className="text-center py-8 text-slate-500">Aucune campagne à superviser.</p>}
        </div>
    );
};

export default CampaignBoard;