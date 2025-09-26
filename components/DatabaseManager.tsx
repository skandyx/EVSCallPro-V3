import React, { useState, useEffect } from 'react';
import type { Feature } from '../types.ts';
import { DatabaseIcon, PlayIcon, InformationCircleIcon, CheckIcon, XMarkIcon } from './Icons.tsx';

interface DatabaseManagerProps {
    feature: Feature;
    apiCall: any; // AxiosInstance
}

const PREDEFINED_QUERIES = [
    { name: 'Lister les utilisateurs', query: 'SELECT id, login_id, first_name, last_name, role, is_active FROM users;' },
    { name: 'Lister les campagnes actives', query: "SELECT id, name, dialing_mode FROM campaigns WHERE is_active = TRUE;" },
    { name: 'Compter les contacts par campagne', query: 'SELECT c.name, COUNT(ct.id) AS contact_count FROM campaigns c LEFT JOIN contacts ct ON c.id = ct.campaign_id GROUP BY c.name ORDER BY contact_count DESC;' },
    { name: 'Voir les 20 derniers contacts', query: 'SELECT * FROM contacts ORDER BY created_at DESC LIMIT 20;' },
    { name: 'Lister les scripts', query: 'SELECT id, name FROM scripts;' },
];

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button type="button" onClick={() => onChange(!enabled)} className={`${enabled ? 'bg-indigo-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`} role="switch" aria-checked={enabled}>
        <span aria-hidden="true" className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
    </button>
);

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ feature, apiCall }) => {
    const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
    const [results, setResults] = useState<{ columns: string[], rows: any[], rowCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [schema, setSchema] = useState<Record<string, string[]> | null>(null);
    const [isSchemaLoading, setIsSchemaLoading] = useState(true);

    useEffect(() => {
        const fetchSchema = async () => {
            try {
                const response = await apiCall.get('/system/db-schema');
                setSchema(response.data);
            } catch (err) {
                setError("Impossible de charger le schéma de la base de données.");
            } finally {
                setIsSchemaLoading(false);
            }
        };
        fetchSchema();
    }, [apiCall]);

    const isWriteQuery = !isReadOnly && /^(UPDATE|DELETE|INSERT|DROP|CREATE|ALTER|TRUNCATE)\b/i.test(query.trim());

    const handleExecuteQuery = async () => {
        if (!query.trim()) return;

        if (isWriteQuery) {
            if (!window.confirm("Vous êtes sur le point d'exécuter une requête de MODIFICATION/SUPPRESSION. Cette action est irréversible. Êtes-vous certain de vouloir continuer ?")) {
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await apiCall.post('/system/db-query', { query, readOnly: isReadOnly });
            setResults(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    const ResultTable: React.FC<{ data: { columns: string[], rows: any[], rowCount: number } }> = ({ data }) => {
        if (data.rows.length > 0) {
            return (
                <div className="overflow-auto border-t">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0"><tr className="text-left">
                            {data.columns.map(col => <th key={col} className="p-2 font-semibold border-b">{col}</th>)}
                        </tr></thead>
                        <tbody>
                            {data.rows.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-slate-50">
                                    {data.columns.map(col => <td key={col} className="p-2 font-mono text-xs whitespace-pre-wrap break-all">{JSON.stringify(row[col], null, 2)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return (
            <div className="p-4 flex items-center justify-center text-slate-500 border-t">
                 <CheckIcon className="w-5 h-5 mr-2 text-green-500" />
                 Requête exécutée avec succès. {data.rowCount !== null ? `${data.rowCount} ligne(s) affectée(s).` : 'Aucune ligne retournée.'}
            </div>
        )
    };

    const SchemaViewer: React.FC = () => {
        if (isSchemaLoading) return <div className="p-2 text-sm text-slate-500">Chargement du schéma...</div>;
        if (!schema) return <div className="p-2 text-sm text-red-500">Erreur de chargement du schéma.</div>;

        return (
             <div className="overflow-y-auto text-sm space-y-1">
                {Object.entries(schema).map(([table, columns]) => (
                    <details key={table}>
                        <summary className="font-semibold cursor-pointer p-1 rounded hover:bg-slate-100">{table}</summary>
                        <ul className="pl-4 mt-1">
                            {columns.map(col => <li key={col} className="text-xs text-slate-600 font-mono p-0.5">{col}</li>)}
                        </ul>
                    </details>
                ))}
            </div>
        )
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0"><InformationCircleIcon className="h-5 w-5 text-red-400"/></div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">
                            <span className="font-bold">Attention :</span> Les actions effectuées ici modifient directement la base de données. Utilisez cet outil avec une extrême prudence. Toute perte de données est irréversible.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
                <div className="col-span-3 flex flex-col space-y-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border h-1/2 flex flex-col">
                        <h3 className="font-semibold text-slate-800 border-b pb-2 mb-2 flex-shrink-0">Schéma</h3>
                        <SchemaViewer />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border h-1/2 flex flex-col">
                        <h3 className="font-semibold text-slate-800 border-b pb-2 mb-2 flex-shrink-0">Requêtes Prédéfinies</h3>
                         <div className="overflow-y-auto text-sm space-y-1">
                            {PREDEFINED_QUERIES.map(q => (
                                <button key={q.name} onClick={() => setQuery(q.query)} className="w-full text-left p-2 rounded hover:bg-indigo-50 text-indigo-700">
                                    {q.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-span-9 bg-white rounded-lg shadow-sm border flex flex-col">
                    <div className="p-3 border-b">
                        <textarea
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full h-32 p-2 font-mono text-sm border rounded-md resize-none"
                            placeholder="Entrez votre requête SQL ici..."
                        />
                         <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-sm">Mode Lecture Seule</span>
                                <ToggleSwitch enabled={isReadOnly} onChange={setIsReadOnly} />
                            </div>
                            <button
                                onClick={handleExecuteQuery}
                                disabled={isLoading}
                                className={`inline-flex items-center gap-2 font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50
                                    ${isWriteQuery ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                            >
                                {isLoading ? 'Exécution...' : <><PlayIcon className="w-5 h-5"/> Exécuter la requête</>}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {isLoading && <div className="p-4 text-center">Chargement des résultats...</div>}
                        {error && <div className="p-4 bg-red-50 text-red-800 font-mono text-sm"><XMarkIcon className="w-5 h-5 inline-block mr-2"/>{error}</div>}
                        {results && <ResultTable data={results} />}
                        {!isLoading && !error && !results && <div className="p-4 text-center text-slate-400">Les résultats s'afficheront ici.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseManager;