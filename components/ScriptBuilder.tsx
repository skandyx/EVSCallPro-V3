import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SavedScript, Page, ScriptBlock, BlockType } from '../types.ts';
import {
    PlusIcon, TrashIcon, EyeIcon, SettingsIcon, PaletteIcon, XMarkIcon, ArrowLeftIcon, ArrowRightIcon,
    TextBlockIcon, InputIcon, RadioIcon, CheckboxIcon, DropdownIcon, WebBrowserIcon, DateIcon,
    PhoneIcon, EmailIcon, TimeIcon, ButtonIcon, LabelIcon, GroupIcon, MinusIcon, ResetViewIcon,
    AlignLeftIcon, AlignCenterIcon, AlignRightIcon, TextareaIcon, UserJourneyIcon as HistoryIcon
} from './Icons.tsx';

// Props definition
interface ScriptBuilderProps {
    script: SavedScript;
    onSave: (script: SavedScript) => void;
    onClose: () => void;
    onPreview: (script: SavedScript) => void;
}

const BLOCK_PALETTE: { type: BlockType; icon: React.FC<any>; label: string; default: Partial<ScriptBlock> }[] = [
    { type: 'group', icon: GroupIcon, label: 'Groupe', default: { width: 400, height: 250, backgroundColor: 'rgba(226, 232, 240, 0.5)', content: {} } },
    { type: 'label', icon: LabelIcon, label: 'Titre', default: { width: 300, height: 40, content: { text: 'Titre' }, fontSize: 18, textAlign: 'left' } },
    { type: 'text', icon: TextBlockIcon, label: 'Texte', default: { width: 300, height: 80, content: { text: 'Paragraphe de texte...' }, textAlign: 'left' } },
    { type: 'input', icon: InputIcon, label: 'Champ de Saisie', default: { width: 300, height: 70, content: { placeholder: 'Saisir ici', format: 'text' }, readOnly: false } },
    { type: 'textarea', icon: TextareaIcon, label: 'Texte Multi-ligne', default: { width: 300, height: 120, content: { placeholder: 'Saisir ici...' }, readOnly: false } },
    { type: 'email', icon: EmailIcon, label: 'Email', default: { width: 300, height: 70, content: { placeholder: 'email@example.com' }, readOnly: false } },
    { type: 'phone', icon: PhoneIcon, label: 'Téléphone', default: { width: 300, height: 70, content: { placeholder: '0123456789' }, readOnly: false } },
    { type: 'date', icon: DateIcon, label: 'Date', default: { width: 200, height: 70, content: { }, readOnly: false } },
    { type: 'time', icon: TimeIcon, label: 'Heure', default: { width: 200, height: 70, content: { }, readOnly: false } },
    { type: 'radio', icon: RadioIcon, label: 'Choix Unique', default: { width: 300, height: 120, content: { question: 'Question ?', options: ['Option 1', 'Option 2'] }, readOnly: false } },
    { type: 'checkbox', icon: CheckboxIcon, label: 'Choix Multiples', default: { width: 300, height: 120, content: { question: 'Question ?', options: ['Option A', 'Option B'] }, readOnly: false } },
    { type: 'dropdown', icon: DropdownIcon, label: 'Liste Déroulante', default: { width: 300, height: 70, content: { options: ['Valeur 1', 'Valeur 2'] }, readOnly: false } },
    { type: 'button', icon: ButtonIcon, label: 'Bouton', default: { width: 200, height: 50, content: { text: 'Cliquer', action: { type: 'none' } }, backgroundColor: '#4f46e5', textColor: '#ffffff', textAlign: 'center' } },
    { type: 'history', icon: HistoryIcon, label: 'Historique', default: { width: 400, height: 200, content: {} } },
];

const FONT_FAMILIES = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New'];

const sanitizeForTechnicalName = (name: string): string => {
  let technicalName = name.trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\p{L}\p{N}_]/gu, ''); // Keep only unicode letters, numbers, and underscore

  if (/^\d/.test(technicalName)) {
      technicalName = '_' + technicalName;
  }
  
  if (!technicalName) {
      return `field_${Date.now()}`;
  }
  return technicalName;
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

