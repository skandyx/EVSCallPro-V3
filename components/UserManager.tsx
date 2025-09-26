import React, { useState, useEffect, useMemo } from 'react';
import type { Feature, User, UserRole, Campaign, UserGroup, Site } from '../types.ts';
import { UsersIcon, PlusIcon, EditIcon, TrashIcon } from './Icons.tsx';
import ImportUsersModal from './ImportUsersModal.tsx';

const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 8;
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${enabled ? 'bg-indigo-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
        role="switch"
        aria-checked={enabled}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

interface UserModalProps {
    user: User;
    users: User[];
    campaigns: Campaign[];
    userGroups: UserGroup[];
    sites: Site[];
    currentUser: User;
    onSave: (user: User, groupIds: string[]) => void;
    onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, users, campaigns, userGroups, sites, currentUser, onSave, onClose }) => {
    const [formData, setFormData] = useState<User>(user);
    const [isEmailEnabled, setIsEmailEnabled] = useState(!!user.email);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'groups' | 'campaigns'>('general');
    const canManageStationMode = ['Superviseur', 'Administrateur', 'SuperAdmin'].includes(currentUser.role);

    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => 
        user ? userGroups.filter(g => g.memberIds.includes(user.id)).map(g => g.id) : []
    );
    
    useEffect(() => {
        setFormData(user);
        // Generate a password only for a completely new user being created via the modal.
        // A user is considered "new from modal" if their ID starts with 'new-' and they don't have a first name yet.
        // This prevents re-generating passwords for bulk-created users who are being edited.
        if (user.id.startsWith('new-') && !user.firstName && !user.password) {
            setFormData(prev => ({ ...prev, password: generatePassword() }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'loginId' || name === 'email') setError(null);
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };

    const handleCampaignChange = (campaignId: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentCampaignIds = prev.campaignIds || [];
            if (isChecked) {
                return { ...prev, campaignIds: [...new Set([...currentCampaignIds, campaignId])] };
            } else {
                return { ...prev, campaignIds: currentCampaignIds.filter(id => id !== campaignId) };
            }
        });
    };
    
    const handleGroupChange = (groupId: string, isChecked: boolean) => {
        setSelectedGroupIds(prev => {
            if (isChecked) {
                return [...new Set([...prev, groupId])];
            } else {
                return prev.filter(id => id !== groupId);
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const loginIdExists = users.some(u => u.loginId === formData.loginId && u.id !== formData.id);
        if (loginIdExists) {
            setError("L'identifiant / extension existe déjà pour un autre utilisateur.");
            setActiveTab('general');
            return;
        }

        if (isEmailEnabled && formData.email) {
            const emailExists = users.some(u => u.email && u.email.toLowerCase() === formData.email!.toLowerCase() && u.id !== formData.id);
            if (emailExists) {
                setError("L'adresse email est déjà utilisée par un autre utilisateur.");
                setActiveTab('general');
                return;
            }
        }

        // Prevent last SuperAdmin from changing their role
        if (user.role === 'SuperAdmin' && formData.role !== 'SuperAdmin') {
            const superAdminCount = users.filter(u => u.role === 'SuperAdmin').length;
            if (superAdminCount <= 1) {
                setError("Impossible de modifier le rôle du dernier SuperAdmin.");
                setActiveTab('general');
                return;
            }
        }
        
        const dataToSave = { ...formData };
        if (!isEmailEnabled) dataToSave.email = '';

        onSave(dataToSave, selectedGroupIds);
    };
    
    const handleGeneratePassword = () => {
        setFormData(prev => ({ ...prev, password: generatePassword() }));
    };
    
    const handleToggleEmail = () => {
        setIsEmailEnabled(prev => !prev);
        if (isEmailEnabled) setFormData(f => ({ ...f, email: '' }));
    };

    const isNewUser = user.id.startsWith('new-');
    
    const TabButton: React.FC<{tabName: 'general' | 'groups' | 'campaigns', label: string}> = ({tabName, label}) => (
        <button type="button" onClick={() => setActiveTab(tabName)} className={`py-2 px-4 text-sm font-medium rounded-t-lg ${activeTab === tabName ? 'bg-white text-indigo-600 border-b-0' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b bg-white rounded-t-lg">
                        <h3 className="text-lg font-medium leading-6 text-slate-900">{isNewUser ? 'Ajouter un nouvel utilisateur' : 'Modifier l\'utilisateur'}</h3>
                    </div>
                    <div className="border-b border-slate-200 px-4 pt-2">
                        <nav className="-mb-px flex space-x-2">
                           <TabButton tabName="general" label="Général" />
                           <TabButton tabName="groups" label="Groupes Assignés" />
                           <TabButton tabName="campaigns" label="Campagnes Assignées" />
                        </nav>
                    </div>

                    <div className="p-6 bg-white flex-1 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">Prénom</label>
                                        <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border"/>
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Nom</label>
                                        <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border"/>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="loginId" className="block text-sm font-medium text-slate-700">Identifiant / Extension</label>
                                    <input type="text" name="loginId" id="loginId" value={formData.loginId} onChange={handleChange} required pattern="\d{4,6}" title="Doit contenir 4 à 6 chiffres." placeholder="Ex: 1001" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border"/>
                                    <p className="mt-1 text-xs text-slate-500">Doit être un numéro unique de 4 à 6 chiffres.</p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                                        <button type="button" onClick={handleToggleEmail} className={`${isEmailEnabled ? 'bg-indigo-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`} aria-pressed={isEmailEnabled} >
                                            <span aria-hidden="true" className={`${isEmailEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
                                        </button>
                                    </div>
                                    <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} required={isEmailEnabled} disabled={!isEmailEnabled} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border disabled:bg-slate-50 disabled:text-slate-400"/>
                                </div>
                                 {error && <p className="mt-1 text-sm text-red-600 font-semibold">{error}</p>}
                                <div>
                                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-slate-700">Numéro de mobile (pour "Connect to Phone")</label>
                                    <input type="tel" name="mobileNumber" id="mobileNumber" value={formData.mobileNumber || ''} onChange={handleChange} placeholder="Ex: 0612345678" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border"/>
                                </div>
                                {canManageStationMode && (
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div>
                                            <label className="font-medium text-slate-700">Utiliser le mobile comme poste de travail</label>
                                            <p className="text-xs text-slate-500">Si activé, les appels seront envoyés vers ce numéro mobile.</p>
                                        </div>
                                        <ToggleSwitch
                                            enabled={!!formData.useMobileAsStation}
                                            onChange={isEnabled => setFormData(f => ({ ...f, useMobileAsStation: isEnabled }))}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Mot de passe</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            name="password"
                                            id="password"
                                            value={formData.password || ''}
                                            onChange={handleChange}
                                            required={isNewUser && !formData.firstName}
                                            placeholder={isNewUser ? '' : 'Laisser vide pour ne pas changer'}
                                            className="block w-full flex-1 rounded-none rounded-l-md border-slate-300 p-2 border"
                                        />
                                        <button type="button" onClick={handleGeneratePassword} className="inline-flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500 hover:bg-slate-100">Générer</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="role" className="block text-sm font-medium text-slate-700">Rôle</label>
                                        <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border bg-white">
                                            <option>Agent</option>
                                            <option>Superviseur</option>
                                            <option>Administrateur</option>
                                            {currentUser.role === 'SuperAdmin' && <option>SuperAdmin</option>}
                                        </select>
                                    </div>
                                     <div>
                                        <label htmlFor="siteId" className="block text-sm font-medium text-slate-700">Site d'affectation</label>
                                        <select id="siteId" name="siteId" value={formData.siteId || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border bg-white">
                                            <option value="">Aucun site</option>
                                            {sites.map(site => (
                                                <option key={site.id} value={site.id}>{site.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex h-5 items-center">
                                        <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-indigo-600"/>
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="isActive" className="font-medium text-slate-700">Utilisateur Actif</label>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'groups' && (
                             <div className="space-y-2">
                                {userGroups.length > 0 ? userGroups.map(group => (
                                    <div key={group.id} className="flex items-center p-2 rounded-md hover:bg-slate-50">
                                        <input id={`group-${group.id}`} type="checkbox" checked={selectedGroupIds.includes(group.id)} onChange={(e) => handleGroupChange(group.id, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600"/>
                                        <label htmlFor={`group-${group.id}`} className="ml-3 text-sm text-slate-600">{group.name}</label>
                                    </div>
                                )) : <p className="text-sm text-slate-500 italic text-center">Aucun groupe d'agents n'a été créé.</p>}
                            </div>
                        )}
                        {activeTab === 'campaigns' && (
                            <div className="space-y-2">
                                {campaigns.length > 0 ? campaigns.map(campaign => (
                                    <div key={campaign.id} className="flex items-center p-2 rounded-md hover:bg-slate-50">
                                        <input id={`campaign-${campaign.id}`} type="checkbox" checked={formData.campaignIds?.includes(campaign.id) || false} onChange={(e) => handleCampaignChange(campaign.id, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600"/>
                                        <label htmlFor={`campaign-${campaign.id}`} className="ml-3 text-sm text-slate-600">{campaign.name}</label>
                                    </div>
                                )) : <p className="text-sm text-slate-500 italic text-center">Aucune campagne disponible.</p>}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-slate-100 px-4 py-3 sm:flex sm:flex-row-reverse rounded-b-lg border-t">
                        <button type="submit" className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 sm:ml-3 sm:w-auto">Enregistrer</button>
                        <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:mt-0 sm:w-auto">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MODAL: Generate Users in Bulk ---
interface GenerateModalProps {
    onConfirm: (count: number) => void;
    onClose: () => void;
}

const GenerateModal: React.FC<GenerateModalProps> = ({ onConfirm, onClose }) => {
    const [count, setCount] = useState(10);
    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6">
                    <h3 className="text-lg font-medium text-slate-900">Générer des utilisateurs en masse</h3>
                    <div className="mt-4">
                        <label htmlFor="user-count" className="block text-sm font-medium text-slate-700">
                            Nombre d'utilisateurs à créer
                        </label>
                        <input
                            type="number"
                            id="user-count"
                            value={count}
                            onChange={e => setCount(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
                            min="1"
                            max="99"
                            className="mt-1 block w-full p-2 border border-slate-300 rounded-md"
                        />
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 flex justify-end gap-2">
                    <button onClick={onClose} className="border border-slate-300 bg-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50">Annuler</button>
                    <button onClick={() => onConfirm(count)} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Confirmer</button>
                </div>
            </div>
        </div>
    );
};

interface UserManagerProps {
    feature: Feature;
    users: User[];
    campaigns: Campaign[];
    userGroups: UserGroup[];
    sites: Site[];
    onSaveUser: (user: User, groupIds: string[]) => void;
    onDeleteUser: (userId: string) => void;
    onGenerateUsers: (users: User[]) => void;
    onImportUsers: (users: User[]) => void;
    currentUser: User;
}

const UserManager: React.FC<UserManagerProps> = ({ feature, users, campaigns, userGroups, sites, onSaveUser, onDeleteUser, onGenerateUsers, onImportUsers, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);

  const usersToDisplay = useMemo(() => {
    if (currentUser.role === 'SuperAdmin') {
        return users;
    }
    return users.filter(user => user.role !== 'SuperAdmin');
  }, [users, currentUser]);

  const handleAddNew = () => {
    setEditingUser({
        id: `new-${Date.now()}`,
        loginId: '',
        firstName: '',
        lastName: '',
        email: '',
        role: 'Agent',
        isActive: true,
        campaignIds: [],
        password: '',
        siteId: null,
        mobileNumber: '',
        useMobileAsStation: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const handleSave = (user: User, groupIds: string[]) => {
    onSaveUser(user, groupIds);
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const handleImport = () => {
    setIsImportModalOpen(true);
  };
  
  const handleConfirmGeneration = (count: number) => {
    const newUsers: User[] = [];
    const existingLoginIds = new Set(users.map(u => u.loginId));
    
    const highestAgentId = users
      .map(u => parseInt(u.loginId, 10))
      .filter(id => !isNaN(id) && id >= 1000 && id < 9000)
      .reduce((max, current) => Math.max(max, current), 1000);

    let nextLoginId = highestAgentId + 1;

    for (let i = 0; i < count; i++) {
        while (existingLoginIds.has(nextLoginId.toString())) {
            nextLoginId++;
        }
        const loginId = nextLoginId.toString();
        existingLoginIds.add(loginId);
        
        newUsers.push({
            id: `new-gen-${Date.now() + i}`,
            loginId: loginId,
            firstName: `Agent`,
            lastName: `${loginId}`,
            email: ``,
            role: 'Agent',
            isActive: true,
            campaignIds: [],
            password: generatePassword(),
            siteId: null,
        });
    }
    onGenerateUsers(newUsers);
    setIsGeneratingModalOpen(false);
  };

  const getDeletionState = (user: User): { canDelete: boolean; tooltip: string } => {
    if (user.role === 'SuperAdmin') {
        return { canDelete: false, tooltip: "Un SuperAdmin ne peut pas être supprimé." };
    }
    if (user.isActive) {
      return { canDelete: false, tooltip: "Désactivez l'utilisateur pour pouvoir le supprimer." };
    }
    if (user.role === 'Administrateur') {
      const adminCount = users.filter(u => u.role === 'Administrateur').length;
      if (adminCount <= 1) {
        return { canDelete: false, tooltip: "Impossible de supprimer le dernier administrateur." };
      }
    }
    return { canDelete: true, tooltip: "Supprimer l'utilisateur" };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {isModalOpen && editingUser && <UserModal user={editingUser} users={users} campaigns={campaigns} userGroups={userGroups} sites={sites} currentUser={currentUser} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
      {isImportModalOpen && <ImportUsersModal onClose={() => setIsImportModalOpen(false)} onImport={onImportUsers} existingUsers={users} />}
      {isGeneratingModalOpen && <GenerateModal onClose={() => setIsGeneratingModalOpen(false)} onConfirm={handleConfirmGeneration} />}
      <header>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
        <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
      </header>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Utilisateurs</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleImport} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors">Importer (CSV)</button>
             <button onClick={() => setIsGeneratingModalOpen(true)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors">Générer en masse</button>
            <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors inline-flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Ajouter un utilisateur
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Identifiant / Ext.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {usersToDisplay.map(user => {
                const { canDelete, tooltip } = getDeletionState(user);
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-slate-200 rounded-full flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-slate-500"/>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{user.loginId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"><EditIcon className="w-4 h-4 mr-1"/> Modifier</button>
                      <button onClick={() => onDeleteUser(user.id)} className={`inline-flex items-center ${!canDelete ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`} disabled={!canDelete} title={tooltip}>
                          <TrashIcon className="w-4 h-4 mr-1"/> Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager;