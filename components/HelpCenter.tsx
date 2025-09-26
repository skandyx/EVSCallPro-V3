import React, { useState } from 'react';
import type { Feature } from '../types.ts';
import {
    ChevronDownIcon, UsersIcon, PhoneArrowUpRightIcon, InboxArrowDownIcon, WrenchScrewdriverIcon, ChartBarIcon,
    PlayIcon, MenuIcon, SpeakerWaveIcon, PhoneIcon
} from './Icons.tsx';

interface HelpCenterProps {
    feature: Feature;
}

const AccordionItem: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode; }> = ({ title, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-slate-200 rounded-lg">
            <h2>
                <button
                    type="button"
                    className="flex items-center justify-between w-full p-5 font-medium text-left text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                >
                    <span className="flex items-center">
                        <Icon className="w-5 h-5 mr-3 text-indigo-600" />
                        {title}
                    </span>
                    <ChevronDownIcon className={`w-6 h-6 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </h2>
            {isOpen && (
                <div className="p-5 border-t border-slate-200">
                    {children}
                </div>
            )}
        </div>
    );
};

const HelpCenter: React.FC<HelpCenterProps> = ({ feature }) => {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>

            <div className="space-y-4">
                <AccordionItem title="Gestion des Utilisateurs & Groupes" icon={UsersIcon}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <h3 className="font-semibold text-slate-800">Principe</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                La section 'Utilisateurs' vous permet de créer, modifier et désactiver les comptes pour vos agents, superviseurs et administrateurs. Chaque utilisateur a un rôle qui définit ses permissions.
                                <br /><br />
                                Les 'Groupes' permettent de rassembler des agents pour leur assigner des appels entrants (via un SVI) ou pour filtrer les rapports plus facilement.
                            </p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 shadow-inner">
                            <h4 className="text-sm font-semibold text-center mb-2 text-slate-600">Exemple: Fenêtre d'édition d'un utilisateur</h4>
                            <div className="bg-white p-3 rounded-md space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="font-medium">Prénom</label><div className="mt-1 p-1.5 border rounded bg-slate-50">Alice</div></div>
                                    <div><label className="font-medium">Nom</label><div className="mt-1 p-1.5 border rounded bg-slate-50">Agent</div></div>
                                </div>
                                <div><label className="font-medium">Identifiant / Extension</label><div className="mt-1 p-1.5 border rounded bg-slate-50">1001</div></div>
                                <div><label className="font-medium">Rôle</label><div className="mt-1 p-1.5 border rounded bg-slate-50">Agent</div></div>
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Campagnes Sortantes" icon={PhoneArrowUpRightIcon}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <h3 className="font-semibold text-slate-800">Configurer une campagne</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                Ce module est le cœur de vos appels sortants. La création d'une campagne se fait via une fenêtre à plusieurs onglets :
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li><b>Recyclage :</b> Définissez quand et comment rappeler automatiquement les numéros qui étaient occupés, sur répondeur, etc.</li>
                                    <li><b>Quotas :</b> Fixez des limites pour ne pas sur-qualifier un segment (ex: pas plus de 20 ventes à Paris).</li>
                                    <li><b>Inclusion / Exclusion :</b> Filtrez vos listes de contacts pour n'appeler que les prospects pertinents.</li>
                                    <li><b>État du Fichier :</b> Suivez en temps réel la progression de votre fichier d'appel.</li>
                                </ul>
                            </p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 shadow-inner">
                             <h4 className="text-sm font-semibold text-center mb-2 text-slate-600">Exemple: Éditeur de campagne</h4>
                             <div className="bg-white p-3 rounded-md text-xs">
                                <p className="font-bold text-base mb-2">Nouvelle Campagne</p>
                                <div className="border-b border-slate-200">
                                    <div className="flex -mb-px space-x-4">
                                        <span className="py-2 px-1 border-b-2 font-medium border-indigo-500 text-indigo-600">Général</span>
                                        <span className="py-2 px-1 border-b-2 border-transparent text-slate-500">Recyclage</span>
                                        <span className="py-2 px-1 border-b-2 border-transparent text-slate-500">Quotas</span>
                                        <span className="py-2 px-1 border-b-2 border-transparent text-slate-500">Exclusion</span>
                                        <span className="py-2 px-1 border-b-2 border-transparent text-slate-500">État...</span>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-2">
                                    <div><label className="font-medium">Nom de la campagne</label><div className="mt-1 p-1.5 border rounded bg-slate-50">Ventes T4</div></div>
                                    <div><label className="font-medium">Mode de numérotation</label><div className="mt-1 p-1.5 border rounded bg-slate-50">Progressif</div></div>
                                </div>
                             </div>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Flux SVI (Serveur Vocal Interactif)" icon={InboxArrowDownIcon}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <h3 className="font-semibold text-slate-800">Construire un parcours d'appel</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                L'éditeur de SVI vous permet de dessiner le parcours de vos appelants. Vous glissez-déposez des "nœuds" sur le canevas et les reliez entre eux.
                                <br/><br/>
                                Chaque nœud a une fonction précise : jouer un message, proposer un menu, transférer l'appel, vérifier les horaires d'ouverture, etc.
                                La connexion entre les nœuds définit la logique de votre SVI.
                            </p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 shadow-inner">
                            <h4 className="text-sm font-semibold text-center mb-2 text-slate-600">Exemple: Design d'un SVI simple</h4>
                            <div className="relative h-48 bg-slate-200 rounded-md p-2 flex items-center justify-center gap-16">
                                <div className="absolute top-1/2 left-20 w-24 h-0.5 bg-slate-500"></div>
                                <div className="absolute top-1/2 right-20 w-24 h-0.5 bg-slate-500"></div>
                                
                                <div className="bg-green-100 p-2 rounded-md border-2 border-green-300 text-xs text-center"><PlayIcon className="w-4 h-4 mx-auto mb-1"/>Début</div>
                                <div className="bg-violet-100 p-2 rounded-md border-2 border-violet-300 text-xs text-center"><SpeakerWaveIcon className="w-4 h-4 mx-auto mb-1"/>Média</div>
                                <div className="bg-blue-100 p-2 rounded-md border-2 border-blue-300 text-xs text-center"><MenuIcon className="w-4 h-4 mx-auto mb-1"/>Menu</div>
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                 <AccordionItem title="Qualifications d'Appel" icon={WrenchScrewdriverIcon}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <h3 className="font-semibold text-slate-800">Qualifier les résultats</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                Les qualifications sont les statuts que les agents appliquent à la fin de chaque appel (ex: "Vente réalisée", "Pas intéressé", "Répondeur").
                                <br/><br/>
                                Elles sont essentielles pour deux raisons :
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li><b>Reporting :</b> Elles permettent de mesurer la performance des campagnes.</li>
                                    <li><b>Recyclage :</b> Elles indiquent au système s'il doit rappeler un contact plus tard.</li>
                                </ul>
                                Vous devez d'abord créer des 'Groupes' puis y assigner des qualifications.
                            </p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 shadow-inner">
                             <h4 className="text-sm font-semibold text-center mb-2 text-slate-600">Exemple: Éditeur de groupe</h4>
                             <div className="bg-white p-3 rounded-md text-xs flex gap-3 h-48">
                                <div className="w-1/2 bg-slate-50 p-2 rounded border">
                                    <h5 className="font-semibold mb-2">Disponibles</h5>
                                    <div className="p-1.5 border rounded bg-white text-center">Vente réalisée</div>
                                </div>
                                <div className="w-1/2 bg-slate-50 p-2 rounded border">
                                    <h5 className="font-semibold mb-2">Assignées</h5>
                                    <div className="p-1.5 border rounded bg-white text-center opacity-60">Répondeur</div>
                                </div>
                             </div>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Rapports & Analytiques" icon={ChartBarIcon}>
                     <div>
                        <h3 className="font-semibold text-slate-800">Analyser la Performance</h3>
                        <p className="mt-2 text-sm text-slate-600">
                           Le module de reporting est votre outil pour analyser les données historiques. Utilisez les filtres en haut pour définir la période, la campagne ou l'agent que vous souhaitez analyser.
                           <br/><br/>
                           Les KPIs se mettent à jour automatiquement. Naviguez entre les onglets pour voir les données sous forme de graphiques, de tableaux de performance, ou d'historique détaillé. Enfin, cliquez sur "Exporter en PDF" pour générer un rapport complet et professionnel de votre sélection.
                        </p>
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
};

export default HelpCenter;