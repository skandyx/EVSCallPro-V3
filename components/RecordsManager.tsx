
import React from 'react';
import type { Feature } from '../types.ts';

interface RecordsManagerProps {
    feature: Feature;
}

const RecordsManager: React.FC<RecordsManagerProps> = ({ feature }) => {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="text-center text-slate-500 py-16">
                    <h2 className="text-xl font-semibold">Fonctionnalité en construction</h2>
                    <p className="mt-2">La gestion des enregistrements d'appels sera disponible ici.</p>
                </div>
            </div>
        </div>
    );
};

export default RecordsManager;
