import React, { useState, useEffect, useReducer, useMemo } from 'react';
import type { Feature, AgentState, ActiveCall, CampaignState, User, Campaign } from '../types.ts';
import AgentBoard from './AgentBoard.tsx';
import CallBoard from './CallBoard.tsx';
import CampaignBoard from './CampaignBoard.tsx';
import { UsersIcon, PhoneIcon, ChartBarIcon } from './Icons.tsx';
import wsClient from '../src/services/wsClient.ts';

interface SupervisionDashboardProps {
    feature: Feature;
    users: User[];
    campaigns: Campaign[];
    currentUser: User | null;
}

type Tab = 'live' | 'agents' | 'calls' | 'campaigns';

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.FC<any> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full mr-4">
                <Icon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    </div>
);

// State and Reducer for live data
interface LiveState {
    agentStates: AgentState[];
    activeCalls: ActiveCall[];
    campaignStates: CampaignState[];
}

type LiveAction =
    | { type: 'INIT_STATE'; payload: { agents: User[], campaigns: Campaign[] } }
    | { type: 'AGENT_STATUS_UPDATE'; payload: Partial<AgentState> & { agentId: string } }
    | { type: 'NEW_CALL'; payload: ActiveCall }
    | { type: 'CALL_HANGUP'; payload: { callId: string } }
    | { type: 'TICK' };

const initialState: LiveState = {
    agentStates: [],
    activeCalls: [],
    campaignStates: [],
};

function liveDataReducer(state: LiveState, action: LiveAction): LiveState {
    switch (action.type) {
        case 'INIT_STATE': {
            // FIX: Explicitly type `initialAgentStates` as `AgentState[]` to ensure the object created inside `map` conforms to the `AgentState` interface, particularly ensuring the `status` literal type is correctly inferred.
            const initialAgentStates: AgentState[] = action.payload.agents
                .filter(u => u.role === 'Agent')
                .map(agent => ({
                    ...agent,
                    status: 'En Attente',
                    statusDuration: 0,
                    callsHandledToday: 0,
                    averageHandlingTime: 0,
                }));
            // FIX: Explicitly type `initialCampaignStates` as `CampaignState[]` to ensure the object created inside `map` conforms to the `CampaignState` interface, particularly ensuring the `status` literal type is correctly inferred.
            const initialCampaignStates: CampaignState[] = action.payload.campaigns.map(c => ({
                id: c.id, name: c.name, status: c.isActive ? 'running' : 'stopped',
                offered: 0, answered: 0, hitRate: 0, agentsOnCampaign: 0,
            }));
            return { agentStates: initialAgentStates, activeCalls: [], campaignStates: initialCampaignStates };
        }
        case 'AGENT_STATUS_UPDATE':
            return {
                ...state,
                agentStates: state.agentStates.map(agent =>
                    agent.id === action.payload.agentId
                        ? { ...agent, ...action.payload, statusDuration: 0 } // Reset timer on status change
                        : agent
                ),
            };
        case 'NEW_CALL':
            if (state.activeCalls.some(call => call.id === action.payload.id)) return state;
            return { ...state, activeCalls: [...state.activeCalls, { ...action.payload, duration: 0 }] };
        case 'CALL_HANGUP':
            return { ...state, activeCalls: state.activeCalls.filter(call => call.id !== action.payload.callId) };
        case 'TICK':
             return {
                ...state,
                agentStates: state.agentStates.map(a => ({ ...a, statusDuration: a.statusDuration + 1 })),
                activeCalls: state.activeCalls.map(c => ({ ...c, duration: c.duration + 1 })),
            };
        default:
            return state;
    }
}

const SupervisionDashboard: React.FC<SupervisionDashboardProps> = ({ feature, users, campaigns, currentUser }) => {
    const [activeTab, setActiveTab] = useState<Tab>('live');
    const [state, dispatch] = useReducer(liveDataReducer, initialState);

    useEffect(() => {
        dispatch({ type: 'INIT_STATE', payload: { agents: users, campaigns } });
    }, [users, campaigns]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            wsClient.connect();
        }

        const handleWebSocketMessage = (event: any) => {
            if (event.type && event.payload) {
                const actionType = event.type.replace(/([A-Z])/g, '_$1').toUpperCase();
                dispatch({ type: actionType as any, payload: event.payload });
            }
        };

        const unsubscribe = wsClient.onMessage(handleWebSocketMessage);
        const timer = setInterval(() => dispatch({ type: 'TICK' }), 1000);

        return () => {
            unsubscribe();
            clearInterval(timer);
            wsClient.disconnect();
        };
    }, []);

    const kpis = useMemo(() => ({
        agentsReady: state.agentStates.filter(a => a.status === 'En Attente').length,
        agentsOnCall: state.agentStates.filter(a => a.status === 'En Appel').length,
        agentsOnWrapup: state.agentStates.filter(a => a.status === 'En Post-Appel').length,
        agentsOnPause: state.agentStates.filter(a => a.status === 'En Pause').length,
        activeCalls: state.activeCalls.length,
    }), [state.agentStates, state.activeCalls]);

    const renderContent = () => {
        if (!currentUser) return null;
        switch (activeTab) {
            case 'live':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <KpiCard title="Agents en Attente" value={kpis.agentsReady} icon={UsersIcon} />
                        <KpiCard title="Agents en Appel" value={kpis.agentsOnCall} icon={PhoneIcon} />
                        <KpiCard title="Agents en Post-Appel" value={kpis.agentsOnWrapup} icon={UsersIcon} />
                        <KpiCard title="Agents en Pause" value={kpis.agentsOnPause} icon={UsersIcon} />
                        <KpiCard title="Appels Actifs" value={kpis.activeCalls} icon={ChartBarIcon} />
                    </div>
                );
            case 'agents':
                return <AgentBoard agents={state.agentStates} currentUser={currentUser} />;
            case 'calls':
                return <CallBoard calls={state.activeCalls} agents={users} campaigns={campaigns} />;
            case 'campaigns':
                return <CampaignBoard campaignStates={state.campaignStates} />;
            default:
                return null;
        }
    };
    
    const TabButton: React.FC<{ tabName: Tab; label: string; }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === tabName ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Panneau de Contrôle</h2>
                    <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg">
                        <TabButton tabName="live" label="Live" />
                        <TabButton tabName="agents" label="Agents" />
                        <TabButton tabName="calls" label="Appels" />
                        <TabButton tabName="campaigns" label="Campagnes" />
                    </div>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default SupervisionDashboard;