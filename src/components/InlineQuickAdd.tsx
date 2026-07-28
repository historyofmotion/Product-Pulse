import React, { useState } from 'react';
import { Plus, Mic, MicOff, Send, Link, FolderPlus } from 'lucide-react';
import { Project, TagType, ImpactLevel } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface InlineQuickAddProps {
  projects: Project[];
  activeProjectId?: string;
  onSave: (data: {
    projectId: string;
    content: string;
    tag: TagType;
    impact: ImpactLevel;
    originalSpeechRaw?: string;
  }) => void;
  onQuickAddProject?: (name: string) => void;
}

export const InlineQuickAdd: React.FC<InlineQuickAddProps> = ({
  projects,
  activeProjectId,
  onSave,
  onQuickAddProject,
}) => {
  const activeProjects = projects.filter((p) => p.status === 'active');
  const [selectedProjId, setSelectedProjId] = useState<string>(
    activeProjectId || activeProjects[0]?.id || ''
  );
  const [text, setText] = useState('');
  const [tag, setTag] = useState<TagType>('Feature');
  const [impact, setImpact] = useState<ImpactLevel>('Standard');
  const [isAddingNewProject, setIsAddingNewProject] = useState(false);
  const [newProjectInput, setNewProjectInput] = useState('');

  const {
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onResult: (val) => setText(val),
  });

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter or paste URL (e.g. GitHub PR, Jira ticket, Doc):');
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      setText((prev) => (prev ? `${prev} ${formattedUrl}` : formattedUrl));
    }
  };

  const handleCreateQuickProject = () => {
    if (newProjectInput.trim() && onQuickAddProject) {
      onQuickAddProject(newProjectInput.trim());
      setNewProjectInput('');
      setIsAddingNewProject(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedProjId) return;

    if (isListening) stopListening();

    onSave({
      projectId: selectedProjId,
      content: text.trim(),
      tag,
      impact,
    });

    setText('');
    resetTranscript();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Quick Work Log
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleInsertLink}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <Link className="w-3 h-3" />
              <span>Add Link</span>
            </button>
            <span className="hidden sm:inline text-[11px] font-normal text-slate-500">
              Press Enter to post
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          {/* Project Selector or Inline New Project input */}
          {isAddingNewProject ? (
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="text"
                value={newProjectInput}
                onChange={(e) => setNewProjectInput(e.target.value)}
                placeholder="New project name..."
                className="bg-slate-950 border border-indigo-500 text-slate-100 text-xs rounded-xl px-2.5 py-2 w-36 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateQuickProject}
                className="px-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNewProject(false)}
                className="px-2 py-2 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAddingNewProject(true)}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Add new project"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Text Input + Mic */}
          <div className="relative flex-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you accomplish today? Include links (e.g., https://github.com/...)"
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="button"
              onClick={handleMicClick}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop voice recording' : 'Voice note'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Tag Selector */}
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as TagType)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="Feature">Feature</option>
            <option value="Fix">Fix</option>
            <option value="Win">Win</option>
            <option value="Milestone">Milestone</option>
            <option value="Meeting">Meeting</option>
            <option value="Docs">Docs</option>
            <option value="Refactor">Refactor</option>
            <option value="Ops">Ops</option>
          </select>

          {/* Submit */}
          <button
            type="submit"
            disabled={!text.trim() || !selectedProjId}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </form>
    </div>
  );
};
