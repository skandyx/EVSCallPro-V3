

import React, { useState, useMemo } from 'react';
import type { User, UserRole } from '../types.ts';
import { ArrowUpTrayIcon, CheckIcon, XMarkIcon, ArrowRightIcon } from './Icons.tsx';

declare var Papa: any;
declare var XLSX: any;

interface ImportUsersModalProps {
    onClose: () => void;
    onImport: (newUsers: User[]) => void;
    existingUsers: User[];
}

type CsvRow = Record<string, string>;

const USER_ROLES: UserRole[] = ['Agent', 'Superviseur', 'Administrateur', 'SuperAdmin'];

const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 8;
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const ImportUsersModal: React.FC<ImportUsersModalProps> = ({ onClose, onImport, existingUsers }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<CsvRow[]>([]);
    const [mappings, setMappings] = useState<Record<string, string>>({}); // { [fieldId]: csvHeader }
    const [summary, setSummary] = useState<{ total: number; valids: User[]; invalids: { row: CsvRow; reason: string }[] } | null>(null);

    const MAPPING_FIELDS = [
        { id: 'loginId', name: 'Identifiant / Extension' },
        { id: 'firstName', name: 'Prénom' },
        { id: 'lastName', name: 'Nom' },
        { id: 'email', name: 'Email' },
        { id: 'role', name: 'Rôle' },
    ];

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const fileContent = e.target?.result;
                if (!fileContent) throw new Error("Le contenu du fichier est vide.");

                let headers: string[] = [];
                let data: CsvRow[] = [];
                const fileNameLower = selectedFile.name.toLowerCase();

                if (fileNameLower.endsWith('.xlsx')) {
                    const workbook = XLSX.read(fileContent, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    // Fix: Remove type argument from untyped function call and use type assertion.
                    data = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as CsvRow[];
                    if (data.length > 0) headers = Object.keys(data[0]);
                } else { // Handle CSV and TXT with Papaparse
                    const result = Papa.parse(fileContent as string, {
                        header: true,
                        skipEmptyLines: true,
                        encoding: "UTF-8",
                    });
                    
                    if (result.errors.length > 0) console.warn("Erreurs de parsing:", result.errors);
                    headers = result.meta.fields || [];
                    data = result.data as CsvRow[];
                }

                setCsvHeaders(headers);
                setCsvData(data);
                
                // Auto-map obvious fields
                const initialMappings: Record<string, string> = {};
                const usedHeaders = new Set<string>();

                MAPPING_FIELDS.forEach(field => {
                    const fieldNameLower = field.name.toLowerCase().replace(/[\s/]+/g, '');
                    const foundHeader = headers.find(h => !usedHeaders.has(h) && h.toLowerCase().replace(/[\s\-_]+/g, '') === fieldNameLower);

                    if (foundHeader) {
                        initialMappings[field.id] = foundHeader;
                        usedHeaders.add(foundHeader);
                    }
                });
                setMappings(initialMappings);

            } catch (error) {
                console.error("Erreur lors de la lecture du fichier:", error);
                alert("Une erreur est survenue lors de la lecture du fichier. Assurez-vous qu'il est valide et non corrompu.");
            }
        };

        reader.onerror = () => alert("Impossible de lire le fichier.");

        if (selectedFile.name.toLowerCase().endsWith('.xlsx')) {
            reader.readAsBinaryString(selectedFile);
        } else {
            reader.readAsText(selectedFile, 'UTF-8');
        }
    };
    
    const processAndGoToSummary = () => {
        const valids: User[] = [];
        const invalids: { row: CsvRow; reason: string }[] = [];
        const existingLoginIds = new Set(existingUsers.map(u => u.loginId));

        csvData.forEach((row, index) => {
            const getVal = (fieldId: string) => row[mappings[fieldId]] || '';
            
            const loginId = getVal('loginId').trim();
            const firstName = getVal('firstName').trim();
            const lastName = getVal('lastName').trim();
            const email = getVal('email').trim();
            const role = getVal('role').trim() as UserRole;

            if (!loginId || !firstName || !lastName) {
                invalids.push({ row, reason: "Champs obligatoires (login, prénom, nom) manquants." }); return;
            }
            if (existingLoginIds.has(loginId) || valids.some(u => u.loginId === loginId)) {
                invalids.push({ row, reason: `L'identifiant ${loginId} est déjà utilisé.` }); return;
            }
            if (role && !USER_ROLES.includes(role)) {
                invalids.push({ row, reason: `Rôle '${role}' invalide.` }); return;
            }

            valids.push({
                id: `new-import-${Date.now() + index}`,
                loginId, firstName, lastName, email,
                role: role || 'Agent',
                isActive: true,
                campaignIds: [],
                password: generatePassword(),
            });
        });

        setSummary({ total: csvData.length, valids, invalids });
        setStep(3);
    };

    const handleFinalImport = () => {
        if (!summary) return;
        onImport(summary.valids);
        setStep(4);
    };

    const isNextDisabled = useMemo(() => {
        if (step === 1 && !file) return true;
        if (step === 2 && (!mappings['loginId'] || !mappings['firstName'] || !mappings['lastName'])) return true;
        return false;
    }, [step, file, mappings]);
    
    const usedCsvHeaders = Object.values(mappings);

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                     <div className="space-y-4">
                        <label className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-indigo-500">
                            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-slate-400" />
                            <span className="mt-2 block text-sm font-medium text-slate-900">{file ? file.name : "Téléverser un fichier (CSV, TXT, XLSX)"}</span>
                            <input type='file' className="sr-only" accept=".csv,.txt,.xlsx" onChange={e => e.target.files && handleFileSelect(e.target.files[0])} />
                        </label>
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-3">
                        <p className="text-sm text-slate-600">Faites correspondre les colonnes de votre fichier (à droite) aux champs de destination (à gauche). Prénom, Nom et Identifiant sont obligatoires.</p>
                        <div className="max-h-80 overflow-y-auto rounded-md border p-2 space-y-2 bg-slate-50">
                            {MAPPING_FIELDS.map(field => (
                                <div key={field.id} className="grid grid-cols-2 gap-4 items-center p-1">
                                    <span className="font-medium text-slate-700 truncate">{field.name} <span className="text-red-500">*</span></span>
                                    <select
                                        value={mappings[field.id] || ''}
                                        onChange={e => {
                                            const newCsvHeader = e.target.value;
                                            setMappings(prev => {
                                                const newMappings = { ...prev };
                                                Object.keys(newMappings).forEach(key => { if(newMappings[key] === newCsvHeader) delete newMappings[key]; });
                                                if (newCsvHeader) newMappings[field.id] = newCsvHeader;
                                                else delete newMappings[field.id];
                                                return newMappings;
                                            });
                                        }}
                                        className="w-full p-2 border bg-white rounded-md"
                                    >
                                        <option value="">Ignorer ce champ</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header} disabled={usedCsvHeaders.includes(header) && mappings[field.id] !== header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3: 
                if (!summary) return null;
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-slate-800">Résumé de la validation</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-50 p-4 rounded-md border"><p className="text-2xl font-bold">{summary.total}</p><p className="text-sm text-slate-500">Lignes lues</p></div>
                            <div className="bg-green-50 p-4 rounded-md border border-green-200"><p className="text-2xl font-bold text-green-700">{summary.valids.length}</p><p className="text-sm text-green-600">Utilisateurs à créer</p></div>
                            <div className="bg-red-50 p-4 rounded-md border border-red-200"><p className="text-2xl font-bold text-red-700">{summary.invalids.length}</p><p className="text-sm text-red-600">Lignes invalides</p></div>
                        </div>
                        {summary.invalids.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-700 mb-2">Détail des erreurs</h4>
                                <div className="max-h-40 overflow-y-auto text-sm border rounded-md bg-slate-50">
                                    <table className="min-w-full">
                                        <thead className="bg-slate-200 sticky top-0"><tr className="text-left"><th className="p-2">Ligne</th><th className="p-2">Erreur</th></tr></thead>
                                        <tbody>
                                        {summary.invalids.map((item, i) => (
                                            <tr key={i} className="border-t"><td className="p-2 font-mono text-xs">{JSON.stringify(item.row)}</td><td className="p-2 text-red-600">{item.reason}</td></tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="text-center py-8">
                        <CheckIcon className="mx-auto h-16 w-16 text-green-500"/>
                        <h3 className="text-xl font-semibold text-slate-800 mt-4">Importation terminée !</h3>
                        <p className="text-slate-600 mt-2"><span className="font-bold">{summary?.valids.length || 0}</span> utilisateurs ont été ajoutés avec succès.</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-900">Importer des utilisateurs par CSV</h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">{renderStepContent()}</div>
                <div className="bg-slate-50 px-6 py-4 flex justify-between rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700">Fermer</button>
                    <div className="flex gap-3">
                        {step > 1 && step < 4 && <button onClick={() => setStep(s => s - 1)} className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50">Retour</button>}
                        {step < 3 && <button onClick={() => step === 1 ? setStep(2) : processAndGoToSummary()} disabled={isNextDisabled} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">
                            {step === 1 ? 'Suivant' : 'Valider les données'} <ArrowRightIcon className="w-4 h-4"/>
                        </button>}
                        {step === 3 && <button onClick={handleFinalImport} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-green-700">Confirmer et Importer</button>}
                        {step === 4 && <button onClick={onClose} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700">Terminer</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportUsersModal;