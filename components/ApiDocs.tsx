import React from 'react';
import type { Feature } from '../types.ts';
import { ServerStackIcon } from './Icons.tsx';

interface ApiDocsProps {
    feature: Feature;
}

const ApiDocs: React.FC<ApiDocsProps> = ({ feature }) => {
    return (
        <div className="h-full w-full flex flex-col">
            <header className="flex-shrink-0 mb-8">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center">
                    <ServerStackIcon className="w-9 h-9 mr-3 text-indigo-600"/>
                    {feature.title}
                </h1>
                <p className="mt-2 text-lg text-slate-600">
                    Cette page fournit une documentation interactive générée automatiquement pour l'API backend. Vous pouvez explorer, tester et comprendre chaque endpoint directement depuis cette interface.
                </p>
            </header>
            
            <div className="flex-1 w-full border border-slate-300 rounded-lg shadow-inner">
                <iframe
                    src="/api/docs"
                    title="Documentation API Interactive (Swagger UI)"
                    className="w-full h-full border-0 rounded-lg"
                />
            </div>
        </div>
    );
};

export default ApiDocs;