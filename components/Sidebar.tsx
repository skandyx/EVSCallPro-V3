

import React, { useState, useMemo } from 'react';
import type { Feature, FeatureId, User, FeatureCategory, ModuleVisibility } from '../types.ts';
import {
    LogoIcon, UserCircleIcon, ChevronDownIcon,
    UsersIcon, PhoneArrowUpRightIcon, InboxArrowDownIcon, SpeakerWaveIcon, WrenchScrewdriverIcon,
    ChartBarIcon, ServerStackIcon, SettingsIcon, PowerIcon, ChevronDoubleLeftIcon
} from './Icons.tsx';

interface SidebarProps {
    features: Feature[];
    activeFeatureId: string | null;
    onSelectFeature: (id: FeatureId) => void;
    currentUser: User | null;
    onLogout: () => void;
    moduleVisibility: ModuleVisibility;
}

const categoryIcons: Record<FeatureCategory, React.FC<any>> = {
    'Agent': UsersIcon,
    'Outbound': PhoneArrowUpRightIcon,
    'Inbound': InboxArrowDownIcon,
    'Sound': SpeakerWaveIcon,
    'Configuration': WrenchScrewdriverIcon,
    'Supervision & Reporting': ChartBarIcon,
    'Système': ServerStackIcon,
    'Paramètres': SettingsIcon,
};

const categoryOrder: FeatureCategory[] = ['Agent', 'Outbound', 'Inbound', 'Sound', 'Configuration', 'Supervision & Reporting', 'Système', 'Paramètres'];


const Sidebar: React.FC<SidebarProps> = ({ features, activeFeatureId, onSelectFeature, currentUser, onLogout, moduleVisibility }) => {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const isSuperAdmin = currentUser?.role === 'SuperAdmin';

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

    const categories = features.reduce((acc, feature) => {
        (acc[feature.category] = acc[feature.category] || []).push(feature);
        return acc;
    }, {} as Record<string, Feature[]>);

    return (
        <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white flex-shrink-0 border-r border-slate-200 flex flex-col`}>
            <div className="h-16 flex items-center justify-center border-b border-slate-200 flex-shrink-0">
                <LogoIcon className="w-8 h-8 text-indigo-600" />
                {!isSidebarCollapsed && <span className="text-lg font-bold text-slate-800 ml-2">Solution Archi</span>}
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {categoryOrder
                    .filter(categoryName => isSuperAdmin || (moduleVisibility.categories[categoryName as FeatureCategory] ?? true))
                    .filter(categoryName => categories[categoryName]) // Ne rend que les catégories qui ont des fonctionnalités
                    .map(categoryName => {
                        const featuresInCategory = categories[categoryName];
                        const isExpanded = expandedCategories.includes(categoryName);
                        const Icon = categoryIcons[categoryName as FeatureCategory];
                        const isActiveCategory = featuresInCategory.some(f => f.id === activeFeatureId);

                        return (
                            <div key={categoryName}>
                                <button
                                    onClick={() => toggleCategory(categoryName)}
                                    className={`w-full text-left flex items-center p-2 text-sm font-semibold rounded-md transition-colors ${
                                        isSidebarCollapsed ? 'justify-center' : ''
                                    } ${
                                        isActiveCategory ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                    title={categoryName}
                                >
                                    {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                                    {!isSidebarCollapsed && <span className="flex-1 ml-3">{categoryName}</span>}
                                    {!isSidebarCollapsed && <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />}
                                </button>
                                {!isSidebarCollapsed && isExpanded && (
                                    <div className="mt-1 space-y-1 pl-4">
                                        {featuresInCategory
                                            .filter(feature => {
                                                // Special rules for SuperAdmin-only features
                                                if (['module-settings', 'system-connection', 'api-docs', 'database-client'].includes(feature.id)) {
                                                    return currentUser?.role === 'SuperAdmin';
                                                }
                                                // Default rule for all other features
                                                return isSuperAdmin || (moduleVisibility.features[feature.id] ?? true);
                                            })
                                            .map(feature => (
                                            <button
                                                key={feature.id}
                                                onClick={() => onSelectFeature(feature.id)}
                                                className={`w-full text-left flex items-center pl-4 pr-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                                    activeFeatureId === feature.id
                                                        ? 'bg-indigo-50 text-indigo-700'
                                                        : 'text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                {feature.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                })}
            </nav>

            <div className="p-2 border-t border-slate-200 mt-auto flex-shrink-0">
                {currentUser && !isSidebarCollapsed && (
                    <div className="flex items-center p-2">
                        <UserCircleIcon className="w-10 h-10 text-slate-400" />
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate" title={`${currentUser.firstName} ${currentUser.lastName}`}>{currentUser.firstName} {currentUser.lastName}</p>
                            <p className="text-xs text-slate-500 truncate">{currentUser.loginId} - {currentUser.role}</p>
                        </div>
                    </div>
                )}
                <div className={`space-y-1 ${!isSidebarCollapsed ? 'mt-2 border-t pt-2' : ''}`}>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center p-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
                        title="Déconnexion"
                    >
                        <PowerIcon className={`w-5 h-5 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                        {!isSidebarCollapsed && <span className="font-semibold">Déconnexion</span>}
                    </button>
                    <button
                        onClick={() => setIsSidebarCollapsed(p => !p)}
                        className="w-full flex items-center p-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
                        title={isSidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}
                    >
                        <ChevronDoubleLeftIcon className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? 'rotate-180 mx-auto' : 'mr-3'}`} />
                        {!isSidebarCollapsed && <span className="font-semibold">Réduire</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;