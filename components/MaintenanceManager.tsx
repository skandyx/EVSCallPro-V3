import React, { useState } from 'react';
import type { Feature, BackupLog, BackupSchedule } from '../types.ts';
import { PlusIcon, TrashIcon, CheckIcon, XMarkIcon, InformationCircleIcon } from './Icons.tsx';

interface MaintenanceManagerProps {
    feature: Feature;
    backupLogs: BackupLog[];
    backupSchedule: BackupSchedule;
    onSaveBackupSchedule: (schedule: BackupSchedule) => void;
    onRunBackup: () => void;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ feature, backupLogs, backupSchedule, onSaveBackupSchedule, onRunBackup }) => {
    const [schedule, setSchedule] = useState<BackupSchedule>(backupSchedule);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setSchedule(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveSchedule = () => {
        setIsSaving(true);
        setShowSuccess(false);
        setTimeout(() => {
            onSaveBackupSchedule(schedule);
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }, 1000);
    };

    const handleRunBackupNow = () => {
        if (window.confirm("Êtes-vous sûr de vouloir lancer une sauvegarde manuelle maintenant ?")) {
            onRunBackup();
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">Sauvegarde Manuelle</h2>
                    <p className="text-sm text-slate-600 mb-4">Lancez une sauvegarde complète de la configuration du système à tout moment. Utile avant des modifications importantes.</p>
                    <button onClick={handleRunBackupNow} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center w-full justify-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Lancer une sauvegarde maintenant
                    </button>
                     <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    La sauvegarde inclut les utilisateurs, les groupes, les scripts, les SVI, les campagnes et tous les paramètres. Les enregistrements d'appels ne sont pas inclus.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">Planification</h2>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="frequency" className="block text-sm font-medium text-slate-700">Fréquence</label>
                            <select id="frequency" name="frequency" value={schedule.frequency} onChange={handleScheduleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white">
                                <option value="none">Aucune</option>
                                <option value="daily">Quotidienne</option>
                                <option value="weekly">Hebdomadaire</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="time" className="block text-sm font-medium text-slate-700">Heure (UTC)</label>
                            <input type="time" id="time" name="time" value={schedule.time} onChange={handleScheduleChange} disabled={schedule.frequency === 'none'} className="mt-1 block w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-100"/>
                        </div>
                         <div className="flex justify-end items-center pt-2">
                             {showSuccess && <span className="text-green-600 text-sm font-semibold mr-4">Planification enregistrée !</span>}
                             <button onClick={handleSaveSchedule} disabled={isSaving} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50">
                                 {isSaving ? 'Enregistrement...' : 'Enregistrer la planification'}
                            </button>
                         </div>
                    </div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Historique des Sauvegardes</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & Heure</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom du Fichier</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {backupLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                                    <td className="px-6 py-4">
                                        {log.status === 'success' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckIcon className="w-4 h-4 mr-1"/> Succès</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XMarkIcon className="w-4 h-4 mr-1"/> Échec</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-800 font-mono">{log.fileName}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900 mr-4">Restaurer</button>
                                        <button className="text-red-600 hover:text-red-900"><TrashIcon className="w-4 h-4 inline-block -mt-1"/> Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceManager;
