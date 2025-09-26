import React, { useState, useEffect } from 'react';
import type { SavedScript, ScriptBlock, DisplayCondition, Page, ButtonAction, Contact, ContactNote, User, Campaign } from '../types.ts';

interface AgentPreviewProps {
  script: SavedScript;
  onClose: () => void;
  embedded?: boolean;
  contact?: Contact | null;
  contactNotes?: ContactNote[];
  users?: User[];
  newNote?: string;
  setNewNote?: (note: string) => void;
  onSaveNote?: () => void;
  campaign?: Campaign | null;
  onInsertContact?: (campaignId: string, contactData: Record<string, any>, phoneNumber: string) => Promise<void>;
}

const checkCondition = (condition: DisplayCondition | null, values: Record<string, any>): boolean => {
    if (!condition || !condition.blockFieldName) return true;
    const targetValue = values[condition.blockFieldName];
    if (Array.isArray(targetValue)) {
        return targetValue.includes(condition.value);
    }
    return targetValue === condition.value;
};

const AgentPreview: React.FC<AgentPreviewProps> = ({ 
    script, onClose, embedded = false, contact = null, 
    contactNotes = [], users = [], newNote = '', setNewNote = () => {}, onSaveNote = () => {},
    campaign = null, onInsertContact = async () => {}
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [currentPageId, setCurrentPageId] = useState<string>(script.startPageId);

  // Effect to correctly initialize form values when a new contact is presented.
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    if (contact) {
        // 1. Map standard fields from the Contact object to their corresponding snake_case fieldName
        initialValues['first_name'] = contact.firstName || '';
        initialValues['last_name'] = contact.lastName || '';
        initialValues['phone_number'] = contact.phoneNumber || '';
        initialValues['postal_code'] = contact.postalCode || '';
        
        // 2. Merge custom fields, which are already keyed by their fieldName
        if (contact.customFields) {
            for (const key in contact.customFields) {
                initialValues[key] = contact.customFields[key];
            }
        }
    }
    setFormValues(initialValues);
    setCurrentPageId(script.startPageId);
  }, [contact, script.startPageId]);


  const handleValueChange = (fieldName: string, value: any) => {
      setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleCheckboxChange = (fieldName: string, option: string, checked: boolean) => {
    setFormValues(prev => {
        const existing: string[] = prev[fieldName] || [];
        if (checked) {
            return { ...prev, [fieldName]: [...existing, option] };
        } else {
            return { ...prev, [fieldName]: existing.filter(item => item !== option) };
        }
    });
  };

  const handleButtonClick = (action: ButtonAction) => {
    switch(action.type) {
        case 'save':
            alert('Données enregistrées (simulation):\n' + JSON.stringify(formValues, null, 2));
            break;
        case 'insert_contact':
            if (onInsertContact && campaign) {
                const phoneBlock = script.pages.flatMap(p => p.blocks).find(b => b.type === 'phone');
                const phoneNumber = phoneBlock ? formValues[phoneBlock.fieldName] : '';

                if (!phoneNumber || !/^\d{10,}$/.test(phoneNumber.replace(/\s/g, ''))) {
                    alert("Veuillez renseigner un numéro de téléphone valide dans le script avant d'insérer une fiche.");
                    return;
                }
                onInsertContact(campaign.id, formValues, phoneNumber)
                    .then(() => {
                        alert('Nouvelle fiche contact insérée avec succès !');
                        setFormValues({});
                    })
                    .catch(err => {
                        alert(`Erreur lors de l'insertion de la fiche : ${err.message}`);
                    });
            }
            break;
        case 'navigate':
            if (action.pageId) setCurrentPageId(action.pageId);
            break;
        case 'next': {
            const currentIndex = script.pages.findIndex(p => p.id === currentPageId);
            if (currentIndex < script.pages.length - 1) {
                setCurrentPageId(script.pages[currentIndex + 1].id);
            }
            break;
        }
        case 'previous': {
            const currentIndex = script.pages.findIndex(p => p.id === currentPageId);
            if (currentIndex > 0) {
                setCurrentPageId(script.pages[currentIndex - 1].id);
            }
            break;
        }
        default:
            break;
    }
  };

  const renderBlock = (block: ScriptBlock) => {
    const commonContainerProps = {
      style: {
        backgroundColor: block.backgroundColor,
        color: block.textColor,
        fontFamily: block.fontFamily,
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        border: '1px solid #e2e8f0'
      },
      className: "p-3 rounded-md h-full flex flex-col justify-center"
    };

    const commonInputStyles = {
        backgroundColor: block.contentBackgroundColor,
        color: block.contentTextColor
    };

    switch (block.type) {
        case 'label':
            return <div {...commonContainerProps}><p className="font-bold text-lg whitespace-pre-wrap break-words">{block.content.text}</p></div>;
        case 'text':
            return <div {...commonContainerProps}><p className="whitespace-pre-wrap break-words">{block.content.text}</p></div>;
        case 'input':
            return (
                <div {...commonContainerProps}>
                    <label className="block font-semibold mb-1">{block.name}</label>
                    <input
                        type={block.content.format || 'text'}
                        placeholder={block.content.placeholder}
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={formValues[block.fieldName] || ''}
                        onChange={e => handleValueChange(block.fieldName, e.target.value)}
                        disabled={block.readOnly}
                    />
                </div>
            );
        case 'textarea':
             const textareaContainerProps = {
                 ...commonContainerProps,
                 className: "p-3 rounded-md h-full flex flex-col" // No justify-center
             };
             return (
                <div {...textareaContainerProps}>
                    <label className="block font-semibold mb-1 flex-shrink-0">{block.name}</label>
                    <textarea
                        placeholder={block.content.placeholder}
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md border-slate-300 flex-1 resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={block.fieldName.toLowerCase().includes('historique') ? newNote : (formValues[block.fieldName] || '')}
                        onChange={e => block.fieldName.toLowerCase().includes('historique') ? setNewNote(e.target.value) : handleValueChange(block.fieldName, e.target.value)}
                        disabled={block.readOnly}
                    />
                    {block.fieldName.toLowerCase().includes('historique') && (
                        <button onClick={onSaveNote} className="mt-2 w-full text-sm bg-indigo-100 text-indigo-700 font-semibold py-1.5 px-3 rounded-md hover:bg-indigo-200 disabled:opacity-50 flex-shrink-0" disabled={!newNote.trim()}>
                            Enregistrer la note
                        </button>
                    )}
                </div>
            );
         case 'history':
            const findAgentName = (agentId: string) => {
                const agent = users.find(u => u.id === agentId);
                return agent ? `${agent.firstName} ${agent.lastName}` : 'Inconnu';
            };
            return (
                <div {...commonContainerProps}>
                    <h4 className="font-semibold mb-2 border-b pb-1 text-slate-700 flex-shrink-0">Historique des remarques</h4>
                    <div className="space-y-3 overflow-y-auto text-xs flex-1 pr-1">
                        {contactNotes.length > 0 ? contactNotes.map((note) => (
                             <div key={note.id} className="p-2 rounded bg-slate-50">
                                 <div className="flex justify-between items-baseline text-slate-500 mb-1">
                                     <span className="font-semibold">{findAgentName(note.agentId)}</span>
                                     <span>{new Date(note.createdAt).toLocaleString('fr-FR')}</span>
                                 </div>
                                 <p className="text-slate-800 whitespace-pre-wrap">{note.note}</p>
                             </div>
                        )) : <p className="text-center italic text-slate-400 pt-4">Aucune remarque pour ce contact.</p>}
                    </div>
                </div>
            );
        case 'radio':
            return (
                <div {...commonContainerProps}>
                    <p className="font-semibold mb-2">{block.content.question}</p>
                    <div className="space-y-1">
                        {block.content.options.map((opt: string) => (
                            <label key={opt} className={`flex items-center ${block.readOnly ? 'cursor-not-allowed text-slate-400' : ''}`}>
                                <input type="radio" name={block.fieldName} value={opt} checked={formValues[block.fieldName] === opt} onChange={e => handleValueChange(block.fieldName, e.target.value)} className="mr-2" disabled={block.readOnly} />
                                {opt}
                            </label>
                        ))}
                    </div>
                </div>
            );
        case 'checkbox':
            return (
                <div {...commonContainerProps}>
                    <p className="font-semibold mb-2">{block.content.question}</p>
                    <div className="space-y-1">
                        {block.content.options.map((opt: string) => (
                            <label key={opt} className={`flex items-center ${block.readOnly ? 'cursor-not-allowed text-slate-400' : ''}`}>
                                <input type="checkbox" name={`${block.fieldName}-${opt}`} value={opt} checked={Array.isArray(formValues[block.fieldName]) && formValues[block.fieldName].includes(opt)} onChange={e => handleCheckboxChange(block.fieldName, opt, e.target.checked)} className="mr-2" disabled={block.readOnly} />
                                {opt}
                            </label>
                        ))}
                    </div>
                </div>
            );
        case 'dropdown':
             return (
                <div {...commonContainerProps}>
                    <label className="block font-semibold mb-1">{block.name}</label>
                    <select
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={formValues[block.fieldName] || ''}
                        onChange={e => handleValueChange(block.fieldName, e.target.value)}
                        disabled={block.readOnly}
                    >
                        <option value="">-- Sélectionnez --</option>
                        {block.content.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            );
        case 'date':
            return (
                <div {...commonContainerProps}>
                    <label className="block font-semibold mb-1">{block.name}</label>
                    <input
                        type="date"
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={formValues[block.fieldName] || ''}
                        onChange={e => handleValueChange(block.fieldName, e.target.value)}
                        disabled={block.readOnly}
                    />
                </div>
            );
        case 'phone':
             return (
                <div {...commonContainerProps}>
                    <label className="block font-semibold mb-1">{block.name}</label>
                    <input
                        type="tel"
                        placeholder={block.content.placeholder}
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={formValues[block.fieldName] || ''}
                        onChange={e => handleValueChange(block.fieldName, e.target.value)}
                        disabled={block.readOnly}
                    />
                </div>
            );
        case 'web-view':
            return (
                <div {...commonContainerProps} className="p-0 rounded-md h-full flex flex-col overflow-hidden">
                    <iframe src={block.content.url} className="w-full h-full border-0" title={block.name}></iframe>
                </div>
            );
        case 'email':
            return (
                <div {...commonContainerProps}>
                    <label className="block font-semibold mb-1">{block.name}</label>
                    <input
                        type="email"
                        placeholder={block.content.placeholder}
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={formValues[block.fieldName] || ''}
                        onChange={e => handleValueChange(block.fieldName, e.target.value)}
                        disabled={block.readOnly}
                    />
                </div>
            );
        case 'time':
            return (
                <div {...commonContainerProps}>
                    <label className="block font-semibold mb-1">{block.name}</label>
                    <input
                        type="time"
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={formValues[block.fieldName] || ''}
                        onChange={e => handleValueChange(block.fieldName, e.target.value)}
                        disabled={block.readOnly}
                    />
                </div>
            );
        case 'button':
            return (
                <div {...commonContainerProps} className="p-2 rounded-md h-full flex flex-col justify-center">
                    <button
                        style={commonInputStyles}
                        className="w-full p-2 border rounded-md font-semibold hover:opacity-80 transition-opacity"
                        onClick={() => handleButtonClick(block.content.action)}
                    >
                        {block.content.text}
                    </button>
                </div>
            );
        default:
            return <div {...commonContainerProps}>Type de bloc non supporté: {block.type}</div>
    }
  }
  
  const currentPage = script.pages.find(p => p.id === currentPageId);

  const ScriptCanvas = (
    <div 
      className="h-full rounded-lg p-4 overflow-y-auto relative"
      style={{ backgroundColor: script.backgroundColor }}
    >
      {currentPage?.blocks
          .filter(block => block.type !== 'group' && block.isVisible !== false && checkCondition(block.displayCondition, formValues))
          .map(block => (
              <div key={block.id} style={{ position: 'absolute', left: block.x, top: block.y, width: block.width, height: block.height }}>
                  {renderBlock(block)}
              </div>
          ))
      }
    </div>
  );

  if (embedded) {
    // Embedded mode for AgentView
    return (
      <div className="h-full w-full flex flex-col">
        <header className="p-3 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-800 truncate">{script.name}</h2>
            <p className="text-xs text-slate-500">Page: {currentPage?.name}</p>
        </header>
        <div className="flex-1 overflow-hidden p-2 bg-slate-50">
          {ScriptCanvas}
        </div>
      </div>
    );
  }

  // Modal mode for ScriptBuilder preview
  return (
    <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Prévisualisation Agent - {script.name}</h2>
            <p className="text-sm text-slate-500">Page Actuelle: {currentPage?.name}</p>
          </div>
          <button onClick={onClose} className="bg-slate-100 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-200">
            Retour à l'éditeur
          </button>
        </header>

        <div className="flex-1 overflow-hidden p-4">
          {ScriptCanvas}
        </div>
      </div>
    </div>
  );
};

export default AgentPreview;