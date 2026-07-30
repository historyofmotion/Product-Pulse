import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  Command,
  Edit2,
  Trash2,
  Clock,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Project, Accomplishment, TagType, ImpactLevel } from '../types';
import { formatSmartDate } from '../utils/dateUtils';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { polishNote } from '../services/aiService';

interface EasyEntryViewProps {
  projects: Project[];
  accomplishments: Accomplishment[];
  theme: 'dark' | 'light' | 'paper';
  onSaveAccomplishment: (data: {
    id?: string;
    projectId: string;
    content: string;
    tag: TagType;
    impact: ImpactLevel;
    originalSpeechRaw?: string;
  }) => void;
  onUpdateAccomplishment: (id: string, newContent: string) => void;
  onDeleteAccomplishment: (id: string) => void;
  onAddProject: (project: { name: string; status: 'active'; color: string }) => void;
  onSwitchToSummary: () => void;
}

export const EasyEntryView: React.FC<EasyEntryViewProps> = ({
  projects,
  accomplishments,
  theme,
  onSaveAccomplishment,
  onUpdateAccomplishment,
  onDeleteAccomplishment,
  onAddProject,
  onSwitchToSummary,
}) => {
  const activeProjects = projects.filter((p) => p.status === 'active');

  // Selected project for new note (defaults to first active project)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjects[0]?.id || ''
  );

  // Note content inside main entry panel
  const [noteContent, setNoteContent] = useState('');

  // Editing state (ID of item being edited in main entry panel)
  const [editingAccomplishmentId, setEditingAccomplishmentId] = useState<string | null>(null);

  // Newly added or updated item highlight state for lower list (fades back to normal after 2.5s)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Unsaved draft warning modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Quick Add Project state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Voice-to-text & AI polish state
  const [rawSpeechSaved, setRawSpeechSaved] = useState<string | undefined>(undefined);
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishNotice, setPolishNotice] = useState<string | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    hasSupport: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onResult: (latestText) => {
      setNoteContent(latestText);
      setRawSpeechSaved(latestText);
    },
  });

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handlePolishWithAI = async () => {
    if (!noteContent.trim()) return;
    setIsPolishing(true);
    setPolishNotice(null);

    const project = activeProjects.find((p) => p.id === selectedProjectId);

    try {
      const result = await polishNote({
        rawText: noteContent,
        projectName: project?.name,
      });

      if (result && result.polishedText) {
        if (!rawSpeechSaved) {
          setRawSpeechSaved(noteContent);
        }
        setNoteContent(result.polishedText);
        setPolishNotice('Polished raw note into executive statement!');
        setTimeout(() => setPolishNotice(null), 3500);
      }
    } catch (err: any) {
      console.error('Polish error:', err);
      setPolishNotice(err.message || 'AI service unavailable.');
      setTimeout(() => setPolishNotice(null), 3500);
    } finally {
      setIsPolishing(false);
    }
  };

  // Auto-select first project if selection becomes invalid
  useEffect(() => {
    if (!selectedProjectId && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [activeProjects, selectedProjectId]);

  // Warn on browser tab close/reload if unsaved draft exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (noteContent.trim() && !editingAccomplishmentId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [noteContent, editingAccomplishmentId]);

  const selectedProjectObj = activeProjects.find((p) => p.id === selectedProjectId);

  // Filter accomplishment list by selected project
  const projectAccomplishments = useMemo(() => {
    if (!selectedProjectId) return accomplishments;
    return accomplishments.filter((item) => item.projectId === selectedProjectId);
  }, [accomplishments, selectedProjectId]);

  // Theme styling rules
  const isLight = theme === 'light';
  const isPaper = theme === 'paper';

  const cardBg = isPaper
    ? 'bg-[#f4efe4] border-[#e2d8c3] text-[#2c2a29]'
    : isLight
    ? 'bg-white border-slate-200 shadow-md text-slate-900'
    : 'bg-slate-900 border-slate-800 text-slate-100';

  const innerBg = isPaper
    ? 'bg-[#fbf9f4] border-[#d8ccb4] text-[#2c2a29]'
    : isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-950 border-slate-800 text-slate-200';

  const inputBg = isPaper
    ? 'bg-[#fbf9f4] border-[#d8ccb4] text-[#2c2a29] placeholder-[#948b78] focus:border-amber-700'
    : isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
    : 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500';

  const btnInactiveProj = isPaper
    ? 'bg-[#fbf9f4] text-[#2c2a29] border-[#d8ccb4] hover:border-[#b8a88a]'
    : isLight
    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 hover:text-slate-900'
    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white';

  const subTextColor = isPaper ? 'text-[#6b6455]' : isLight ? 'text-slate-600' : 'text-slate-400';

  // Handle Quick Create New Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const projName = newProjectName.trim();
    const colors = ['indigo', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'blue'];
    const randomColor = colors[activeProjects.length % colors.length];

    onAddProject({
      name: projName,
      status: 'active',
      color: randomColor,
    });

    setNewProjectName('');
    setIsAddingProject(false);
  };

  // Load existing note into Main Panel for editing
  const handleSelectNoteForEditing = (item: Accomplishment) => {
    setEditingAccomplishmentId(item.id);
    setNoteContent(item.content);
    setSelectedProjectId(item.projectId);
    setRawSpeechSaved(item.originalSpeechRaw);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel editing in Main Panel
  const handleCancelEditing = () => {
    setEditingAccomplishmentId(null);
    setNoteContent('');
    setRawSpeechSaved(undefined);
    resetTranscript();
  };

  // Delete note directly from Main Panel
  const handleDeleteEditingNote = () => {
    if (!editingAccomplishmentId) return;
    onDeleteAccomplishment(editingAccomplishmentId);
    setEditingAccomplishmentId(null);
    setNoteContent('');
    setRawSpeechSaved(undefined);
    resetTranscript();
  };

  // Handle Main Panel Submission (Create or Update)
  const handleSubmitNote = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();

    // Stop voice recording first if active and combine any pending interim transcript
    let currentText = noteContent;
    if (isListening) {
      stopListening();
      if (interimTranscript.trim()) {
        currentText = currentText
          ? `${currentText} ${interimTranscript.trim()}`
          : interimTranscript.trim();
        setNoteContent(currentText);
      }
    }

    const trimmedContent = currentText.trim();
    if (!trimmedContent || !selectedProjectId) return;

    if (editingAccomplishmentId) {
      // Updating existing accomplishment in main panel
      onUpdateAccomplishment(editingAccomplishmentId, trimmedContent);
      setHighlightedItemId(editingAccomplishmentId);
      setEditingAccomplishmentId(null);
    } else {
      // Creating new accomplishment
      const targetId = `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      onSaveAccomplishment({
        id: targetId,
        projectId: selectedProjectId,
        content: trimmedContent,
        tag: 'Feature',
        impact: 'Standard',
        originalSpeechRaw: rawSpeechSaved || currentText,
      });
      setHighlightedItemId(targetId);
    }

    setNoteContent('');
    setRawSpeechSaved(undefined);
    resetTranscript();

    // Fade highlight back to normal after 2.5s
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 2500);
  };

  // Textarea keyboard shortcut handler: Cmd+Enter or Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitNote(e);
    }
  };

  // Handle "Go to Summary" click with draft check
  const handleGoToSummaryClick = () => {
    if (noteContent.trim() && !editingAccomplishmentId) {
      setShowUnsavedModal(true);
    } else {
      onSwitchToSummary();
    }
  };

  // Save draft & switch to summary
  const handleSaveAndSwitch = () => {
    handleSubmitNote();
    setShowUnsavedModal(false);
    onSwitchToSummary();
  };

  // Discard draft & switch to summary
  const handleDiscardAndSwitch = () => {
    setNoteContent('');
    setEditingAccomplishmentId(null);
    setShowUnsavedModal(false);
    onSwitchToSummary();
  };

  // Format URLs into clickable links
  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all font-semibold transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0 inline" />
            <span>{part.replace(/^https?:\/\/(www\.)?/, '')}</span>
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* ----------------- MAIN NOTE ENTRY & EDIT PANEL ----------------- */}
      <div className={`${cardBg} border rounded-3xl p-6 shadow-xl space-y-5 transition-all`}>
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Zap className={`w-4 h-4 ${editingAccomplishmentId ? 'text-amber-400 animate-pulse' : 'text-indigo-500'}`} />
              <span>{editingAccomplishmentId ? 'Edit Update Note' : 'Easy Entry Note Log'}</span>
              {editingAccomplishmentId && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Editing Mode
                </span>
              )}
            </h2>
            <p className={`text-xs ${subTextColor} mt-0.5`}>
              {editingAccomplishmentId
                ? 'Update your note content below and press Save Changes or Delete Note.'
                : 'Click a project, type your update or paste links, and press ⌘+Enter to save.'}
            </p>
          </div>

          {noteContent.trim().length > 0 && !editingAccomplishmentId && (
            <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-500 rounded-lg text-[11px] font-bold flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Unsaved Draft</span>
            </span>
          )}
        </div>

        {/* 1. VISIBLE PROJECTS BAR WITH INDIVIDUAL NOTE COUNTS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-bold ${subTextColor} uppercase tracking-wider block`}>
              1. Select Project
            </label>
            <span className={`text-[11px] ${subTextColor}`}>
              {activeProjects.filter(p => accomplishments.filter(a => a.projectId === p.id).length === 0).length > 0 ? (
                <span className="text-amber-500 font-semibold">Some projects have no updates yet</span>
              ) : (
                <span className="text-emerald-500 font-semibold">All active projects have updates!</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {activeProjects.map((proj) => {
              const isSelected = proj.id === selectedProjectId;
              const projectCount = accomplishments.filter((a) => a.projectId === proj.id).length;

              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50 scale-[1.02]'
                      : `${btnInactiveProj} border`
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white animate-pulse' : 'bg-indigo-500'
                    }`}
                  ></span>
                  <span>{proj.name}</span>

                  {/* Per-Project Note Count Badge */}
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      projectCount === 0
                        ? isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    }`}
                    title={`${projectCount} update${projectCount === 1 ? '' : 's'} logged for ${proj.name}`}
                  >
                    {projectCount}
                  </span>
                </button>
              );
            })}

            {/* Small "+" button to add new project on the fly */}
            {!isAddingProject ? (
              <button
                type="button"
                onClick={() => setIsAddingProject(true)}
                className={`px-3 py-2 ${btnInactiveProj} border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer`}
                title="Add new project on the fly"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>New Project</span>
              </button>
            ) : (
              <form onSubmit={handleCreateProject} className="flex items-center gap-1.5 animate-fade-in">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className={`${inputBg} text-xs rounded-xl px-3 py-1.5 focus:outline-none w-40`}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className={`px-2 py-1.5 ${subTextColor} text-xs`}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* 2. TEXT NOTE ENTRY WITH VOICE TO TEXT & CMD+ENTER SHORTCUT */}
        <form onSubmit={handleSubmitNote} className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className={`text-xs font-bold ${subTextColor} uppercase tracking-wider flex items-center gap-2`}>
                <span>2. {editingAccomplishmentId ? 'Edit Update Content' : 'Enter Update Content'}</span>
                {isListening && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Recording Voice...</span>
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                {/* Voice to Text Microphone Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400 animate-bounce'
                      : 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30'
                  }`}
                  title={isListening ? 'Click to stop voice recording' : 'Click to dictate note using microphone'}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-white" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Voice to Text</span>
                    </>
                  )}
                </button>

                {/* AI Polish Button */}
                {noteContent.trim() && (
                  <button
                    type="button"
                    onClick={handlePolishWithAI}
                    disabled={isPolishing}
                    className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Refine spoken or raw note into executive statement with AI"
                  >
                    {isPolishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>AI Polish</span>
                  </button>
                )}

                <span className={`text-[11px] ${subTextColor} hidden sm:flex items-center gap-1`}>
                  <Command className="w-3 h-3 text-indigo-400" />
                  <span><strong>⌘+Enter</strong> to save</span>
                </span>
              </div>
            </div>

            {/* Active Voice Recording Live Indicator Bar */}
            {isListening && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl space-y-1.5 animate-fade-in shadow-inner">
                <div className="flex items-center justify-between text-xs text-rose-200 font-semibold">
                  <span className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>Microphone active — dictating live into update box...</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-3 bg-rose-400 animate-pulse rounded-full"></span>
                    <span className="w-1.5 h-5 bg-rose-400 animate-pulse rounded-full delay-75"></span>
                    <span className="w-1.5 h-2 bg-rose-400 animate-pulse rounded-full delay-150"></span>
                  </span>
                </div>
                {interimTranscript && (
                  <p className="text-xs text-rose-200/90 italic bg-rose-900/40 p-2 rounded-lg font-mono">
                    "{interimTranscript}..."
                  </p>
                )}
              </div>
            )}

            {/* Speech Permission / Error Notice */}
            {speechError && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{speechError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className="underline hover:text-amber-400 cursor-pointer font-bold shrink-0 text-xs"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* AI Polish Notice */}
            {polishNotice && (
              <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{polishNotice}</span>
              </div>
            )}

            {/* Note Text Area */}
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What did you accomplish or work on? Click 'Voice to Text' to dictate with mic, or paste links directly (e.g. https://github.com/org/repo/pull/42)"
              rows={3}
              className={`w-full ${inputBg} text-sm rounded-2xl p-4 focus:outline-none transition-all leading-relaxed ${
                editingAccomplishmentId ? 'ring-2 ring-amber-500/50 border-amber-500' : ''
              }`}
            />
          </div>

          {/* Submit / Edit Action Row */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            {editingAccomplishmentId ? (
              <>
                <button
                  type="button"
                  onClick={handleDeleteEditingNote}
                  className="px-3.5 py-2.5 bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete this update permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className={`px-3.5 py-2.5 ${btnInactiveProj} border font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={!noteContent.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                  <span className="text-[10px] opacity-75 font-mono ml-0.5">(⌘↵)</span>
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={(!noteContent.trim() && !interimTranscript.trim()) || !selectedProjectId}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Save</span>
                <span className="text-[10px] opacity-75 font-mono ml-0.5">(⌘↵)</span>
              </button>
            )}
          </div>
        </form>

      </div>

      {/* ----------------- SINGLE-LINE UPDATES LISTING WITH PROJECT BUBBLE TITLE ----------------- */}
      <div className="space-y-3">
        {/* Title Header with Project Bubble & Count */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              UPDATES FOR
            </h3>
            <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>{selectedProjectObj?.name || 'Project'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {projectAccomplishments.length} {projectAccomplishments.length === 1 ? 'update' : 'updates'}
            </span>
          </div>

          <span className={`text-xs ${subTextColor}`}>
            Click any update line to edit or delete in main panel above
          </span>
        </div>

        {projectAccomplishments.length === 0 ? (
          <div className={`${cardBg} border rounded-2xl p-8 text-center space-y-2`}>
            <p className="text-xs text-slate-400">No updates logged yet for {selectedProjectObj?.name || 'this project'}.</p>
            <p className={`text-xs ${subTextColor}`}>Type your update above and press ⌘+Enter to save!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectAccomplishments.map((item) => {
              const isHighlighted = item.id === highlightedItemId;
              const isEditingThis = item.id === editingAccomplishmentId;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectNoteForEditing(item)}
                  className={`px-4 py-3 border rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group ${
                    isHighlighted
                      ? 'bg-indigo-600/25 border-indigo-400 ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/30 animate-pulse'
                      : isEditingThis
                      ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/50'
                      : `${cardBg} hover:border-slate-700 hover:bg-slate-850`
                  }`}
                  title="Click to edit or delete this note in the main entry panel above"
                >
                  {/* Left / Center: Timestamp + Content Text (Single Line) */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-[11px] ${subTextColor} font-medium shrink-0 flex items-center gap-1 font-mono`}>
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {formatSmartDate(item.createdAt)}
                    </span>

                    <span className="text-xs text-slate-600 font-bold shrink-0">
                      •
                    </span>

                    <p className="text-xs font-medium truncate flex-1 leading-normal">
                      {renderTextWithLinks(item.content)}
                    </p>
                  </div>

                  {/* Right: Tag Badge (excluding default Feature) + Mic Badge + Edit Action Trigger */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.tag && item.tag !== 'Feature' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.tag}
                      </span>
                    )}

                    {item.originalSpeechRaw && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1" title="Recorded via Voice dictation">
                        <Mic className="w-2.5 h-2.5 text-indigo-400" />
                        <span className="hidden sm:inline">Voice</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectNoteForEditing(item);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------- UNSAVED DRAFT WARNING MODAL ----------------- */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardBg} border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Unsaved Note Draft</h3>
                <p className={`text-xs ${subTextColor}`}>
                  You have typed an update in the entry box that hasn't been saved yet.
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs font-mono line-clamp-3 ${innerBg}`}>
              "{noteContent}"
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUnsavedModal(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${subTextColor} hover:bg-slate-800 cursor-pointer`}
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardAndSwitch}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Discard & Leave
              </button>
              <button
                onClick={handleSaveAndSwitch}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-indigo-600/30"
              >
                Save Note & Go to Summary
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
