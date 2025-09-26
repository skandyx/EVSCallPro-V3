

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Feature, CallHistoryRecord, User, Campaign, Qualification, AgentSession } from '../types.ts';
import { ArrowUpTrayIcon, TimeIcon, PhoneIcon, ChartBarIcon } from './Icons.tsx';

// Déclaration pour TypeScript afin de reconnaître les variables globales injectées par les scripts CDN
declare var jspdf: any;
declare var Chart: any;

interface ReportingDashboardProps {
    feature: Feature;
    callHistory: CallHistoryRecord[];
    agentSessions: AgentSession[];
    users: User[];
    campaigns: Campaign[];
    qualifications: Qualification[];
}

const getStartDate = (range: string): Date => {
    const now = new Date();
    if (range === 'last7days') {
        now.setDate(now.getDate() - 7);
    } else if (range === 'last30days') {
        now.setDate(now.getDate() - 30);
    } else if (range === 'thismonth') {
        now.setDate(1);
    }
    now.setHours(0, 0, 0, 0);
    return now;
};

const formatDuration = (seconds: number, type: 'full' | 'short' = 'short') => {
    if(isNaN(seconds) || seconds < 0) return type === 'full' ? '0h 0m 0s' : '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if(type === 'full') return `${h}h ${m}m ${s}s`;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// FIX: Changed return type to React.ReactNode to resolve type ambiguity with global DOM Element.
const findEntityName = (id: string | null, collection: Array<{id: string, name?: string, firstName?: string, lastName?: string, description?: string}>, returnString: boolean = false): string | React.ReactNode => {
    if (!id) return returnString ? 'N/A' : <span className="text-slate-400 italic">N/A</span>;
    const item = collection.find(i => i.id === id);
    if (!item) return returnString ? 'Inconnu' : <span className="text-red-500">Inconnu</span>;
    const name = item.name || `${item.firstName} ${item.lastName}` || item.description;
    return returnString ? (name || '') : <>{name || ''}</>;
};

type ReportTab = 'timesheet' | 'campaign' | 'agent' | 'history' | 'charts';

const ChartComponent: React.FC<{ type: string; data: any; options: any; }> = ({ type, data, options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (canvasRef.current) {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                chartRef.current = new Chart(ctx, {
                    type,
                    data,
                    options,
                });
            }
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [type, data, options]);

    return <canvas ref={canvasRef}></canvas>;
};

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ feature, callHistory, agentSessions, users, campaigns, qualifications }) => {
    
    const [activeTab, setActiveTab] = useState<ReportTab>('charts');
    const [filters, setFilters] = useState({
        dateRange: 'last7days',
        startDate: getStartDate('last7days').toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        campaignId: 'all',
        agentId: 'all',
    });

    const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const range = e.target.value;
        setFilters(f => ({
            ...f,
            dateRange: range,
            startDate: getStartDate(range).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
        }));
    };
    
    const dateFilteredData = useMemo(() => {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        
        const calls = callHistory.filter(call => {
            const callDate = new Date(call.timestamp);
            return callDate >= start && callDate <= end;
        });

        const sessions = agentSessions.filter(session => {
             const sessionDate = new Date(session.loginTime);
             return sessionDate >= start && sessionDate <= end;
        });

        return { calls, sessions };
    }, [callHistory, agentSessions, filters.startDate, filters.endDate]);

    const filteredHistory = useMemo(() => {
        return dateFilteredData.calls.filter(call => {
            if (filters.campaignId !== 'all' && call.campaignId !== filters.campaignId) return false;
            if (filters.agentId !== 'all' && call.agentId !== filters.agentId) return false;
            return true;
        });
    }, [dateFilteredData.calls, filters.campaignId, filters.agentId]);

    const kpis = useMemo(() => {
        const totalCalls = filteredHistory.length;
        const totalDuration = filteredHistory.reduce((acc, call) => acc + call.duration, 0);
        const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
        const positiveQuals = filteredHistory.filter(call => {
            const qual = qualifications.find(q => q.id === call.qualificationId);
            return qual?.type === 'positive';
        }).length;
        const successRate = totalCalls > 0 ? (positiveQuals / totalCalls) * 100 : 0;
        
        const totalAgentTime = users.filter(u => u.role === 'Agent').length * 8 * 3600;
        const occupancy = totalAgentTime > 0 ? (totalDuration / totalAgentTime) * 100 : 0;

        return { totalCalls, totalDuration, avgDuration, successRate, occupancy };
    }, [filteredHistory, qualifications, users]);
    
    const campaignReportData = useMemo(() => {
        const report: { [key: string]: { name: string, calls: number, totalDuration: number, success: number } } = {};
        filteredHistory.forEach(call => {
            if (!call.campaignId) return;
            if (!report[call.campaignId]) {
                report[call.campaignId] = { name: findEntityName(call.campaignId, campaigns, true) as string, calls: 0, totalDuration: 0, success: 0 };
            }
            report[call.campaignId].calls++;
            report[call.campaignId].totalDuration += call.duration;
            const qual = qualifications.find(q => q.id === call.qualificationId);
            if(qual?.type === 'positive') report[call.campaignId].success++;
        });
        return Object.values(report);
    }, [filteredHistory, campaigns, qualifications]);

     const agentReportData = useMemo(() => {
        const report: { [key: string]: { name: string, calls: number, totalDuration: number, success: number } } = {};
        filteredHistory.forEach(call => {
            if (!report[call.agentId]) {
                report[call.agentId] = { name: findEntityName(call.agentId, users, true) as string, calls: 0, totalDuration: 0, success: 0 };
            }
            report[call.agentId].calls++;
            report[call.agentId].totalDuration += call.duration;
            const qual = qualifications.find(q => q.id === call.qualificationId);
            if(qual?.type === 'positive') report[call.agentId].success++;
        });
        return Object.values(report);
    }, [filteredHistory, users, qualifications]);
    
    const timesheetReportData = useMemo(() => {
        const dailyData: { [key: string]: { [key: string]: AgentSession[] } } = {};

        dateFilteredData.sessions
            .filter(session => filters.agentId === 'all' || session.agentId === filters.agentId)
            .forEach(session => {
                const date = new Date(session.loginTime).toISOString().split('T')[0];
                if (!dailyData[date]) dailyData[date] = {};
                if (!dailyData[date][session.agentId]) dailyData[date][session.agentId] = [];
                dailyData[date][session.agentId].push(session);
            });

        const report: { date: string, agentName: string, firstLogin: string, lastLogout: string, totalDuration: number, adherence: number }[] = [];
        const plannedStartTime = 9 * 3600 + 0 * 60; // 9:00 AM in seconds

        Object.entries(dailyData).forEach(([dateString, agentSessionsByDate]) => {
            Object.entries(agentSessionsByDate).forEach(([agentId, sessions]) => {
                if (sessions.length === 0) return;
                
                sessions.sort((a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime());
                
                const firstLoginDate = new Date(sessions[0].loginTime);
                const lastLogoutDate = new Date(sessions[sessions.length - 1].logoutTime);
                
                const totalDuration = sessions.reduce((acc, s) => acc + (new Date(s.logoutTime).getTime() - new Date(s.loginTime).getTime()) / 1000, 0);
                
                const firstLoginSeconds = firstLoginDate.getHours() * 3600 + firstLoginDate.getMinutes() * 60 + firstLoginDate.getSeconds();
                const adherence = (firstLoginSeconds - plannedStartTime) / 60; // in minutes

                report.push({
                    date: new Date(dateString).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                    agentName: findEntityName(agentId, users, true) as string,
                    firstLogin: firstLoginDate.toLocaleTimeString('fr-FR'),
                    lastLogout: lastLogoutDate.toLocaleTimeString('fr-FR'),
                    totalDuration,
                    adherence
                });
            });
        });
        
        return report.sort((a,b) => new Date(b.date.split(' ').slice(1).join(' ')).getTime() - new Date(a.date.split(' ').slice(1).join(' ')).getTime() || a.agentName.localeCompare(b.agentName));

    }, [dateFilteredData.sessions, users, filters.agentId]);
    
    const agentTimesheetSummary = useMemo(() => {
        const summary: { [key: string]: { name: string, totalDuration: number, totalAdherence: number, count: number } } = {};
        timesheetReportData.forEach(entry => {
            const agentId = users.find(u => u.firstName + ' ' + u.lastName === entry.agentName)?.id;
            if (!agentId) return;

            if (!summary[agentId]) {
                summary[agentId] = { name: entry.agentName, totalDuration: 0, totalAdherence: 0, count: 0 };
            }
            summary[agentId].totalDuration += entry.totalDuration;
            summary[agentId].totalAdherence += entry.adherence;
            summary[agentId].count++;
        });
        return Object.values(summary);
    }, [timesheetReportData, users]);

    // Data for charts
    const dailyVolumeData = useMemo(() => {
        const counts: { [date: string]: number } = {};
        filteredHistory.forEach(call => {
            const date = new Date(call.timestamp).toLocaleDateString('fr-FR');
            counts[date] = (counts[date] || 0) + 1;
        });
        const labels = Object.keys(counts).sort((a, b) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime());
        const data = labels.map(label => counts[label]);
        return {
            labels,
            datasets: [{
                label: "Nombre d'appels",
                data,
                backgroundColor: 'rgba(79, 70, 229, 0.7)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1
            }]
        };
    }, [filteredHistory]);
    
    const callsByCampaignData = useMemo(() => {
        return {
            labels: campaignReportData.map(c => c.name),
            datasets: [{
                data: campaignReportData.map(c => c.calls),
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
            }]
        };
    }, [campaignReportData]);

    const successRateByAgentData = useMemo(() => {
        return {
            labels: agentReportData.map(a => a.name),
            datasets: [{
                label: 'Taux de Succès (%)',
                data: agentReportData.map(a => a.calls > 0 ? (a.success / a.calls * 100) : 0),
                backgroundColor: 'rgba(22, 163, 74, 0.7)',
            }]
        };
    }, [agentReportData]);

    const adherenceByAgentData = useMemo(() => {
        return {
            labels: agentTimesheetSummary.map(a => a.name),
            datasets: [{
                label: 'Adhérence Moyenne (min)',
                data: agentTimesheetSummary.map(a => a.count > 0 ? (a.totalAdherence / a.count) : 0),
                backgroundColor: 'rgba(249, 115, 22, 0.7)',
            }]
        };
    }, [agentTimesheetSummary]);


    const handleExportPDF = () => {
        const doc = new jspdf.jsPDF();
        const today = new Date().toLocaleDateString('fr-FR');
        const title = `Rapport Analytique Détaillé`;
        
        // --- PAGE 1: SUMMARY ---
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Période du ${filters.startDate} au ${filters.endDate} - Généré le ${today}`, 14, 30);
        
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Indicateurs de Performance Clés (KPIs)", 14, 45);

        const kpiBody = [
            ['Total des Appels Traités', kpis.totalCalls.toString()],
            ['Temps Total de Conversation', formatDuration(kpis.totalDuration, 'full')],
            ['Durée Moyenne d\'Appel', formatDuration(kpis.avgDuration, 'full')],
            ['Taux de Succès (Qualifications Positives)', `${kpis.successRate.toFixed(1)}%`],
            ['Taux d\'Occupation (Simulé)', `${kpis.occupancy.toFixed(1)}%`],
        ];
        
        const timesheetSummaryBody = [
            ['Agents Actifs', agentTimesheetSummary.length.toString()],
            ['Temps de Connexion Total', formatDuration(agentTimesheetSummary.reduce((sum, a) => sum + a.totalDuration, 0), 'full')],
            ['Adhérence Moyenne au Planning', `${(agentTimesheetSummary.length > 0 ? agentTimesheetSummary.reduce((sum, a) => sum + (a.totalAdherence / a.count), 0) / agentTimesheetSummary.length : 0).toFixed(1)} min`],
        ];

        doc.autoTable({
            startY: 50,
            head: [['Indicateurs d\'Appels', 'Valeur']],
            body: kpiBody,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.autoTable({
            startY: doc.previousAutoTable.finalY + 10,
            head: [['Indicateurs de Temps de Présence', 'Valeur']],
            body: timesheetSummaryBody,
            theme: 'striped',
            headStyles: { fillColor: [22, 160, 133] },
        });

        // --- PAGE 2: ANALYSIS ---
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Analyses Détaillées", 14, 22);
        
        // Campaign Pivot Table
        doc.setFontSize(12);
        doc.text("Performances par Campagne", 14, 32);
        const campaignTableBody = campaignReportData.map(c => [
            c.name,
            c.calls,
            formatDuration(c.totalDuration, 'full'),
            formatDuration(c.calls > 0 ? c.totalDuration / c.calls : 0, 'full'),
            `${c.calls > 0 ? (c.success / c.calls * 100).toFixed(1) : '0.0'}%`
        ]);
        doc.autoTable({
            startY: 37,
            head: [['Campagne', 'Appels', 'Durée Totale', 'Durée Moyenne', 'Taux de Succès']],
            body: campaignTableBody,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }
        });
        
        // Agent Pivot Table
        doc.setFontSize(12);
        doc.text("Performances par Agent (Appels)", 14, doc.previousAutoTable.finalY + 15);
        const agentCallTableBody = agentReportData.map(a => [
            a.name,
            a.calls,
            formatDuration(a.totalDuration, 'full'),
            formatDuration(a.calls > 0 ? a.totalDuration / a.calls : 0, 'full'),
            `${a.calls > 0 ? (a.success / a.calls * 100).toFixed(1) : '0.0'}%`
        ]);
        doc.autoTable({
            startY: doc.previousAutoTable.finalY + 20,
            head: [['Agent', 'Appels', 'Durée Totale', 'Durée Moyenne', 'Taux de Succès']],
            body: agentCallTableBody,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }
        });
        
        doc.setFontSize(12);
        doc.text("Performances par Agent (Temps de Présence)", 14, doc.previousAutoTable.finalY + 15);
         const agentTimeTableBody = agentTimesheetSummary.map(a => [
            a.name,
            a.count,
            formatDuration(a.totalDuration, 'full'),
            `${(a.totalAdherence / a.count).toFixed(1)} min`
        ]);
        doc.autoTable({
            startY: doc.previousAutoTable.finalY + 20,
            head: [['Agent', 'Jours Travaillés', 'Durée Connexion Totale', 'Adhérence Moyenne']],
            body: agentTimeTableBody,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }
        });

        // --- PAGE 3+: DETAILED LOGS ---
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Journaux Détaillés", 14, 22);

        // Timesheet Log
        doc.setFontSize(12);
        doc.text("Journal de Présence (Login/Logout)", 14, 32);
        const timesheetLogBody = timesheetReportData.map(t => [
            t.date,
            t.agentName,
            t.firstLogin,
            t.lastLogout,
            formatDuration(t.totalDuration, 'full'),
            `${t.adherence.toFixed(0)} min`
        ]);
         doc.autoTable({
            startY: 37,
            head: [['Date', 'Agent', '1er Login', 'Dern. Logout', 'Durée Totale', 'Adhérence']],
            body: timesheetLogBody,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] }
        });

        // Call Log
        if (doc.previousAutoTable.finalY > 250) doc.addPage();
        doc.setFontSize(12);
        doc.text("Historique des Appels", 14, doc.previousAutoTable.finalY + 15);
        const callLogBody = filteredHistory.map(call => [
            new Date(call.timestamp).toLocaleString('fr-FR'),
            findEntityName(call.agentId, users, true),
            findEntityName(call.campaignId, campaigns, true),
            call.callerNumber,
            formatDuration(call.duration),
            findEntityName(call.qualificationId, qualifications, true)
        ]);
        doc.autoTable({
            startY: doc.previousAutoTable.finalY + 20,
            head: [['Date', 'Agent', 'Campagne', 'Numéro', 'Durée', 'Qualification']],
            body: callLogBody,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] }
        });
        
        doc.save(`rapport_analytique_${today.replace(/\//g, '-')}.pdf`);
    };

    const renderContent = () => {
        switch(activeTab) {
             case 'charts':
                return (
                    <div className="p-4 space-y-8">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-slate-800 mb-3">Volume d'appels par jour</h3>
                                <div className="h-64"><ChartComponent type="bar" data={dailyVolumeData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-slate-800 mb-3">Répartition des appels par campagne</h3>
                                <div className="h-64"><ChartComponent type="doughnut" data={callsByCampaignData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }} }} /></div>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-slate-800 mb-3">Taux de succès par agent</h3>
                                <div className="h-64"><ChartComponent type="bar" data={successRateByAgentData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} /></div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-slate-800 mb-3">Adhérence moyenne au planning</h3>
                                <div className="h-64"><ChartComponent type="bar" data={adherenceByAgentData} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw.toFixed(1)} min`}}}}} /></div>
                            </div>
                         </div>
                    </div>
                );
             case 'timesheet':
                return (
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50"><tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Agent</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">1er Login</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Dernier Logout</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Durée Totale Connexion</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Adhérence Planning</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                            {timesheetReportData.map((row, i) => {
                                let adherenceColor = 'text-slate-600';
                                if(row.adherence > 5) adherenceColor = 'text-red-600 font-semibold';
                                if(row.adherence < 0) adherenceColor = 'text-green-600';
                                return (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-slate-600">{row.date}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{row.agentName}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{row.firstLogin}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{row.lastLogout}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{formatDuration(row.totalDuration, 'full')}</td>
                                    <td className={`px-4 py-3 font-mono ${adherenceColor}`}>
                                        {row.adherence > 0 ? '+' : ''}{row.adherence.toFixed(0)} min
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                );
            case 'campaign':
                return (
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50"><tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Campagne</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Appels</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Durée Totale</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Durée Moyenne</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Taux Succès</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                           {campaignReportData.map((row, i) => (
                               <tr key={i}>
                                   <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                                   <td className="px-4 py-3 text-slate-600">{row.calls}</td>
                                   <td className="px-4 py-3 text-slate-600 font-mono">{formatDuration(row.totalDuration, 'full')}</td>
                                   <td className="px-4 py-3 text-slate-600 font-mono">{formatDuration(row.calls > 0 ? row.totalDuration / row.calls : 0, 'full')}</td>
                                   <td className="px-4 py-3 text-slate-600">{row.calls > 0 ? (row.success / row.calls * 100).toFixed(1) : '0.0'}%</td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                );
            case 'agent':
                return (
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50"><tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Agent</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Appels</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Durée Totale</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Durée Moyenne</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Taux Succès</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                           {agentReportData.map((row, i) => (
                               <tr key={i}>
                                   <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                                   <td className="px-4 py-3 text-slate-600">{row.calls}</td>
                                   <td className="px-4 py-3 text-slate-600 font-mono">{formatDuration(row.totalDuration, 'full')}</td>
                                   <td className="px-4 py-3 text-slate-600 font-mono">{formatDuration(row.calls > 0 ? row.totalDuration / row.calls : 0, 'full')}</td>
                                   <td className="px-4 py-3 text-slate-600">{row.calls > 0 ? (row.success / row.calls * 100).toFixed(1) : '0.0'}%</td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                );
            case 'history':
                return (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50"><tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date & Heure</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Agent</th>
                             <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Campagne</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Numéro Appelé</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Durée</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Qualification</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                            {filteredHistory.map(call => (
                                <tr key={call.id}>
                                    <td className="px-4 py-3 text-slate-600">{new Date(call.timestamp).toLocaleString('fr-FR')}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{findEntityName(call.agentId, users)}</td>
                                    <td className="px-4 py-3 text-slate-600">{findEntityName(call.campaignId, campaigns)}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{call.callerNumber}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{formatDuration(call.duration)}</td>
                                    <td className="px-4 py-3 text-slate-600">{findEntityName(call.qualificationId, qualifications)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
             default: return null;
        }
    }

    return (
         <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                    <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
                </div>
                 <button onClick={handleExportPDF} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center">
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2"/>
                    Exporter en PDF
                </button>
            </header>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Période Prédéfinie</label>
                        <select value={filters.dateRange} onChange={handleDateRangeChange} className="w-full mt-1 p-2 border border-slate-300 rounded-md bg-white">
                            <option value="last7days">7 derniers jours</option>
                            <option value="last30days">30 derniers jours</option>
                            <option value="thismonth">Ce mois-ci</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="text-sm font-medium text-slate-600">Du</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="w-full mt-1 p-2 border border-slate-300 rounded-md bg-white"/>
                        </div>
                        <div>
                             <label className="text-sm font-medium text-slate-600">Au</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} className="w-full mt-1 p-2 border border-slate-300 rounded-md bg-white"/>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600">Campagne</label>
                        <select value={filters.campaignId} onChange={(e) => setFilters(f => ({...f, campaignId: e.target.value}))} className="w-full mt-1 p-2 border border-slate-300 rounded-md bg-white" disabled={activeTab === 'timesheet'}>
                            <option value="all">Toutes les campagnes</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600">Agent</label>
                        <select value={filters.agentId} onChange={(e) => setFilters(f => ({...f, agentId: e.target.value}))} className="w-full mt-1 p-2 border border-slate-300 rounded-md bg-white">
                            <option value="all">Tous les agents</option>
                            {users.filter(u => u.role === 'Agent').map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard title="Appels Traités" value={kpis.totalCalls.toString()} icon={PhoneIcon} />
                <KpiCard title="Temps Total de Conversation" value={formatDuration(kpis.totalDuration, 'full')} icon={TimeIcon} />
                <KpiCard title="Durée Moyenne d'Appel" value={formatDuration(kpis.avgDuration, 'full')} icon={TimeIcon} />
                <KpiCard title="Taux de Succès" value={`${kpis.successRate.toFixed(1)}%`} icon={ChartBarIcon} />
                <KpiCard title="Taux d'Occupation (Simulé)" value={`${kpis.occupancy.toFixed(1)}%`} icon={ChartBarIcon} />
            </div>

             <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                        <TabButton text="Graphiques" isActive={activeTab === 'charts'} onClick={() => setActiveTab('charts')} />
                        <TabButton text="Feuille de Temps" isActive={activeTab === 'timesheet'} onClick={() => setActiveTab('timesheet')} />
                        <TabButton text="Par Campagne" isActive={activeTab === 'campaign'} onClick={() => setActiveTab('campaign')} />
                        <TabButton text="Par Agent" isActive={activeTab === 'agent'} onClick={() => setActiveTab('agent')} />
                        <TabButton text="Historique des Appels" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                    </nav>
                </div>
                 <div className="overflow-x-auto">
                    {renderContent()}
                    {activeTab !== 'timesheet' && activeTab !== 'charts' && filteredHistory.length === 0 && <p className="text-center py-8 text-slate-500">Aucune donnée d'appel pour les filtres sélectionnés.</p>}
                    {activeTab === 'timesheet' && timesheetReportData.length === 0 && <p className="text-center py-8 text-slate-500">Aucune donnée de session pour les filtres sélectionnés.</p>}
                </div>
            </div>
        </div>
    );
};

const KpiCard: React.FC<{title: string, value: string, icon: React.FC<any>}> = ({title, value, icon: Icon}) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-md mr-4">
                <Icon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    </div>
);

const TabButton: React.FC<{text: string, isActive: boolean, onClick: () => void}> = ({ text, isActive, onClick }) => (
     <button
        onClick={onClick}
        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
          isActive
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
    >
        {text}
    </button>
);

export default ReportingDashboard;