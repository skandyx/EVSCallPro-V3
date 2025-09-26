
import React, { useState, useEffect, useCallback } from 'react';
import type { Feature, User, FeatureId, ModuleVisibility, SavedScript, Campaign, Contact, UserGroup, Site, Qualification, QualificationGroup, IvrFlow, AudioFile, Trunk, Did, BackupLog, BackupSchedule, AgentSession, CallHistoryRecord, SystemLog, VersionInfo, ConnectivityService, ActivityType, PlanningEvent, SystemConnectionSettings, ContactNote, PersonalCallback } from './types.ts';
import { features } from './data/features.ts';
import Sidebar from './components/Sidebar.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import AgentView from './components/AgentView.tsx';
import Header from './components/Header.tsx';
import MonitoringDashboard from './components/MonitoringDashboard.tsx';
import apiClient from './src/lib/axios.ts'; // Utilisation de l'instance Axios configurée

// Création d'un contexte pour les alertes (toast)
export const AlertContext = React.createContext<{
    showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}>({ showAlert: () => {} });

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeFeatureId, setActiveFeatureId] = useState<FeatureId>('users');
    const [allData, setAllData] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState<'app' | 'monitoring'>('app');
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info'; key: number } | null>(null);

    const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlert({ message, type, key: Date.now() });
    }, []);

    const fetchApplicationData = useCallback(async () => {
        try {
            // setIsLoading(true) is not needed here as it's handled by the session check
            const response = await apiClient.get('/application-data');
            setAllData(response.data);
        } catch (error) {
            console.error("Failed to fetch application data:", error);
            showAlert("Impossible de charger les données de l'application.", 'error');
        }
    }, [showAlert]);
    
    // Check for existing token on mount and restore session
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    // Call the new /me endpoint to verify the token and get user data
                    const response = await apiClient.get('/auth/me');
                    setCurrentUser(response.data.user);
                    // Once user is confirmed, fetch the rest of the app data
                    await fetchApplicationData();
                } catch (error) {
                    // Token is invalid or expired
                    console.error("Session check failed:", error);
                    localStorage.removeItem('authToken');
                    setCurrentUser(null);
                }
            }
            setIsLoading(false);
        };

        checkSession();
    }, [fetchApplicationData]);

    const handleLoginSuccess = ({ user, token }: { user: User, token: string }) => {
        localStorage.setItem('authToken', token);
        setCurrentUser(user);
        setIsLoading(true);
        fetchApplicationData().finally(() => setIsLoading(false));
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setAllData({});
        // No need to call API for logout, token is removed client-side
    };

    const handleSaveOrUpdate = async (dataType: string, data: any, endpoint?: string) => {
        try {
            // A special map because some `dataType` values (for endpoints) don't match `allData` keys (for state).
            const dataTypeToStateKey: { [key: string]: keyof typeof allData } = {
                'users': 'users', 'user-groups': 'userGroups', 'scripts': 'savedScripts',
                'campaigns': 'campaigns', 'qualifications': 'qualifications', 'qualification-groups': 'qualificationGroups',
                'ivr-flows': 'ivrFlows', 'audio-files': 'audioFiles', 'trunks': 'trunks',
                'dids': 'dids', 'sites': 'sites', 'planning-events': 'planningEvents'
            };

            const collectionKey = dataTypeToStateKey[dataType];
            const collection = collectionKey ? allData[collectionKey] : [];
            const itemExistsInState = Array.isArray(collection) ? collection.some((item: any) => item.id === data.id) : false;
            
            // CORRECTED LOGIC: The sole source of truth to determine if an item is new
            // is its absence from the current application state. The format of the ID is irrelevant.
            const isNew = !itemExistsInState;

            const url = endpoint || `/${dataType.toLowerCase()}`;
            
            const response = isNew
                ? await apiClient.post(url, data)
                : await apiClient.put(`${url}/${data.id}`, data);
            
            await fetchApplicationData(); // Re-fetch all data to ensure consistency
            showAlert('Enregistrement réussi !', 'success');
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || `Échec de l'enregistrement.`;
            console.error(`Failed to save ${dataType}:`, error);
            showAlert(errorMessage, 'error');
            throw error;
        }
    };
    
    // FIX: Corrected the signature and implementation of the `handleDelete` function to accept an optional `endpoint` parameter. This resolves errors where it was called with three arguments instead of the expected two, ensuring that API calls for deletion are made to the correct custom endpoints when provided.
    const handleDelete = async (dataType: string, id: string, endpoint?: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
            try {
                const url = endpoint || `/${dataType.toLowerCase()}`;
                await apiClient.delete(`${url}/${id}`);
                await fetchApplicationData();
                showAlert('Suppression réussie !', 'success');
            } catch (error: any) {
                const errorMessage = error.response?.data?.error || `Échec de la suppression.`;
                console.error(`Failed to delete ${dataType}:`, error);
                showAlert(errorMessage, 'error');
            }
        }
    };

    const handleSaveVisibilitySettings = (visibility: ModuleVisibility) => {
        // As there's no backend endpoint, this is a client-side state update for the current session.
        setAllData(prevData => ({
            ...prevData,
            moduleVisibility: visibility,
        }));
        showAlert('Paramètres de visibilité mis à jour.', 'success');
    };

    const handleSaveUser = async (user: User, groupIds: string[]) => {
       await handleSaveOrUpdate('users', { ...user, groupIds });
    };

    const handleBulkUsers = async (users: User[], successMessage: string) => {
        try {
            await apiClient.post('/users/bulk', { users });
            await fetchApplicationData();
            showAlert(successMessage, 'success');
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || `Échec de la création en masse.`;
            console.error(`Failed to bulk create users:`, error);
            showAlert(errorMessage, 'error');
            throw error;
        }
    };
    
    const handleGenerateUsers = async (users: User[]) => {
        await handleBulkUsers(users, `${users.length} utilisateurs générés avec succès.`);
    };

    const handleImportUsers = async (users: User[]) => {
        await handleBulkUsers(users, `${users.length} utilisateurs importés avec succès.`);
    };

    const handleImportContacts = async (campaignId: string, contacts: Contact[], deduplicationConfig: { enabled: boolean; fieldIds: string[] }) => {
        try {
            await apiClient.post(`/campaigns/${campaignId}/contacts`, { contacts, deduplicationConfig });
            await fetchApplicationData();
            showAlert(`${contacts.length} contacts importés avec succès.`, 'success');
        } catch (error) {
            showAlert("Erreur lors de l'importation des contacts.", 'error');
        }
    };

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center">Chargement...</div>;
    }

    if (!currentUser) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    if (currentUser.role === 'Agent') {
        // FIX: Cast `allData` to `any` to satisfy the `AgentData` type required by `AgentView`.
        // The `allData` object is fetched from the API and contains all necessary fields,
        // but its state is typed as `Record<string, any>` for flexibility elsewhere in the app.
        return <AgentView currentUser={currentUser} onLogout={handleLogout} data={allData as any} refreshData={fetchApplicationData} />;
    }

    const activeFeature = features.find(f => f.id === activeFeatureId) || null;
    const FeatureComponent = activeFeature?.component;

    const renderFeatureComponent = () => {
        if (!FeatureComponent) return null;

        const componentProps = {
            ...allData,
            features: features, // Pass the main features array to all components
            feature: activeFeature,
            currentUser,
            onSaveUser: handleSaveUser,
            onDeleteUser: (id: string) => handleDelete('users', id),
            onGenerateUsers: handleGenerateUsers,
            onImportUsers: handleImportUsers,
            onSaveUserGroup: (group: UserGroup) => handleSaveOrUpdate('user-groups', group),
            onDeleteUserGroup: (id: string) => handleDelete('user-groups', id),
            onSaveOrUpdateScript: (script: SavedScript) => handleSaveOrUpdate('scripts', script),
            onDeleteScript: (id: string) => handleDelete('scripts', id),
            onDuplicateScript: async (id: string) => { await apiClient.post(`/scripts/${id}/duplicate`); await fetchApplicationData(); },
            onSaveCampaign: (campaign: Campaign) => handleSaveOrUpdate('campaigns', campaign),
            onDeleteCampaign: (id: string) => handleDelete('campaigns', id),
            onImportContacts: handleImportContacts,
            onSaveQualification: (q: Qualification) => handleSaveOrUpdate('qualifications', q),
            onDeleteQualification: (id: string) => handleDelete('qualifications', id),
            onSaveQualificationGroup: (group: QualificationGroup, assignedQualIds: string[]) => handleSaveOrUpdate('qualification-groups', { ...group, assignedQualIds }, '/qualification-groups/groups'),
            onDeleteQualificationGroup: (id: string) => handleDelete('qualification-groups', id, '/qualification-groups/groups'),
            onSaveOrUpdateIvrFlow: (flow: IvrFlow) => handleSaveOrUpdate('ivr-flows', flow),
            onDeleteIvrFlow: (id: string) => handleDelete('ivr-flows', id),
            onDuplicateIvrFlow: async (id: string) => { await apiClient.post(`/ivr-flows/${id}/duplicate`); await fetchApplicationData(); },
            onSaveAudioFile: (file: AudioFile) => handleSaveOrUpdate('audio-files', file),
            onDeleteAudioFile: (id: string) => handleDelete('audio-files', id),
            onSaveTrunk: (trunk: Trunk) => handleSaveOrUpdate('trunks', trunk, '/telephony/trunks'),
            onDeleteTrunk: (id: string) => handleDelete('trunks', id, '/telephony/trunks'),
            onSaveDid: (did: Did) => handleSaveOrUpdate('dids', did, '/telephony/dids'),
            onDeleteDid: (id: string) => handleDelete('dids', id, '/telephony/dids'),
            onSaveSite: (site: Site) => handleSaveOrUpdate('sites', site),
            onDeleteSite: (id: string) => handleDelete('sites', id),
            onSavePlanningEvent: (event: PlanningEvent) => handleSaveOrUpdate('planning-events', event),
            onDeletePlanningEvent: (id: string) => handleDelete('planning-events', id),
            onSaveVisibilitySettings: handleSaveVisibilitySettings,
            apiCall: apiClient, // Passe l'instance axios configurée
        };
        
        return <FeatureComponent {...componentProps} />;
    };
    
     const AlertComponent = () => {
        if (!alert) return null;
        const colors = {
            success: 'bg-green-100 border-green-500 text-green-700',
            error: 'bg-red-100 border-red-500 text-red-700',
            info: 'bg-blue-100 border-blue-500 text-blue-700',
        };
        return (
            <div key={alert.key} className={`fixed bottom-5 right-5 p-4 border-l-4 rounded-md shadow-lg animate-fade-in-up ${colors[alert.type]}`}>
                {alert.message}
            </div>
        );
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            <div className="h-screen w-screen flex flex-col font-sans bg-slate-50">
                <div className="flex flex-1 min-h-0">
                    <Sidebar
                        features={features}
                        activeFeatureId={activeFeatureId}
                        onSelectFeature={(id) => { setActiveFeatureId(id); setActiveView('app'); }}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        moduleVisibility={allData.moduleVisibility || { categories: {}, features: {} }}
                    />
                    <div className="flex-1 flex flex-col min-w-0">
                        <Header activeView={activeView} onViewChange={setActiveView} />
                        <main className="flex-1 overflow-y-auto p-8">
                             {activeView === 'app' ? renderFeatureComponent() : <MonitoringDashboard {...({ ...allData, apiCall: apiClient } as any)} />}
                        </main>
                    </div>
                </div>
                 {alert && <AlertComponent />}
            </div>
        </AlertContext.Provider>
    );
};

export default App;
