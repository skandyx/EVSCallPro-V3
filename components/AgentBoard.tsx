import React from 'react';
import type { AgentState, User } from '../types.ts';
import { MicrophoneIcon, PhoneArrowUpRightIcon, AcademicCapIcon, PauseIcon, TrashIcon } from './Icons.tsx';

interface AgentBoardProps {
    agents: AgentState[];
    currentUser: User;
}

const STATUS_CONFIG: { [key in AgentState['status']]: { label: string; color: string } } = {
    'En Attente': { label: 'En Attente', color: 'bg-green-100 text-green-800' },
    'En Appel': { label: 'En Appel', color: 'bg-red-100 text-red-800' },
    'En Post-Appel': { label: 'En Post-Appel', color: 'bg-yellow-100 text-yellow-800' },
    'En Pause': { label: 'En Pause', color: 'bg-slate-200 text-slate-800' },
};

const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const AgentBoard: React.FC<AgentBoardProps> = ({ agents, currentUser }) => {
    
    const hasPermission = currentUser.role === 'Administrateur' || currentUser.role === 'Superviseur';

    const handleAction = (action: string, agentName: string) => {
        alert(`Action (simulation): ${action} sur l'agent ${agentName}`);
    };

    const handleForceLogout = (agentName: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir déconnecter de force l'agent ${agentName} ?`)) {
            alert(`Action (simulation): Déconnexion forcée de l'agent ${agentName}`);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Agent</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Durée</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Appels</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">TMC</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                    {agents.map(agent => {
                        const agentFullName = `${agent.firstName} ${agent.lastName}`;
                        const canCoach = hasPermission && agent.status === 'En Appel';
                        const canForcePause = hasPermission && agent.status !== 'En Pause';
                        return (
                        <tr key={agent.id}>
                            <td className="px-4 py-3 font-medium text-slate-800">{agentFullName}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_CONFIG[agent.status].color}`}>
                                    {STATUS_CONFIG[agent.status].label}
                                </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600">{formatDuration(agent.statusDuration)}</td>
                            <td className="px-4 py-3 text-slate-600">{agent.callsHandledToday}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono">{formatDuration(agent.averageHandlingTime)}</td>
                            <td className="px-4 py-3 text-center space-x-1">
                                <button onClick={() => handleAction('Écoute', agentFullName)} disabled={!canCoach} title="Écouter (Whisper)" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><MicrophoneIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleAction('Intervention', agentFullName)} disabled={!canCoach} title="Intervenir (Barge)" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><PhoneArrowUpRightIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleAction('Coaching', agentFullName)} disabled={!canCoach} title="Coacher" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><AcademicCapIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleAction('Forcer Pause', agentFullName)} disabled={!canForcePause} title="Forcer la Pause" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><PauseIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleForceLogout(agentFullName)} disabled={!hasPermission} title="Forcer la Déconnexion" className="p-1 rounded-md text-red-500 hover:bg-red-100 disabled:text-red-200 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4"/></button>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AgentBoard;