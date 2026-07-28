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
} from 'lucide-react';
import { Project, Accomplishment, TagType, ImpactLevel } from '../types';
import { formatSmartDate } from '../utils/dateUtils';

interface EasyEntryViewProps {
  projects: Project[];
  accomplishments: Accomplishment[];
  theme: 'dark' | 'light' | 'paper';
  onSaveAccomplishment: (data: {
    projectId: string;
    content: string;
    tag: TagType;
    impact: ImpactLevel;
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

  // Note content
  const [noteContent, setNoteContent] = useState('');

  // Editing state for existing note
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Unsaved draft warning modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Quick Add Project state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Post success feedback
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);

  // Auto-select first project if selection becomes invalid
  useEffect(() => {
    if (!selectedProjectId && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [activeProjects, selectedProjectId]);

  // Warn on browser tab close/reload if unsaved draft exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (noteContent.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [noteContent]);

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

  // Handle Note Submission
  const handleSubmitNote = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!noteContent.trim() || !selectedProjectId) return;

    const targetProjName = activeProjects.find((p) => p.id === selectedProjectId)?.name || 'Project';

    onSaveAccomplishment({
      projectId: selectedProjectId,
      content: noteContent.trim(),
      tag: 'Feature',
      impact: 'Standard',
    });

    setNoteContent('');

    setLastSavedNotice(`Update saved to ${targetProjName}!`);
    setTimeout(() => setLastSavedNotice(null), 3000);
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
    if (noteContent.trim()) {
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
    setShowUnsavedModal(false);
    onSwitchToSummary();
  };

  // Start editing existing note
  const handleStartEdit = (note: Accomplishment) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  // Save inline edit
  const handleSaveEdit = (id: string) => {
    if (editingContent.trim()) {
      onUpdateAccomplishment(id, editingContent.trim());
    }
    setEditingNoteId(null);
    setEditingContent('');
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
            className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-400 underline underline-offset-2 break-all font-semibold transition-colors"
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
      
      {/* ----------------- EASY ENTRY COMPOSER ----------------- */}
      <div className={`${cardBg} border rounded-3xl p-6 shadow-xl space-y-5`}>
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Easy Entry Note Log</span>
            </h2>
            <p className={`text-xs ${subTextColor} mt-0.5`}>
              Click a project, type your update or paste links, and press <kbd className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[11px] border border-slate-700">⌘+Enter</kbd> to save.
            </p>
          </div>

          {noteContent.trim().length > 0 && (
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

        {/* 2. TEXT NOTE ENTRY WITH CMD+ENTER SHORTCUT & DIRECT PASTE */}
        <form onSubmit={handleSubmitNote} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${subTextColor} uppercase tracking-wider`}>
                2. Enter Update Content
              </label>
              <span className={`text-[11px] ${subTextColor} flex items-center gap-1`}>
                <Command className="w-3 h-3 text-indigo-400" />
                <span>Press <strong>⌘+Enter</strong> or <strong>Ctrl+Enter</strong> to save</span>
              </span>
            </div>

            {/* Note Text Area */}
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What did you accomplish or work on? Paste links directly (e.g. https://github.com/org/repo/pull/42)"
              rows={3}
              className={`w-full ${inputBg} text-sm rounded-2xl p-4 focus:outline-none transition-all leading-relaxed`}
            />
          </div>

          {/* Submit Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs">
              Posting to: <strong className="text-indigo-500 font-bold">{activeProjects.find(p => p.id === selectedProjectId)?.name || 'None'}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGoToSummaryClick}
                className="px-3.5 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Go to Summary &rarr;</span>
              </button>

              <button
                type="submit"
                disabled={!noteContent.trim() || !selectedProjectId}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Save Update</span>
                <span className="text-[10px] opacity-75 font-mono ml-0.5">(⌘↵)</span>
              </button>
            </div>
          </div>
        </form>

        {/* Last Saved Confirmation Toast */}
        {lastSavedNotice && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{lastSavedNotice}</span>
          </div>
        )}

      </div>

      {/* ----------------- LOGGED UPDATES LIST WITH INLINE EDIT & DELETE ----------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
            <span>Updates for {selectedProjectObj?.name || 'Project'}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {projectAccomplishments.length}
            </span>
          </h3>
          <span className={`text-xs ${subTextColor}`}>
            Edit or delete updates for {selectedProjectObj?.name || 'this project'}
          </span>
        </div>

        {projectAccomplishments.length === 0 ? (
          <div className={`${cardBg} border rounded-2xl p-8 text-center space-y-2`}>
            <p className="text-xs text-slate-400">No updates logged yet for {selectedProjectObj?.name || 'this project'}.</p>
            <p className={`text-xs ${subTextColor}`}>Type your update above and press ⌘+Enter to save!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectAccomplishments.map((item) => {
              const proj = projects.find((p) => p.id === item.projectId);
              const isEditing = editingNoteId === item.id;

              return (
                <div
                  key={item.id}
                  className={`${cardBg} border rounded-2xl p-4 transition-all space-y-2 group`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {proj?.name || 'Project'}
                      </span>
                      <span className={`text-[11px] ${subTextColor} flex items-center gap-1 font-medium`}>
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {formatSmartDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                          title="Edit Update"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteAccomplishment(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete Update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Editor or Display Text */}
                  {isEditing ? (
                    <div className="space-y-2 pt-1 animate-fade-in">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={`w-full ${inputBg} text-xs rounded-xl p-3 focus:outline-none`}
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${subTextColor} cursor-pointer flex items-center gap-1`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap pl-0.5">
                      {renderTextWithLinks(item.content)}
                    </p>
                  )}
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
