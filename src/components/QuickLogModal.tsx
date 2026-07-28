import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Plus,
  Send,
  Tag,
  Zap,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Project, TagType, ImpactLevel } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { polishNote } from '../services/aiService';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  defaultProjectId?: string;
  onSaveAccomplishment: (data: {
    projectId: string;
    content: string;
    tag: TagType;
    impact: ImpactLevel;
    originalSpeechRaw?: string;
  }) => void;
}

const TAG_OPTIONS: TagType[] = [
  'Feature',
  'Fix',
  'Win',
  'Milestone',
  'Meeting',
  'Docs',
  'Refactor',
  'Ops',
];

const IMPACT_OPTIONS: { level: ImpactLevel; label: string; color: string }[] = [
  { level: 'High', label: 'High Impact', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { level: 'Medium', label: 'Medium Impact', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { level: 'Standard', label: 'Standard Update', color: 'bg-slate-700/50 text-slate-300 border-slate-600/50' },
];

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onSaveAccomplishment,
}) => {
  const activeProjects = projects.filter((p) => p.status === 'active');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || activeProjects[0]?.id || ''
  );
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagType>('Feature');
  const [selectedImpact, setSelectedImpact] = useState<ImpactLevel>('Standard');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishMessage, setPolishMessage] = useState<string | null>(null);
  const [rawSpeechSaved, setRawSpeechSaved] = useState<string | undefined>(undefined);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      setContent(latestText);
      setRawSpeechSaved(latestText);
    },
  });

  // Keep default project aligned
  useEffect(() => {
    if (defaultProjectId && activeProjects.some((p) => p.id === defaultProjectId)) {
      setSelectedProjectId(defaultProjectId);
    } else if (activeProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [defaultProjectId, activeProjects]);

  // Focus textarea on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      if (isListening) stopListening();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handlePolishWithAI = async () => {
    if (!content.trim()) return;
    setIsPolishing(true);
    setPolishMessage(null);

    const project = projects.find((p) => p.id === selectedProjectId);

    try {
      const result = await polishNote({
        rawText: content,
        projectName: project?.name,
      });

      if (result && result.polishedText) {
        if (!rawSpeechSaved) {
          setRawSpeechSaved(content);
        }
        setContent(result.polishedText);
        if (result.suggestedTag && TAG_OPTIONS.includes(result.suggestedTag as TagType)) {
          setSelectedTag(result.suggestedTag as TagType);
        }
        if (result.suggestedImpact && ['High', 'Medium', 'Standard'].includes(result.suggestedImpact)) {
          setSelectedImpact(result.suggestedImpact as ImpactLevel);
        }
        setPolishMessage('Refined into professional executive statement!');
      } else {
        setPolishMessage('Could not refine note.');
      }
    } catch (err: any) {
      console.error('Polish error:', err);
      setPolishMessage(err.message || 'AI service unavailable.');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSave = (addAnother: boolean = false) => {
    if (!content.trim() || !selectedProjectId) return;

    if (isListening) stopListening();

    onSaveAccomplishment({
      projectId: selectedProjectId,
      content: content.trim(),
      tag: selectedTag,
      impact: selectedImpact,
      originalSpeechRaw: rawSpeechSaved,
    });

    setContent('');
    setRawSpeechSaved(undefined);
    setPolishMessage(null);
    resetTranscript();

    if (addAnother) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } else {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Quick Log Accomplishment
              </h2>
              <p className="text-xs text-slate-400">
                Log what you accomplished. Speech-to-text or typed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Project Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Project
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {activeProjects.map((proj) => {
                const isSelected = proj.id === selectedProjectId;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    {proj.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea + Voice Mic Button */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Accomplishment Details
              </label>

              {/* Speech Microphone Toggle */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-md shadow-rose-600/40'
                      : 'bg-slate-800 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Recording... (Click to Stop)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Voice Input</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Live Audio Visualizer Banner */}
            {isListening && (
              <div className="mb-2 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-6 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <div className="flex-1 text-xs text-rose-200 truncate">
                  {interimTranscript || 'Listening... Speak your achievement clearly.'}
                </div>
              </div>
            )}

            {speechError && (
              <div className="mb-2 p-2 bg-rose-900/30 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Note Input Box */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Shipped new auth middleware, fixed memory leak in streaming client, or held key sync with partners..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />

              {/* AI Polish Option inside Textarea Footer */}
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Press</span>
                  <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">
                    ⌘ + Enter
                  </kbd>
                  <span>to save</span>
                </div>

                <button
                  type="button"
                  onClick={handlePolishWithAI}
                  disabled={!content.trim() || isPolishing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {isPolishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Polishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Polish Note</span>
                    </>
                  )}
                </button>
              </div>

              {polishMessage && (
                <p className="mt-1.5 text-xs text-indigo-300 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  {polishMessage}
                </p>
              )}
            </div>
          </div>

          {/* Tag & Impact Level Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-800">
            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Category Tag
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Impact Priority
              </label>
              <div className="flex flex-col gap-1.5">
                {IMPACT_OPTIONS.map((opt) => (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => setSelectedImpact(opt.level)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition-all flex items-center justify-between cursor-pointer ${
                      selectedImpact === opt.level
                        ? `${opt.color} ring-1 ring-white/20`
                        : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedImpact === opt.level && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={!content.trim() || !selectedProjectId}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Save & Add Another
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={!content.trim() || !selectedProjectId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save Accomplishment</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
