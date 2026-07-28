import React, { useState } from 'react';
import { X, Plus, Folder, Edit2, Trash2, Check, Sparkles } from 'lucide-react';
import { Project } from '../types';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddProject: (p: Omit<Project, 'id' | 'order'>) => void;
  onUpdateProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Indigo', value: 'indigo' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Sky', value: 'sky' },
  { name: 'Amber', value: 'amber' },
  { name: 'Rose', value: 'rose' },
  { name: 'Violet', value: 'violet' },
  { name: 'Teal', value: 'teal' },
];

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('indigo');

  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddProject({
      name: newName.trim(),
      description: newDesc.trim(),
      color: newColor,
      status: 'active',
    });

    setNewName('');
    setNewDesc('');
    setIsCreating(false);
  };

  const handleStartEdit = (p: Project) => {
    setEditingProjId(p.id);
    setEditName(p.name);
    setEditDesc(p.description || '');
  };

  const handleSaveEdit = (p: Project) => {
    if (!editName.trim()) return;
    onUpdateProject({
      ...p,
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setEditingProjId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Manage Projects
              </h2>
              <p className="text-xs text-slate-400">
                Organize work streams, products, and operational tracks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Create Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-4 bg-slate-950 border border-indigo-500/50 rounded-2xl space-y-3"
            >
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Create New Active Project
              </h3>

              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project Name (e.g., Mobile App Redesign)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short Description (e.g. Q3 customer auth overhaul)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Color:</span>
                  <div className="flex gap-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewColor(c.value)}
                        className={`w-5 h-5 rounded-full border cursor-pointer ${
                          newColor === c.value
                            ? 'ring-2 ring-white border-transparent'
                            : 'border-slate-700'
                        }`}
                        style={{
                          backgroundColor:
                            c.value === 'indigo'
                              ? '#6366f1'
                              : c.value === 'emerald'
                              ? '#10b981'
                              : c.value === 'sky'
                              ? '#0ea5e9'
                              : c.value === 'amber'
                              ? '#f59e0b'
                              : c.value === 'rose'
                              ? '#f43f5e'
                              : c.value === 'violet'
                              ? '#8b5cf6'
                              : '#14b8a6',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                  >
                    Save Project
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
              >
                {editingProjId === proj.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-900 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-100 flex-1"
                    />
                    <button
                      onClick={() => handleSaveEdit(proj)}
                      className="p-1.5 bg-indigo-600 text-white rounded-lg"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingProjId(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-indigo-400 shrink-0"></span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">
                          {proj.name}
                        </h4>
                        {proj.description && (
                          <p className="text-xs text-slate-400">{proj.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(proj)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit project name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
