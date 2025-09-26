import React from 'react';
import { WrenchScrewdriverIcon, ServerStackIcon } from './Icons.tsx';

interface HeaderProps {
    activeView: 'app' | 'monitoring';
    onViewChange: (view: 'app' | 'monitoring') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onViewChange }) => {
    const TabButton: React.FC<{
        viewName: 'app' | 'monitoring';
        label: string;
        icon: React.FC<React.SVGProps<SVGSVGElement>>;
    }> = ({ viewName, label, icon: Icon }) => {
        const isActive = activeView === viewName;
        return (
            <button
                onClick={() => onViewChange(viewName)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
            </button>
        );
    };

    return (
        <header className="flex-shrink-0 bg-white shadow-sm border-b border-slate-200">
            <nav className="flex space-x-2">
                <TabButton viewName="app" label="Application" icon={WrenchScrewdriverIcon} />
                <TabButton viewName="monitoring" label="Monitoring" icon={ServerStackIcon} />
            </nav>
        </header>
    );
};

export default Header;