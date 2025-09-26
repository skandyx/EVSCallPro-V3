import React, { useState } from 'react';
import type { Feature, SavedScript, Page, ScriptBlock } from '../types.ts';
import ScriptBuilder from './ScriptBuilder.tsx';
import AgentPreview from './AgentPreview.tsx';
import { EditIcon, DuplicateIcon, TrashIcon, PlusIcon } from './Icons.tsx';

interface ScriptFeatureProps {
    feature: Feature;
    savedScripts: SavedScript[];
    onSaveOrUpdateScript: (script: SavedScript) => void;
    onDeleteScript: (scriptId: string) => void;
    onDuplicateScript: (scriptId: string) => void;
}

const ScriptFeature: React.FC<ScriptFeatureProps> = ({
    feature,
    savedScripts,
    onSaveOrUpdateScript,
    onDeleteScript,
    onDuplicateScript
}) => {
    const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
    const [activeScript, setActiveScript] = useState<SavedScript | null>(null);

    const handleCreateNew = () => {
        const now = Date.now();
        const standardBlocks: ScriptBlock[] = [
            { id: `block-${now}-1`, name: 'Prénom', fieldName: 'first_name', type: 'input', x: 20, y: 20, width: 300, height: 70, content: { placeholder: 'Prénom du contact' }, isStandard: true, isVisible: true, displayCondition: null, parentId: null },
            { id: `block-${now}-2`, name: 'Nom', fieldName: 'last_name', type: 'input', x: 340, y: 20, width: 300, height: 70, content: { placeholder: 'Nom du contact' }, isStandard: true, isVisible: true, displayCondition: null, parentId: null },
            { id: `block-${now}-3`, name: 'Numéro de Téléphone', fieldName: 'phone_number', type: 'phone', x: 20, y: 110, width: 300, height: 70, content: { placeholder: 'Numéro de téléphone' }, isStandard: true, isVisible: true, displayCondition: null, parentId: null },
            { id: `block-${now}-4`, name: 'Code Postal', fieldName: 'postal_code', type: 'input', x: 340, y: 110, width: 300, height: 70, content: { placeholder: 'Code postal' }, isStandard: true, isVisible: true, displayCondition: null, parentId: null },
        ];

        const firstPage: Page = {
            id: `page-${now}`,
            name: "Page 1",
            blocks: standardBlocks
        };
        setActiveScript({
            id: `script-${now}`,
            name: "Nouveau Script",
            pages: [firstPage],
            startPageId: firstPage.id,
            backgroundColor: '#f1f5f9'
        });
        setView('editor');
    };

    const handleEdit = (script: SavedScript) => {
        setActiveScript(JSON.parse(JSON.stringify(script))); // Deep copy to avoid mutation
        setView('editor');
    };
    
    const handlePreview = (script: SavedScript) => {
        setActiveScript(script);
        setView('preview');
    };

    const handleSave = (script: SavedScript) => {
        onSaveOrUpdateScript(script);
        setView('list');
        setActiveScript(null);
    };

    const handleCloseEditor = () => {
        setView('list');
        setActiveScript(null);
    }

    if (view === 'editor' && activeScript) {
        return (
            <ScriptBuilder
                script={activeScript}
                onSave={handleSave}
                onClose={handleCloseEditor}
                onPreview={handlePreview}
            />
        );
    }
    
    if (view === 'preview' && activeScript) {
        return (
            <AgentPreview 
                script={activeScript}
                onClose={() => setView('editor')} // Go back to editor from preview
            />
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Scripts Sauvegardés</h2>
                    <button
                        onClick={handleCreateNew}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors inline-flex items-center"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Créer un nouveau script
                    </button>
                </div>

                {savedScripts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom du Script</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {savedScripts.map(script => (
                                    <tr key={script.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{script.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">{script.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleEdit(script)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"><EditIcon className="w-4 h-4 mr-1"/> Modifier</button>
                                            <button onClick={() => onDuplicateScript(script.id)} className="text-slate-500 hover:text-slate-800 inline-flex items-center"><DuplicateIcon className="w-4 h-4 mr-1"/> Dupliquer</button>
                                            <button onClick={() => onDeleteScript(script.id)} className="text-red-600 hover:text-red-900 inline-flex items-center"><TrashIcon className="w-4 h-4 mr-1"/> Supprimer</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">Aucun script n'a encore été créé.</p>
                )}
            </div>
        </div>
    );
};

export default ScriptFeature;