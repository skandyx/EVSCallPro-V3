
import React, { useState, useEffect } from 'react';
import type { Feature, FeatureCategory, ModuleVisibility, FeatureId } from '../types.ts';

interface ModuleSettingsManagerProps {
    feature: Feature;
    features: Feature[];
    moduleVisibility: ModuleVisibility;
    onSaveVisibilitySettings: (visibility: ModuleVisibility) => void;
}

const TOGGLEABLE_CATEGORIES: { name: FeatureCategory; description: string }[] = [
    { name: 'Agent', description: "Gestion des utilisateurs, groupes et plannings." },
    { name: 'Outbound', description: "Campagnes d'appels sortants et scripts d'agents." },
    { name: 'Inbound', description: "Flux d'appels entrants (SVI)." },
    { name: 'Sound', description: "Bibliothèque de fichiers audio et enregistrements." },
    { name: 'Configuration', description: "Qualifications d'appel et paramètres avancés." },
    { name: 'Supervision & Reporting', description: "Dashboards temps réel et rapports analytiques." },
    { name: 'Système', description: "Monitoring du système et aide." },
];

const ToggleSwitch: React.FC<{
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}> = ({ label, enabled, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            className={`${enabled ? 'bg-indigo-600' : 'bg-slate-200'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            disabled={disabled}
        >
            <span
                aria-hidden="true"
                className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
};

const ModuleSettingsManager: React.FC<ModuleSettingsManagerProps> = ({ feature, features, moduleVisibility, onSaveVisibilitySettings }) => {
    const [localVisibility, setLocalVisibility] = useState<ModuleVisibility>(moduleVisibility);
    const [isDirty, setIsDirty] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setLocalVisibility(moduleVisibility);
        setIsDirty(false);
    }, [moduleVisibility]);

    const handleLocalChange = (type: 'category' | 'feature', id: FeatureCategory | FeatureId, isVisible: boolean) => {
        setLocalVisibility(prev => {
            const newVisibility = JSON.parse(JSON.stringify(prev)); // Deep copy
            if (type === 'category') {
                const categoryId = id as FeatureCategory;
                newVisibility.categories[categoryId] = isVisible;
                // Cascade visibility change to all features within this category
                features.forEach(f => {
                    if (f.category === categoryId) {
                        newVisibility.features[f.id] = isVisible;
                    }
                });
            } else {
                newVisibility.features[id as FeatureId] = isVisible;
            }
            return newVisibility;
        });
        setIsDirty(true);
    };

    const handleSave = () => {
        onSaveVisibilitySettings(localVisibility);
        setIsDirty(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
    };
    
    const featuresByCategory = features.reduce((acc, f) => {
        if (!acc[f.category]) {
            acc[f.category] = [];
        }
        acc[f.category].push(f);
        return acc;
    }, {} as Record<FeatureCategory, Feature[]>);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Activation des menus et sous-menus</h2>
                <p className="text-sm text-slate-600 mb-6">
                    Utilisez les interrupteurs ci-dessous pour afficher ou masquer les catégories principales et leurs sous-menus respectifs dans la barre latérale.
                </p>

                <div className="divide-y divide-slate-200">
                    {TOGGLEABLE_CATEGORIES.map(({ name, description }) => {
                        const isCategoryEnabled = localVisibility.categories[name] ?? true;
                        return (
                            <div key={name} className="py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-lg text-slate-900">{name}</p>
                                        <p className="text-sm text-slate-500">{description}</p>
                                    </div>
                                    <ToggleSwitch
                                        label={`Activer/Désactiver le module ${name}`}
                                        enabled={isCategoryEnabled}
                                        onChange={(isEnabled) => handleLocalChange('category', name, isEnabled)}
                                    />
                                </div>
                                <div className="pl-8 pt-4 mt-2 border-t border-slate-200/60 space-y-3">
                                    {featuresByCategory[name]?.map(subFeature => (
                                        <div key={subFeature.id} className="flex items-center justify-between">
                                            <p className={`font-medium text-sm ${isCategoryEnabled ? 'text-slate-700' : 'text-slate-400'}`}>{subFeature.title}</p>
                                            <ToggleSwitch
                                                label={`Activer/Désactiver le sous-menu ${subFeature.title}`}
                                                enabled={localVisibility.features[subFeature.id] ?? true}
                                                onChange={(isEnabled) => handleLocalChange('feature', subFeature.id, isEnabled)}
                                                disabled={!isCategoryEnabled}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                     <div className="py-4">
                        <div className="flex items-center justify-between">
                             <div>
                                <p className="font-semibold text-lg text-slate-900">Paramètres</p>
                                <p className="text-sm text-slate-500">Configuration technique et gestion des modules.</p>
                            </div>
                            <ToggleSwitch
                                label="Module Paramètres"
                                enabled={true}
                                onChange={() => {}}
                                disabled={true}
                            />
                        </div>
                         <div className="pl-8 pt-4 mt-2 border-t border-slate-200/60 space-y-3">
                            {featuresByCategory['Paramètres']?.map(subFeature => {
                                const isParametresEnabled = localVisibility.categories['Paramètres'] ?? true;
                                const isSubFeatureDisabled = !isParametresEnabled || subFeature.id === 'module-settings';
                                return (
                                 <div key={subFeature.id} className="flex items-center justify-between">
                                    <p className={`font-medium text-sm ${!isSubFeatureDisabled ? 'text-slate-700' : 'text-slate-400'}`}>{subFeature.title}</p>
                                    <ToggleSwitch
                                        label={`Activer/Désactiver le sous-menu ${subFeature.title}`}
                                        enabled={localVisibility.features[subFeature.id] ?? true}
                                        onChange={(isEnabled) => handleLocalChange('feature', subFeature.id, isEnabled)}
                                        disabled={isSubFeatureDisabled}
                                    />
                                </div>
                                )
                            })}
                        </div>
                     </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end items-center">
                    {showSuccess && <span className="text-green-600 font-semibold mr-4 transition-opacity duration-300">Enregistré avec succès !</span>}
                    <button
                        onClick={handleSave}
                        disabled={!isDirty}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Enregistrer les modifications
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModuleSettingsManager;
