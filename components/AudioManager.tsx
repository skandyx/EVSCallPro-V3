import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { Feature, AudioFile } from '../types.ts';
import { PlusIcon, EditIcon, TrashIcon, PlayIcon, PauseIcon, XMarkIcon } from './Icons.tsx';

// Helper functions
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 1) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.round(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};


// Modal component for adding/editing audio files
interface AudioModalProps {
    audioFile: AudioFile | null;
    onSave: (file: AudioFile) => void;
    onClose: () => void;
}

const AudioModal: React.FC<AudioModalProps> = ({ audioFile, onSave, onClose }) => {
    const [name, setName] = useState(audioFile?.name || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!audioFile;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            if (!name) {
                setName(file.name.replace(/\.[^/.]+$/, "")); // Set name from filename without extension
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (!isEditing && !selectedFile) {
            alert("Veuillez sélectionner un fichier.");
            return;
        }

        const fileToSave: AudioFile = audioFile || {
            id: `audio-${Date.now()}`,
            fileName: selectedFile!.name,
            size: selectedFile!.size,
            duration: Math.floor(Math.random() * 280) + 10, // Simulate duration for demo
            uploadDate: new Date().toISOString(),
            name: '', // will be overwritten below
        };
        
        onSave({ ...fileToSave, name: name.trim() });
    };

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-medium leading-6 text-slate-900">{isEditing ? 'Modifier le Fichier Audio' : 'Importer un Fichier Audio'}</h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nom d'affichage</label>
                                <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Ex: Message d'accueil"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Fichier</label>
                                <div className="mt-1">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".mp3,.wav" className="hidden"/>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-center p-4 border-2 border-dashed border-slate-300 rounded-md hover:border-indigo-500">
                                        <p className="text-sm text-slate-500">
                                            {selectedFile ? `Fichier sélectionné : ${selectedFile.name}` : isEditing ? `Fichier actuel : ${audioFile.fileName}` : 'Cliquez pour sélectionner un fichier (.mp3, .wav)'}
                                        </p>
                                    </button>
                                </div>
                                {selectedFile && <p className="text-xs text-slate-500 mt-1">Taille: {formatBytes(selectedFile.size)}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button type="submit" className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 sm:ml-3 sm:w-auto">Enregistrer</button>
                        <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:mt-0 sm:w-auto">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Player Component ---
interface PlayerProps {
    file: AudioFile | null;
    isPlaying: boolean;
    progress: number;
    currentTime: number;
    duration: number;
    onPlayPause: () => void;
    onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
}

const Player: React.FC<PlayerProps> = ({ file, isPlaying, progress, currentTime, duration, onPlayPause, onSeek, onClose }) => {
    if (!file) return null;

    return (
        <div className="fixed bottom-4 right-4 left-4 lg:left-auto lg:w-96 bg-slate-800 text-white rounded-lg shadow-2xl p-4 z-50 flex items-center gap-4 animate-fade-in-up">
            <button onClick={onPlayPause} className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 flex-shrink-0">
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{formatDuration(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={onSeek}
                        className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                    <span>{formatDuration(duration)}</span>
                </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 flex-shrink-0" title="Fermer le lecteur">
                <XMarkIcon className="w-5 h-5 text-slate-400"/>
            </button>
        </div>
    );
};

// Main component
interface AudioManagerProps {
    feature: Feature;
    audioFiles: AudioFile[];
    onSaveAudioFile: (file: AudioFile) => void;
    onDeleteAudioFile: (fileId: string) => void;
}

const AudioManager: React.FC<AudioManagerProps> = ({ feature, audioFiles, onSaveAudioFile, onDeleteAudioFile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<AudioFile | null>(null);

    // Player state
    const [playingFileId, setPlayingFileId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const playingFile = useMemo(() => audioFiles.find(f => f.id === playingFileId), [audioFiles, playingFileId]);

    // Effect to control audio playback
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playingFileId) {
            // NOTE: Using a placeholder audio source as we can't access local files.
            // In a real app, this would be `audio.src = file.url;`
            const dummyAudioSrc = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`; 
            if (audio.src !== dummyAudioSrc) {
                audio.src = dummyAudioSrc;
                // Reset progress for new file
                setProgress(0);
                setCurrentTime(0);
            }
            if (isPlaying) {
                audio.play().catch(e => console.error("Audio play failed:", e));
            } else {
                audio.pause();
            }
        } else {
            audio.pause();
            audio.src = '';
        }
    }, [playingFileId, isPlaying]);

    // Effect for audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const handlePlayPauseClick = (fileId: string) => {
        if (playingFileId === fileId) {
            setIsPlaying(!isPlaying);
        } else {
            setPlayingFileId(fileId);
            setIsPlaying(true);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio || !isFinite(duration)) return;
        const newTime = (Number(e.target.value) / 100) * duration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleAddNew = () => {
        setEditingFile(null);
        setIsModalOpen(true);
    };

    const handleEdit = (file: AudioFile) => {
        setEditingFile(file);
        setIsModalOpen(true);
    };
    
    const handleDelete = (fileId: string, fileName: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${fileName}" ?`)) {
            if (fileId === playingFileId) {
                setPlayingFileId(null);
            }
            onDeleteAudioFile(fileId);
        }
    };

    const handleSave = (file: AudioFile) => {
        onSaveAudioFile(file);
        setIsModalOpen(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {isModalOpen && <AudioModal audioFile={editingFile} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {/* The audio element is hidden but present in the DOM for playback control */}
            <audio ref={audioRef} />

            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
                <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
            </header>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Fichiers Audio</h2>
                    <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md inline-flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Importer un fichier
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom du Fichier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Durée</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Taille</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date d'import</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {audioFiles.map(file => (
                                <tr key={file.id}>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handlePlayPauseClick(file.id)} className="text-slate-500 hover:text-indigo-600" title={playingFileId === file.id && isPlaying ? 'Mettre en pause' : 'Écouter'}>
                                            {playingFileId === file.id && isPlaying ? <PauseIcon className="w-5 h-5 text-indigo-600"/> : <PlayIcon className="w-5 h-5"/>}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{file.name}</td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{file.fileName}</td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{formatDuration(file.duration)}</td>
                                    <td className="px-6 py-4 text-slate-600">{formatBytes(file.size)}</td>
                                    <td className="px-6 py-4 text-slate-600">{new Date(file.uploadDate).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleEdit(file)} className="text-indigo-600 hover:text-indigo-900"><EditIcon className="w-4 h-4 inline-block -mt-1"/> Modifier</button>
                                        <button onClick={() => handleDelete(file.id, file.name)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-4 h-4 inline-block -mt-1"/> Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {audioFiles.length === 0 && <p className="text-center py-8 text-slate-500">Aucun fichier audio importé.</p>}
                </div>
            </div>

            <Player
                file={playingFile}
                isPlaying={isPlaying}
                progress={progress}
                currentTime={currentTime}
                duration={duration}
                onPlayPause={() => playingFileId && handlePlayPauseClick(playingFileId)}
                onSeek={handleSeek}
                onClose={() => setPlayingFileId(null)}
            />
        </div>
    );
};

export default AudioManager;