const ScriptBuilder: React.FC<ScriptBuilderProps> = ({ script, onSave, onClose, onPreview }) => {
    const [editedScript, setEditedScript] = useState<SavedScript>(() => JSON.parse(JSON.stringify(script)));
    const [activePageId, setActivePageId] = useState<string>(script.startPageId);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [propertiesTab, setPropertiesTab] = useState<'content' | 'style'>('content');
    const [tempBlockName, setTempBlockName] = useState('');
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef<any>(null);
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, zoom: 1 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });


    const activePage = editedScript.pages.find(p => p.id === activePageId);
    const selectedBlock = activePage?.blocks.find(b => b.id === selectedBlockId);

    useEffect(() => {
        if (selectedBlock) {
            setTempBlockName(selectedBlock.name);
        }
    }, [selectedBlock]);

    const updateScript = (updater: (draft: SavedScript) => void) => {
        setEditedScript(prev => {
            const draft = JSON.parse(JSON.stringify(prev));
            updater(draft);
            return draft;
        });
    };
    
    const handleBlockUpdate = (blockId: string, updates: Partial<ScriptBlock>) => {
        updateScript(draft => {
            const page = draft.pages.find(p => p.id === activePageId);
            if (page) {
                const blockIndex = page.blocks.findIndex(b => b.id === blockId);
                if (blockIndex > -1) {
                    page.blocks[blockIndex] = { ...page.blocks[blockIndex], ...updates };
                }
            }
        });
    };

    const handleBlockContentUpdate = (blockId: string, contentUpdates: any) => {
        updateScript(draft => {
            const page = draft.pages.find(p => p.id === activePageId);
            if(page) {
                const block = page.blocks.find(b => b.id === blockId);
                if(block) {
                    block.content = {...block.content, ...contentUpdates};
                }
            }
        });
    }

    const handleDeleteBlock = (blockId: string) => {
        updateScript(draft => {
            const page = draft.pages.find(p => p.id === activePageId);
            if (!page) return;

            const blockToDelete = page.blocks.find(b => b.id === blockId);
            if (!blockToDelete || blockToDelete.isStandard) return; // Cannot delete standard blocks

            if (blockToDelete.type === 'group') {
                 page.blocks.forEach(block => {
                    if (block.parentId === blockId) {
                        block.parentId = null;
                    }
                });
            }
            
            page.blocks = page.blocks.filter(b => b.id !== blockId);
        });
        setSelectedBlockId(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('blockType') as BlockType;
        const canvasBounds = canvasRef.current?.getBoundingClientRect();
        if (!type || !canvasBounds || !activePage) return;

        const paletteItem = BLOCK_PALETTE.find(item => item.type === type);
        if (!paletteItem) return;

        const x = (e.clientX - canvasBounds.left - viewTransform.x) / viewTransform.zoom;
        const y = (e.clientY - canvasBounds.top - viewTransform.y) / viewTransform.zoom;

        let parentId: string | null = null;
        for (const block of activePage.blocks) {
            if (block.type === 'group' && x > block.x && x < block.x + block.width && y > block.y && y < block.y + block.height) {
                parentId = block.id;
                break;
            }
        }
        
        const parent = parentId ? activePage.blocks.find(b => b.id === parentId) : null;
        
        const baseName = paletteItem.label;
        const existingNames = new Set(activePage.blocks.map(b => b.name));
        let counter = 1;
        let uniqueName = baseName;
        if(existingNames.has(uniqueName)) {
             uniqueName = `${baseName} ${counter}`;
             while (existingNames.has(uniqueName)) {
                counter++;
                uniqueName = `${baseName} ${counter}`;
            }
        }

        const uniqueFieldName = sanitizeForTechnicalName(uniqueName);

        const newBlock: ScriptBlock = {
            id: `block-${Date.now()}`,
            name: uniqueName,
            fieldName: uniqueFieldName,
            type,
            x: parent ? x - parent.x : x,
            y: parent ? y - parent.y : y,
            width: paletteItem.default.width || 200,
            height: paletteItem.default.height || 50,
            content: JSON.parse(JSON.stringify(paletteItem.default.content || {})),
            displayCondition: null,
            parentId,
            ...paletteItem.default
        };

        updateScript(draft => {
            draft.pages.find(p => p.id === activePageId)?.blocks.push(newBlock);
        });
    };
    
    const handleMouseDownOnBlock = (e: React.MouseEvent, blockId: string) => {
        e.stopPropagation();
        setSelectedBlockId(blockId);
        setPropertiesTab('content');
        const block = activePage?.blocks.find(b => b.id === blockId);
        if (!block || isPanning.current) return;

        dragInfo.current = {
            type: 'move',
            blockId,
            startX: e.clientX,
            startY: e.clientY,
            startBlockX: block.x,
            startBlockY: block.y,
        };
    };

    const handleMouseDownOnResizeHandle = (e: React.MouseEvent, blockId: string) => {
        e.stopPropagation();
        const block = activePage?.blocks.find(b => b.id === blockId);
        if (!block) return;
        dragInfo.current = {
            type: 'resize',
            blockId,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: block.width,
            startHeight: block.height,
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPanning.current) {
            const x = e.clientX - panStart.current.x;
            const y = e.clientY - panStart.current.y;
            setViewTransform(v => ({...v, x, y}));
            return;
        }

        if (!dragInfo.current) return;
        const { type, blockId, startX, startY } = dragInfo.current;
        const dx = (e.clientX - startX) / viewTransform.zoom;
        const dy = (e.clientY - startY) / viewTransform.zoom;

        if (type === 'move') {
            const { startBlockX, startBlockY } = dragInfo.current;
             updateScript(draft => {
                 const page = draft.pages.find(p => p.id === activePageId);
                 if (page) {
                    const mainBlock = page.blocks.find(b => b.id === blockId);
                    if (mainBlock) {
                        mainBlock.x = startBlockX + dx;
                        mainBlock.y = startBlockY + dy;
                    }
                 }
            });
        } else if (type === 'resize') {
            const { startWidth, startHeight } = dragInfo.current;
            const newWidth = Math.max(50, startWidth + dx);
            const newHeight = Math.max(40, startHeight + dy);
            handleBlockUpdate(blockId, { width: newWidth, height: newHeight });
        }
    }, [activePageId, viewTransform.zoom]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
        if(canvasRef.current) canvasRef.current.style.cursor = 'grab';
        dragInfo.current = null;
    }, []);
    
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.target !== e.currentTarget) return;
        setSelectedBlockId(null);
        isPanning.current = true;
        panStart.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
        if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    };
    
    useEffect(() => {
        const currentCanvas = canvasRef.current;
        const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
        const mouseUpHandler = () => handleMouseUp();
        
        window.addEventListener('mousemove', mouseMoveHandler);
        window.addEventListener('mouseup', mouseUpHandler);
        
        return () => {
            window.removeEventListener('mousemove', mouseMoveHandler);
            window.removeEventListener('mouseup', mouseUpHandler);
        };
    }, [handleMouseMove, handleMouseUp]);
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newZoom = Math.min(Math.max(viewTransform.zoom + scaleAmount, 0.2), 3);
        const canvasBounds = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - canvasBounds.left;
        const mouseY = e.clientY - canvasBounds.top;
        const newX = mouseX - (mouseX - viewTransform.x) * (newZoom / viewTransform.zoom);
        const newY = mouseY - (mouseY - viewTransform.y) * (newZoom / viewTransform.zoom);
        setViewTransform({ x: newX, y: newY, zoom: newZoom });
    };

    const handleAddPage = () => { /* ... */ };
    const handleDeletePage = (pageId: string) => { /* ... */ };

    const handleAddOption = (blockId: string) => {
        updateScript(draft => {
            const page = draft.pages.find(p => p.id === activePageId);
            if (page) {
                const block = page.blocks.find(b => b.id === blockId);
                if (block && Array.isArray(block.content.options)) {
                    block.content.options.push(`Nouvelle Option`);
                }
            }
        });
    };
    
    const handleOptionChange = (blockId: string, index: number, value: string) => {
        updateScript(draft => {
            const page = draft.pages.find(p => p.id === activePageId);
            if (page) {
                const block = page.blocks.find(b => b.id === blockId);
                if (block && Array.isArray(block.content.options) && block.content.options[index] !== undefined) {
                    block.content.options[index] = value;
                }
            }
        });
    };
    
    const handleDeleteOption = (blockId: string, index: number) => {
        updateScript(draft => {
            const page = draft.pages.find(p => p.id === activePageId);
            if (page) {
                const block = page.blocks.find(b => b.id === blockId);
                if (block && Array.isArray(block.content.options)) {
                    block.content.options.splice(index, 1);
                }
            }
        });
    };

    if (!activePage) return <div>Erreur: Page active non trouvée.</div>;

    const renderPropertiesPanel = () => {
        if (selectedBlock) {
             const handleNameChangeValidation = (newName: string) => {
                const trimmedName = newName.trim();
                if (!trimmedName) {
                    setTempBlockName(selectedBlock.name);
                    return;
                }
                
                if (selectedBlock.isStandard) {
                    handleBlockUpdate(selectedBlock.id, { name: trimmedName });
                    return;
                }

                const isNameTaken = activePage.blocks.some(b => b.id !== selectedBlock.id && b.name === trimmedName);
                if (isNameTaken) {
                    alert(`Le nom de bloc "${trimmedName}" est déjà utilisé sur cette page.`);
                    setTempBlockName(selectedBlock.name);
                    return;
                }
                
                const newFieldName = sanitizeForTechnicalName(trimmedName);
                const isFieldNameTaken = activePage.blocks.some(b => b.id !== selectedBlock.id && b.fieldName === newFieldName);
                if (isFieldNameTaken) {
                    alert(`Ce nom génère un identifiant technique ("${newFieldName}") qui est déjà utilisé. Veuillez choisir un nom légèrement différent.`);
                    setTempBlockName(selectedBlock.name);
                } else {
                    handleBlockUpdate(selectedBlock.id, { name: trimmedName, fieldName: newFieldName });
                }
            };
            const isInputType = ['input', 'email', 'phone', 'date', 'time', 'radio', 'checkbox', 'dropdown', 'textarea'].includes(selectedBlock.type);

             return (
                <div className="flex flex-col h-full">
                     <div>
                        <label className="font-medium text-xs text-slate-500">Nom du bloc (visible par l'agent)</label>
                        <input
                            type="text"
                            value={tempBlockName}
                            onChange={e => setTempBlockName(e.target.value)}
                            onBlur={e => handleNameChangeValidation(e.target.value)}
                            className="w-full mt-1 p-1 border rounded-md font-bold text-lg text-slate-800 focus:ring-2 focus:ring-indigo-300"
                        />
                         <p className="text-xs text-slate-400 mt-1">Nom technique: <span className="font-mono bg-slate-100 p-0.5 rounded">{selectedBlock.fieldName}</span></p>
                    </div>

                    <div className="border-b border-slate-200 mt-3">
                        <nav className="-mb-px flex space-x-4">
                            <button onClick={() => setPropertiesTab('content')} className={`py-2 px-1 border-b-2 font-medium text-sm ${propertiesTab === 'content' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Contenu</button>
                            <button onClick={() => setPropertiesTab('style')} className={`py-2 px-1 border-b-2 font-medium text-sm ${propertiesTab === 'style' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Style</button>
                        </nav>
                    </div>
                    <div className="py-4 space-y-4 flex-1 overflow-y-auto text-sm">
                        {propertiesTab === 'content' && (
                           <div className="space-y-4">
                           { selectedBlock.isStandard && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border">
                                    <div>
                                        <label className="font-medium">Afficher ce champ dans le script</label>
                                        <p className="text-xs text-slate-400">Masque le champ pour l'agent.</p>
                                    </div>
                                    <ToggleSwitch 
                                        enabled={selectedBlock.isVisible !== false} 
                                        onChange={isEnabled => handleBlockUpdate(selectedBlock.id, { isVisible: isEnabled })}
                                    />
                                </div>
                           )}
                           { (selectedBlock.type === 'label' || selectedBlock.type === 'text') && <textarea value={selectedBlock.content.text} onChange={(e) => handleBlockContentUpdate(selectedBlockId!, { text: e.target.value })} className="w-full p-2 border rounded-md" rows={4}/> }
                           { (selectedBlock.type === 'input' || selectedBlock.type === 'email' || selectedBlock.type === 'phone' || selectedBlock.type === 'textarea') && <div className="space-y-4"><div><label className="font-medium">Placeholder</label><input type="text" value={selectedBlock.content.placeholder} onChange={e=>handleBlockContentUpdate(selectedBlockId!, {placeholder: e.target.value})} className="w-full mt-1 p-2 border rounded-md"/></div> {selectedBlock.type === 'input' && <div><label className="font-medium">Format</label><select value={selectedBlock.content.format} onChange={e => handleBlockContentUpdate(selectedBlockId!, { format: e.target.value })} className="w-full mt-1 p-2 border rounded-md bg-white"><option value="text">Texte</option><option value="number">Nombre</option><option value="password">Mot de passe</option></select></div>}</div>}
                           { (selectedBlock.type === 'button') && <><div><label className="font-medium">Texte du bouton</label><input type="text" value={selectedBlock.content.text} onChange={e=>handleBlockContentUpdate(selectedBlockId!, {text: e.target.value})} className="w-full mt-1 p-2 border rounded-md"/></div></> }
                           { (selectedBlock.type === 'radio' || selectedBlock.type === 'checkbox') && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="font-medium">Question</label>
                                        <input 
                                            type="text" 
                                            value={selectedBlock.content.question} 
                                            onChange={e => handleBlockContentUpdate(selectedBlockId!, { question: e.target.value })}
                                            className="w-full mt-1 p-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-medium block">Options</label>
                                        <div className="space-y-2 mt-1">
                                            {(selectedBlock.content.options || []).map((option: string, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={e => handleOptionChange(selectedBlockId!, index, e.target.value)}
                                                        className="w-full p-2 border rounded-md text-sm"
                                                    />
                                                    <button onClick={() => handleDeleteOption(selectedBlockId!, index)} className="p-1 text-slate-400 hover:text-red-600">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => handleAddOption(selectedBlockId!)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-2 inline-flex items-center gap-1">
                                            <PlusIcon className="w-4 h-4" /> Ajouter une option
                                        </button>
                                    </div>
                                </div>
                            )}
                            { selectedBlock.type === 'dropdown' && (
                                <div>
                                    <label className="font-medium block">Options</label>
                                    <div className="space-y-2 mt-1">
                                        {(selectedBlock.content.options || []).map((option: string, index: number) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input type="text" value={option} onChange={e => handleOptionChange(selectedBlockId!, index, e.target.value)} className="w-full p-2 border rounded-md text-sm"/>
                                                <button onClick={() => handleDeleteOption(selectedBlockId!, index)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => handleAddOption(selectedBlockId!)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-2 inline-flex items-center gap-1">
                                        <PlusIcon className="w-4 h-4" /> Ajouter une option
                                    </button>
                                </div>
                            )}
                            { selectedBlock.type === 'history' && <p className="text-slate-500 italic text-center p-4">Ce bloc n'a pas de propriétés configurables. Il affichera l'historique des appels du contact.</p>}
                           { selectedBlock.type === 'group' && (
                                <div>
                                    <h4 className="font-medium text-slate-700 mb-2">Blocs dans le groupe</h4>
                                    {(() => {
                                        const childBlocks = activePage.blocks.filter(b => b.parentId === selectedBlock.id);
                                        if (childBlocks.length > 0) {
                                            return (
                                                <ul className="space-y-2 border-t pt-2 mt-2">
                                                    {childBlocks.map(child => (
                                                        <li key={child.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md hover:bg-slate-100">
                                                            <span className="text-slate-800 truncate text-xs">{child.name}</span>
                                                            <button onClick={() => handleDeleteBlock(child.id)} className="text-slate-400 hover:text-red-600 p-1" title={`Supprimer le bloc ${child.name}`}>
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        } else {
                                            return <p className="text-slate-500 italic text-center text-xs py-4">Faites glisser des blocs ici.</p>;
                                        }
                                    })()}
                                </div>
                           )}
                           {isInputType && (
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div>
                                        <label className="font-medium">Lecture seule</label>
                                        <p className="text-xs text-slate-400">L'agent ne pourra pas modifier ce champ.</p>
                                    </div>
                                    <ToggleSwitch 
                                        enabled={!!selectedBlock.readOnly} 
                                        onChange={isEnabled => handleBlockUpdate(selectedBlock.id, { readOnly: isEnabled })}
                                    />
                                </div>
                            )}
                           </div>
                        )}
                        {propertiesTab === 'style' && (
                             <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-medium">Largeur (px)</label>
                                        <input type="number" value={Math.round(selectedBlock.width)} onChange={e => handleBlockUpdate(selectedBlockId!, { width: parseInt(e.target.value) })} className="w-full mt-1 p-2 border rounded-md"/>
                                    </div>
                                    <div>
                                        <label className="font-medium">Hauteur (px)</label>
                                        <input type="number" value={Math.round(selectedBlock.height)} onChange={e => handleBlockUpdate(selectedBlockId!, { height: parseInt(e.target.value) })} className="w-full mt-1 p-2 border rounded-md"/>
                                    </div>
                                </div>
                                {['label', 'text', 'button', 'input', 'email', 'phone', 'textarea'].includes(selectedBlock.type) &&
                                <>
                                <div><label className="font-medium">Police</label><select value={selectedBlock.fontFamily || 'Arial'} onChange={e => handleBlockUpdate(selectedBlockId!, { fontFamily: e.target.value })} className="w-full mt-1 p-2 border rounded-md bg-white">{FONT_FAMILIES.map(f => <option key={f}>{f}</option>)}</select></div>
                                <div>
                                    <label className="font-medium">Taille (px)</label>
                                    <input type="number" value={selectedBlock.fontSize || 14} onChange={e => handleBlockUpdate(selectedBlockId!, { fontSize: parseInt(e.target.value) })} className="w-full mt-1 p-2 border rounded-md"/>
                                </div>
                                <div>
                                <label className="font-medium block mb-1">Alignement</label>
                                <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">{['left', 'center', 'right'].map(align => <button key={align} onClick={() => handleBlockUpdate(selectedBlockId!, { textAlign: align as any })} className={`p-1.5 rounded w-full flex justify-center ${selectedBlock.textAlign === align ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}>{align === 'left' ? <AlignLeftIcon className="w-5 h-5"/> : align === 'center' ? <AlignCenterIcon className="w-5 h-5"/> : <AlignRightIcon className="w-5 h-5"/>}</button>)}</div>
                                </div>
                                </>
                                }
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="font-medium">Fond</label><input type="color" value={selectedBlock.backgroundColor || (selectedBlock.type === 'group' ? 'transparent' : '#ffffff')} onChange={e => handleBlockUpdate(selectedBlockId!, { backgroundColor: e.target.value })} className="w-full h-8 p-1 mt-1 border rounded" /></div>
                                    <div><label className="font-medium">Texte</label><input type="color" value={selectedBlock.textColor || '#000000'} onChange={e => handleBlockUpdate(selectedBlockId!, { textColor: e.target.value })} className="w-full h-8 p-1 mt-1 border rounded" /></div>
                                </div>
                                {selectedBlock.type === 'button' && (
                                    <div className="pt-4 border-t">
                                        <h4 className="font-medium text-slate-700 mb-2">Action du Bouton</h4>
                                        <div>
                                            <label className="font-medium">Action</label>
                                            <select 
                                                value={selectedBlock.content.action.type} 
                                                onChange={e => handleBlockContentUpdate(selectedBlockId!, { action: { ...selectedBlock.content.action, type: e.target.value } })} 
                                                className="w-full mt-1 p-2 border rounded-md bg-white"
                                            >
                                                <option value="none">Aucune action</option>
                                                <option value="next">Page suivante</option>
                                                <option value="previous">Page précédente</option>
                                                <option value="navigate">Aller à la page...</option>
                                                <option value="save">Enregistrer les données</option>
                                                <option value="insert_contact">Insérer une fiche</option>
                                            </select>
                                        </div>

                                        {selectedBlock.content.action.type === 'navigate' && (
                                            <div className="mt-2">
                                                <label className="font-medium">Page de destination</label>
                                                <select 
                                                    value={selectedBlock.content.action.pageId || ''}
                                                    onChange={e => handleBlockContentUpdate(selectedBlockId!, { action: { ...selectedBlock.content.action, pageId: e.target.value } })}
                                                    className="w-full mt-1 p-2 border rounded-md bg-white"
                                                >
                                                    <option value="">Sélectionner une page</option>
                                                    {editedScript.pages.filter(p => p.id !== activePageId).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                        )}
                    </div>
                    {!selectedBlock.isStandard &&
                        <div className="mt-auto pt-4 border-t border-slate-200">
                            <button onClick={() => handleDeleteBlock(selectedBlock.id)} className="w-full flex items-center justify-center gap-2 text-sm text-red-600 font-semibold bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors">
                                <TrashIcon className="w-4 h-4" />
                                Supprimer "{selectedBlock.name}"
                            </button>
                        </div>
                    }
                </div>
            )
        }
        return ( /* Page properties... */ <div></div> )
    };

    const renderBlockOnCanvas = (block: ScriptBlock) => {
        const isSelected = selectedBlockId === block.id;
        const parent = block.parentId ? activePage.blocks.find(b => b.id === block.parentId) : null;
        const absoluteX = parent ? parent.x + block.x : block.x;
        const absoluteY = parent ? parent.y + block.y : block.y;
        
        const isGroup = block.type === 'group';

        const style: React.CSSProperties = {
            position: 'absolute', left: absoluteX, top: absoluteY, width: block.width, height: block.height,
            backgroundColor: block.backgroundColor, 
            color: block.textColor, fontFamily: block.fontFamily,
            fontSize: block.fontSize ? `${block.fontSize}px` : undefined, textAlign: block.textAlign
        };
        
        const borderClasses = isSelected 
            ? 'ring-2 ring-offset-2 ring-indigo-500' 
            : isGroup 
            ? 'border-2 border-dashed border-slate-400' 
            : 'shadow-md border border-slate-300';
            
        const bgClass = isGroup ? '' : 'bg-white';
        const baseClasses = `p-2 rounded-md cursor-move flex flex-col`;

        const renderContent = () => {
             switch(block.type) {
                case 'group': return null;
                case 'label': return <p className="font-bold whitespace-pre-wrap break-words">{block.content.text}</p>;
                case 'text': return <p className="whitespace-pre-wrap break-words">{block.content.text}</p>;
                case 'input': case 'email': case 'phone': return <div className="space-y-1"><label className="block font-semibold text-xs">{block.name}</label><input type="text" placeholder={block.content.placeholder} disabled className="w-full p-1 border rounded-sm bg-slate-100 text-sm"/></div>
                case 'textarea': return <div className="space-y-1 h-full flex flex-col"><label className="block font-semibold text-xs flex-shrink-0">{block.name}</label><textarea placeholder={block.content.placeholder} disabled className="w-full p-1 border rounded-sm bg-slate-100 text-sm flex-1 resize-none"/></div>
                case 'history': return <div className="space-y-1 h-full flex flex-col"><label className="block font-semibold text-xs border-b pb-1">Historique des appels</label><div className="text-xs text-slate-400 italic flex-1 flex items-center justify-center">Aperçu de l'historique</div></div>
                case 'date': case 'time': return <div className="space-y-1"><label className="block font-semibold text-xs">{block.name}</label><input type={block.type} disabled className="w-full p-1 border rounded-sm bg-slate-100 text-sm"/></div>
                case 'dropdown': return <div className="space-y-1"><label className="block font-semibold text-xs">{block.name}</label><select disabled className="w-full p-1 border rounded-sm bg-slate-100 text-sm"><option>{block.content.options[0] || 'Option'}</option></select></div>
                case 'radio': return <div className="space-y-1 text-left overflow-hidden"><p className="font-semibold text-xs mb-1 truncate">{block.name}</p>{(block.content.options || []).slice(0, 2).map((opt: string) => (<div key={opt} className="flex items-center"><input type="radio" disabled className="mr-2"/><label className="text-sm truncate">{opt}</label></div>))}</div>
                case 'checkbox': return <div className="space-y-1 text-left overflow-hidden"><p className="font-semibold text-xs mb-1 truncate">{block.name}</p>{(block.content.options || []).slice(0, 2).map((opt: string) => (<div key={opt} className="flex items-center"><input type="checkbox" disabled className="mr-2"/><label className="text-sm truncate">{opt}</label></div>))}</div>
                case 'button': return <button disabled className="w-full h-full font-semibold" style={{backgroundColor: block.backgroundColor, color: block.textColor}}>{block.content.text}</button>
                default: return <span className="p-1 text-xs text-center truncate pointer-events-none">{block.content?.label || block.content?.text || block.content?.question || block.type}</span>;
             }
        }
        
        return (
            <div
                key={block.id} style={style}
                className={`${baseClasses} ${block.type !== 'textarea' && 'justify-center'} ${bgClass} ${borderClasses}`}
                onMouseDown={(e) => handleMouseDownOnBlock(e, block.id)}
            >
                {renderContent()}
                 {isSelected && (
                    <>
                        <div
                            onMouseDown={(e) => handleMouseDownOnResizeHandle(e, block.id)}
                            className="absolute -right-1 -bottom-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize"
                        />
                        {!block.isStandard &&
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                title="Supprimer le bloc"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        }
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-200">
            <header className="flex-shrink-0 bg-white shadow-md p-3 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <input type="text" value={editedScript.name} onChange={e => updateScript(d => { d.name = e.target.value; })} className="text-xl font-bold p-1 border-b-2 border-transparent focus:border-indigo-500 outline-none"/>
                    <div className="flex items-center gap-2">
                        <label htmlFor="script-bg-color" className="text-sm font-medium text-slate-600">Fond:</label>
                        <input
                            id="script-bg-color"
                            type="color"
                            value={editedScript.backgroundColor}
                            onChange={e => updateScript(d => { d.backgroundColor = e.target.value; })}
                            className="w-8 h-8 p-0 border rounded-md bg-transparent cursor-pointer"
                            title="Changer la couleur de fond du script"
                        />
                    </div>
                </div>
                <div className="space-x-2">
                    <button onClick={() => onPreview(editedScript)} className="font-semibold py-2 px-4 rounded-lg inline-flex items-center bg-slate-200 hover:bg-slate-300"><EyeIcon className="w-5 h-5 mr-2" /> Prévisualiser</button>
                    <button onClick={onClose} className="font-semibold py-2 px-4 rounded-lg">Fermer</button>
                    <button onClick={() => onSave(editedScript)} className="font-bold py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">Enregistrer</button>
                </div>
            </header>
            <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                {/* Left Panel */}
                <aside className="col-span-2 bg-white p-3 border-r flex flex-col gap-4">
                    <h3 className="font-semibold">Éléments</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {BLOCK_PALETTE.map(item => (
                            <div key={item.type} draggable onDragStart={e => e.dataTransfer.setData('blockType', item.type)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-md cursor-grab flex flex-col items-center text-center">
                                <item.icon className="w-6 h-6 mb-1 text-slate-600" />
                                <span className="text-xs">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </aside>
                {/* Center Canvas */}
                <div className="col-span-7 flex flex-col relative bg-slate-300">
                    <div 
                        className="flex-1 relative overflow-hidden cursor-grab"
                        ref={canvasRef}
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        onMouseDown={handleCanvasMouseDown}
                        onWheel={handleWheel}
                    >
                        <div className="absolute top-0 left-0" style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.zoom})`, transformOrigin: 'top left', backgroundColor: editedScript.backgroundColor, backgroundImage: `radial-gradient(#d1d5db 1px, transparent 0)`, backgroundSize: `16px 16px`, width: '4000px', height: '4000px' }}>
                             {activePage.blocks
                                .sort((a, b) => {
                                    if (a.type === 'group') return -1;
                                    if (b.type === 'group') return 1;
                                    return 0;
                                })
                                .map(renderBlockOnCanvas)}
                        </div>
                    </div>
                    {/* Page Tabs & Zoom controls */}
                    <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md flex items-center border divide-x">
                        <button onClick={() => {}} className="p-2 hover:bg-slate-100 disabled:opacity-50"><ArrowLeftIcon className="w-5 h-5"/></button>
                        <span className="font-medium text-sm px-3">Page 1 / 1</span>
                        <button onClick={() => {}} className="p-2 hover:bg-slate-100 disabled:opacity-50"><ArrowRightIcon className="w-5 h-5"/></button>
                        <button onClick={handleAddPage} className="p-2 hover:bg-slate-100"><PlusIcon className="w-5 h-5"/></button>
                        <button onClick={() => {}} className="p-2 hover:bg-red-100 disabled:opacity-50 text-slate-600 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-md flex items-center border">
                        <button onClick={() => setViewTransform(v => ({...v, zoom: v.zoom * 1.2}))} className="p-2 hover:bg-slate-100" title="Zoom avant"><PlusIcon className="w-5 h-5"/></button>
                        <span className="text-sm font-semibold p-2 w-16 text-center">{Math.round(viewTransform.zoom * 100)}%</span>
                        <button onClick={() => setViewTransform(v => ({...v, zoom: v.zoom / 1.2}))} className="p-2 hover:bg-slate-100 border-x" title="Zoom arrière"><MinusIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewTransform({x:20, y:20, zoom:1})} className="p-2 hover:bg-slate-100" title="Réinitialiser la vue"><ResetViewIcon className="w-5 h-5"/></button>
                    </div>
                </div>

                {/* Right Properties Panel */}
                <aside className="col-span-3 bg-white p-4 border-l overflow-y-auto">
                    {renderPropertiesPanel()}
                </aside>
            </main>
        </div>
    );
};

export default ScriptBuilder;