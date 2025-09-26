import React, { useState, useEffect, useCallback } from 'react';
import type { SystemLog, VersionInfo, ConnectivityService } from '../types.ts';
import { CpuChipIcon, CircleStackIcon, HddIcon, TimeIcon, ShieldCheckIcon, WifiIcon, TrashIcon, BugAntIcon, FolderIcon } from './Icons.tsx';

interface MonitoringDashboardProps {
    systemLogs: SystemLog[];
    versionInfo: VersionInfo;
    connectivityServices: ConnectivityService[];
    apiCall: any; // AxiosInstance
}

type HealthStatus = 'UP' | 'DEGRADED' | 'DOWN';
type ConnectivityStatus = 'idle' | 'testing' | 'success' | 'failure';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const HealthStatusIndicator: React.FC<{ status: HealthStatus }> = ({ status }) => {
    const config = {
        UP: { text: 'Opérationnel', color: 'bg-green-500', pulseColor: 'bg-green-400' },
        DEGRADED: { text: 'Performance Dégradée', color: 'bg-yellow-500', pulseColor: 'bg-yellow-400' },
        DOWN: { text: 'Panne Majeure', color: 'bg-red-500', pulseColor: 'bg-red-400' },
    };
    const { text, color, pulseColor } = config[status];

    return (
        <div className="flex items-center">
            <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
            </span>
            <span className="ml-3 font-semibold text-slate-700">{text}</span>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<any>; children?: React.ReactNode }> = ({ title, value, icon: Icon, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-600">{title}</h3>
            <Icon className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <div className="mt-auto">{children}</div>
    </div>
);

const ConnectivityTester: React.FC<{ services: ConnectivityService[] }> = ({ services }) => {
    const [statuses, setStatuses] = useState<Record<string, { status: ConnectivityStatus; latency?: number }>>({});

    const runTest = (serviceId: string) => {
        setStatuses(prev => ({ ...prev, [serviceId]: { status: 'testing' } }));
        setTimeout(() => {
            const success = Math.random() > 0.15; // 85% success rate
            setStatuses(prev => ({
                ...prev,
                [serviceId]: {
                    status: success ? 'success' : 'failure',
                    latency: success ? Math.floor(Math.random() * 150) + 20 : undefined,
                },
            }));
        }, Math.random() * 1500 + 500);
    };

    const getStatusIndicator = (status: ConnectivityStatus) => {
        switch (status) {
            case 'success': return <div className="w-3 h-3 rounded-full bg-green-500" title="Succès"></div>;
            case 'failure': return <div className="w-3 h-3 rounded-full bg-red-500" title="Échec"></div>;
            case 'testing': return <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" title="Test en cours..."></div>;
            default: return <div className="w-3 h-3 rounded-full bg-slate-300" title="Inactif"></div>;
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Testeur de Connectivité</h3>
            <div className="space-y-2">
                {services.map(service => (
                    <div key={service.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                        <div className="flex items-center">
                            {getStatusIndicator(statuses[service.id]?.status || 'idle')}
                            <div className="ml-3">
                                <p className="font-medium text-sm text-slate-700">{service.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{service.target}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             {statuses[service.id]?.status === 'success' && (
                                <span className="text-sm font-mono text-green-700">{statuses[service.id]?.latency}ms</span>
                            )}
                             {statuses[service.id]?.status === 'failure' && (
                                <span className="text-sm font-semibold text-red-600">Échec</span>
                            )}
                            <button onClick={() => runTest(service.id)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" disabled={statuses[service.id]?.status === 'testing'}>
                                {statuses[service.id]?.status === 'testing' ? '...' : 'Tester'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ systemLogs, versionInfo, connectivityServices, apiCall }) => {
    const [stats, setStats] = useState({
        cpu: { brand: '', load: 0 },
        ram: { total: 0, used: 0 },
        disk: { total: 0, used: 0 },
        recordings: { size: 0, files: 0 },
        latency: 0,
    });
    const [health, setHealth] = useState<HealthStatus>('UP');
    const [latencyHistory, setLatencyHistory] = useState<number[]>(Array(20).fill(0));

    const fetchStats = useCallback(async () => {
        try {
            const startTime = performance.now();
            const response = await apiCall.get('/system/stats');
            const data = response.data;
            const endTime = performance.now();

            const apiLatency = Math.round(endTime - startTime);
            setStats({
                cpu: data.cpu || { brand: 'N/A', load: 0 },
                ram: data.ram || { total: 0, used: 0 },
                disk: data.disk || { total: 0, used: 0 },
                recordings: data.recordings || { size: 0, files: 0 },
                latency: apiLatency,
            });
            
            setLatencyHistory(prev => [...prev.slice(1), apiLatency]);

            if (parseFloat(data.cpu.load) > 90 || (data.ram.used / data.ram.total) > 0.95) {
                setHealth('DEGRADED');
            } else {
                setHealth('UP');
            }
        } catch (error) {
            console.error("Failed to fetch system stats:", error);
            setHealth('DOWN');
        }
    }, [apiCall]);

    useEffect(() => {
        fetchStats(); // Initial fetch
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const logConfig = {
        INFO: { color: 'bg-sky-100 text-sky-800', icon: ShieldCheckIcon },
        WARNING: { color: 'bg-yellow-100 text-yellow-800', icon: WifiIcon },
        ERROR: { color: 'bg-red-100 text-red-800', icon: BugAntIcon },
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">État du Système</h2>
                <HealthStatusIndicator status={health} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Charge CPU" value={`${stats.cpu.load}%`} icon={CpuChipIcon}>
                     <div className="w-full bg-slate-200 rounded-full h-2 mt-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.cpu.load}%` }}></div></div>
                     <p className="text-xs text-slate-500 mt-2 truncate">{stats.cpu.brand}</p>
                </StatCard>
                <StatCard title="Utilisation RAM" value={`${stats.ram.total > 0 ? ((stats.ram.used / stats.ram.total) * 100).toFixed(1) : 0}%`} icon={CircleStackIcon}>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${stats.ram.total > 0 ? (stats.ram.used / stats.ram.total) * 100 : 0}%` }}></div></div>
                    <p className="text-xs text-slate-500 mt-2">{formatBytes(stats.ram.used)} / {formatBytes(stats.ram.total)}</p>
                </StatCard>
                <StatCard title="Espace Disque" value={`${stats.disk.total > 0 ? ((stats.disk.used / stats.disk.total) * 100).toFixed(1) : 0}%`} icon={HddIcon}>
                     <div className="w-full bg-slate-200 rounded-full h-2 mt-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.disk.total > 0 ? (stats.disk.used / stats.disk.total) * 100 : 0}%` }}></div></div>
                     <p className="text-xs text-slate-500 mt-2">{formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}</p>
                </StatCard>
                <StatCard title="Enregistrements" value={`${stats.recordings.files}`} icon={FolderIcon}>
                    <p className="text-xs text-slate-500 mt-2">Taille totale : {formatBytes(stats.recordings.size)}</p>
                </StatCard>
                <StatCard title="Latence API" value={`${stats.latency}ms`} icon={TimeIcon}>
                    <div className="h-10 mt-2 flex items-end gap-0.5">
                        {latencyHistory.map((val, i) => (
                             <div key={i} className="w-full bg-indigo-300" style={{ height: `${Math.min(100, val / 2)}%` }}></div>
                        ))}
                    </div>
                </StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Journal des Événements Système</h3>
                    <div className="space-y-2 h-72 overflow-y-auto pr-2">
                        {systemLogs.map(log => {
                            const Icon = logConfig[log.level].icon;
                            return (
                                <div key={log.id} className={`flex items-start text-sm p-2 rounded-md ${logConfig[log.level].color}`}>
                                    <Icon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <span className="font-mono text-xs opacity-70 mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        <span className="font-semibold mr-2">[{log.service}]</span>
                                        <span>{log.message}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Versions</h3>
                        <ul className="text-sm space-y-2">
                            {Object.entries(versionInfo).map(([key, value]) => (
                                <li key={key} className="flex justify-between">
                                    <span className="capitalize text-slate-600">{key}</span>
                                    <span className="font-mono font-semibold text-slate-700">{value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg">
                        <TrashIcon className="w-4 h-4"/>
                        Purger les anciens logs
                    </button>
                 </div>
            </div>

            <ConnectivityTester services={connectivityServices} />
        </div>
    );
};

export default MonitoringDashboard;