import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  Folder,
  FolderPlus,
  Calendar,
  FolderKanban,
  Settings,
  Plus,
  Check,
  Archive,
  RotateCcw,
  Sparkles,
  FileText,
  Trash2,
  Pencil,
  Sliders,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Project, Accomplishment, WeekRecord, AppSettings } from '../types';
import { getWeekLabel, getWeekDateRange } from '../utils/dateUtils';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'storage' | 'backup' | 'projects' | 'ai';
  projects: Project[];
  accomplishments: Accomplishment[];
  weekRecords: WeekRecord[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onAddProject: (project: Omit<Project, 'id' | 'order'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onImportData: (data: { projects: Project[]; accomplishments: Accomplishment[]; weekRecords?: WeekRecord[] }) => void;
  onResetData: () => void;
  onSelectWeek: (weekId: string) => void;
  selectedWeekId: string;
}

export const ManagementModal: React.FC<ManagementModalProps> = ({
  isOpen,
  onClose,
  activeTab: initialTab = 'storage',
  projects,
  accomplishments,
  weekRecords,
  settings,
  onUpdateSettings,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onImportData,
  onResetData,
  onSelectWeek,
  selectedWeekId,
}) => {
  const [currentTab, setCurrentTab] = useState<'storage' | 'backup' | 'projects' | 'ai'>(
    initialTab === 'history' ? 'storage' : initialTab
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Project Form State
  const [newProjName, setNewProjName] = useState('');
  const [newProjColor, setNewProjColor] = useState('indigo');

  // Inline Project Edit State
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editingProjName, setEditingProjName] = useState('');

  // New Storage File Profile State
  const [newFileName, setNewFileName] = useState('');
  const [newFileLocation, setNewFileLocation] = useState(settings.storageLocation || '/Users/david/Documents/ProductPulse/');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [preserveDataOnNewFile, setPreserveDataOnNewFile] = useState(true);

  if (!isOpen) return null;

  // Calculate storage metrics
  const totalNotesCount = accomplishments.length + weekRecords.reduce((acc, curr) => acc + curr.accomplishments.length, 0);
  const rawJsonString = JSON.stringify({ projects, accomplishments, weekRecords });
  const storageKB = (new Blob([rawJsonString]).size / 1024).toFixed(1);
  const activeFileName = settings.activeStorageFileName || 'weekly_status_data_v1.json';
  const activeLocation = settings.storageLocation || 'Browser Local Storage';

  // Handle Export JSON
  const handleExportJSON = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      activeFileName,
      activeLocation,
      projects,
      accomplishments,
      weekRecords,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeFileName.replace(/\.json$/, '')}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Import File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.projects && json.accomplishments) {
          onImportData({
            projects: json.projects,
            accomplishments: json.accomplishments,
            weekRecords: json.weekRecords || [],
          });
          setImportStatus(`Successfully restored data from ${file.name}`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid JSON backup structure.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Handle Create New Storage File with Location
  const handleCreateNewStorageFile = () => {
    if (!newFileName.trim()) return;
    const formattedName = newFileName.trim().endsWith('.json') ? newFileName.trim() : `${newFileName.trim()}.json`;
    const formattedLocation = newFileLocation.trim() || 'Local Storage';

    onUpdateSettings({
      ...settings,
      activeStorageFileName: formattedName,
      storageLocation: formattedLocation,
    });
    if (!preserveDataOnNewFile) {
      onResetData();
    }
    setNewFileName('');
    setImportStatus(`Created storage profile "${formattedName}" at location "${formattedLocation}"`);
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Handle Native OS File Picker ("Save As New Storage File...")
  const handleNativeSaveFilePicker = async () => {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'product_pulse_storage.json',
          types: [
            {
              description: 'JSON Storage Database File',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });

        const targetAccomplishments = preserveDataOnNewFile ? accomplishments : [];
        const targetWeekRecords = preserveDataOnNewFile ? weekRecords : [];

        const initialData = {
          projects,
          accomplishments: targetAccomplishments,
          weekRecords: targetWeekRecords,
          createdAt: new Date().toISOString(),
        };

        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(initialData, null, 2));
        await writable.close();

        const pickedName = handle.name || 'product_pulse_storage.json';

        onUpdateSettings({
          ...settings,
          activeStorageFileName: pickedName,
          storageLocation: 'Selected System Directory',
        });
        if (!preserveDataOnNewFile) {
          onResetData();
          setImportStatus(`Created fresh empty storage file "${pickedName}"!`);
        } else {
          setImportStatus(`Saved current workspace data into new storage file "${pickedName}"!`);
        }
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('File save picker error:', err);
        }
      }
    } else {
      const filename = prompt('Enter filename for your new workspace database:', 'weekly_status_data.json');
      if (filename && filename.trim()) {
        const formattedName = filename.trim().endsWith('.json') ? filename.trim() : `${filename.trim()}.json`;
        onUpdateSettings({
          ...settings,
          activeStorageFileName: formattedName,
          storageLocation: 'Local Storage',
        });
        if (!preserveDataOnNewFile) {
          onResetData();
          setImportStatus(`Created fresh empty storage profile "${formattedName}"!`);
        } else {
          setImportStatus(`Saved current workspace data to new storage profile "${formattedName}"!`);
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    }
  };

  // Handle Native OS Open File Picker ("Open Existing Database...")
  const handleNativeOpenFilePicker = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'JSON Storage Database File',
              accept: { 'application/json': ['.json'] },
            },
          ],
          multiple: false,
        });

        const file = await handle.getFile();
        const text = await file.text();
        const json = JSON.parse(text);

        if (json.projects && json.accomplishments) {
          onImportData({
            projects: json.projects,
            accomplishments: json.accomplishments,
            weekRecords: json.weekRecords || [],
          });
          onUpdateSettings({
            ...settings,
            activeStorageFileName: file.name,
            storageLocation: 'Selected System Directory',
          });
          setImportStatus(`Successfully opened and loaded workspace database "${file.name}"!`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Invalid JSON database file structure.');
          setTimeout(() => setImportStatus(null), 4000);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('File open picker error:', err);
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  // Handle New Project Submission
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onAddProject({
      name: newProjName.trim(),
      color: newProjColor,
      status: 'active',
    });
    setNewProjName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="px-3 py-2 mb-4 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                M
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-none">Management</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Workspace Settings</p>
              </div>
            </div>

            <nav className="space-y-1">
              {/* Storage File Info */}
              <button
                onClick={() => setCurrentTab('storage')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentTab === 'storage'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>1. Data Storage File</span>
              </button>

              {/* Import / Export */}
              <button
                onClick={() => setCurrentTab('backup')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentTab === 'backup'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>2. Import & Export</span>
              </button>

              {/* Manage Projects */}
              <button
                onClick={() => setCurrentTab('projects')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentTab === 'projects'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>3. Manage Projects</span>
              </button>

              {/* AI Settings */}
              <button
                onClick={() => setCurrentTab('ai')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentTab === 'ai'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>4. AI Settings</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local Storage Active</span>
            </p>
            <p>Size: {storageKB} KB</p>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div>
              <h3 className="text-base font-bold text-white capitalize">
                {currentTab === 'storage' && 'Data File Storage'}
                {currentTab === 'backup' && 'Import & Export Backup'}
                {currentTab === 'projects' && 'Project Management'}
                {currentTab === 'ai' && 'AI Summary & Polish Settings'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentTab === 'storage' && 'Data storage path and local memory configuration'}
                {currentTab === 'backup' && 'Download or restore portable JSON files'}
                {currentTab === 'projects' && 'Create, edit, or archive project tags'}
                {currentTab === 'ai' && 'Customize AI models, summary tone, and executive formats'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback banner */}
          {importStatus && (
            <div className="mx-6 mt-4 p-3 bg-indigo-950/60 border border-indigo-500/50 text-indigo-200 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Body Content by Tab */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* TAB 1: DATA STORAGE FILE INFO */}
            {currentTab === 'storage' && (
              <div className="space-y-6">
                
                {/* Active Storage Card */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">Active Storage File</h4>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <p className="text-xs font-mono text-indigo-300 font-semibold">{activeFileName}</p>
                          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Folder className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>Location: <span className="text-slate-300">{activeLocation}</span></span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Synced to Browser
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Entries</span>
                      <strong className="text-slate-200 font-bold">{totalNotesCount} notes</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Active Projects</span>
                      <strong className="text-slate-200 font-bold">{projects.filter(p => p.status === 'active').length} projects</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Payload Size</span>
                      <strong className="text-slate-200 font-bold">{storageKB} KB</strong>
                    </div>
                  </div>
                </div>

                {/* Storage Location Technical Details */}
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Storage Engine Details
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    All data is linked client-side to your configured location and storage file:
                  </p>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300 pl-2">
                    <li>• File Name: <span className="text-indigo-300">{activeFileName}</span></li>
                    <li>• File Location: <span className="text-indigo-300">{activeLocation}</span></li>
                  </ul>
                </div>

                {/* Storage File Dialog Actions (Save As / Open) */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-indigo-400" />
                      <span>Select or Create Workspace Database File</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Use OS system dialogs to pick an existing database file to open, or specify a location and filename to save a new one.
                    </p>
                  </div>

                  {/* Option toggle for preserving current data when creating a new file */}
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={preserveDataOnNewFile}
                        onChange={(e) => setPreserveDataOnNewFile(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Include current workspace data & notes in new file</span>
                      <span className="text-[11px] text-slate-400 font-normal ml-auto">
                        ({preserveDataOnNewFile ? 'Copies current data over' : 'Starts clean fresh file'})
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleNativeSaveFilePicker}
                      className="w-full sm:w-auto flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <FolderPlus className="w-4 h-4 text-white" />
                      <span>Save As New File...</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNativeOpenFilePicker}
                      className="w-full sm:w-auto flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <Folder className="w-4 h-4 text-purple-400" />
                      <span>Open Existing File...</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: IMPORT & EXPORT */}
            {currentTab === 'backup' && (
              <div className="space-y-6">
                
                {/* Export JSON */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Export Backup</h4>
                      <p className="text-xs text-slate-400">
                        Export your complete workspace log history as a portable `.json` file.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportJSON}
                    className="w-full mt-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Import JSON */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Import / Restore Backup</h4>
                      <p className="text-xs text-slate-400">
                        Upload a previously exported JSON status file into local memory.
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Import</span>
                  </button>
                </div>

              </div>
            )}

            {/* TAB 3: MANAGE PROJECTS */}
            {currentTab === 'projects' && (
              <div className="space-y-6">
                
                {/* Create Project Form */}
                <form onSubmit={handleCreateProject} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Add New Project
                  </h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      placeholder="Project Name (e.g. Mobile Redesign)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!newProjName.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Project</span>
                    </button>
                  </div>
                </form>

                {/* Existing Projects List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active & Archived Projects ({projects.length})
                  </h4>

                  <div className="space-y-2">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-indigo-400 shrink-0"></span>
                          
                          {editingProjId === proj.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingProjName}
                                onChange={(e) => setEditingProjName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (editingProjName.trim()) {
                                      onUpdateProject({ ...proj, name: editingProjName.trim() });
                                      setEditingProjId(null);
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingProjId(null);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingProjName.trim()) {
                                    onUpdateProject({ ...proj, name: editingProjName.trim() });
                                    setEditingProjId(null);
                                  }
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProjId(null)}
                                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-100">{proj.name}</span>
                              <button
                                onClick={() => {
                                  setEditingProjId(proj.id);
                                  setEditingProjName(proj.name);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                                title="Rename project"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              onUpdateProject({
                                ...proj,
                                status: proj.status === 'active' ? 'archived' : 'active',
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                              proj.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {proj.status === 'active' ? 'Active' : 'Archived'}
                          </button>

                          <button
                            onClick={() => onDeleteProject(proj.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: AI SETTINGS */}
            {currentTab === 'ai' && (
              <div className="space-y-6">
                
                {/* AI Summary Tone Selection */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Summary Tone & Style
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['executive', 'concise', 'detailed'] as const).map((tone) => (
                      <button
                        key={tone}
                        onClick={() =>
                          onUpdateSettings({ ...settings, summaryTone: tone })
                        }
                        className={`p-3 rounded-xl border text-left capitalize transition-all cursor-pointer ${
                          (settings.summaryTone || 'executive') === tone
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block">{tone}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          {tone === 'executive' && 'High-level wins for VP/Leadership'}
                          {tone === 'concise' && 'Short bullet points for Slack'}
                          {tone === 'detailed' && 'Comprehensive technical breakdown'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Engine & API Configuration */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI Engine & API Configuration
                  </h4>
                  
                  {/* Provider Dropdown */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                      Select AI Provider
                    </label>
                    <select
                      value={settings.aiProvider || 'gemini'}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...settings,
                          aiProvider: e.target.value as any,
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="gemini">Google Gemini (Client-side / Fallback)</option>
                      <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                      <option value="openrouter">OpenRouter (Claude, Llama, Gemini via API)</option>
                      <option value="custom">Custom Endpoint (Ollama, Local AI, Proxies)</option>
                    </select>
                  </div>

                  {/* Provider Specific API Key */}
                  {(settings.aiProvider || 'gemini') === 'gemini' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-300 block">
                          Gemini API Key
                        </label>
                        <span className="text-[9px] text-slate-500">Optional if Express server is running</span>
                      </div>
                      <input
                        type="password"
                        value={settings.geminiApiKey || ''}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            geminiApiKey: e.target.value,
                          })
                        }
                        placeholder="AIzaSy..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        {(settings.aiProvider === 'openai' && 'OpenAI API Key') || 
                         (settings.aiProvider === 'openrouter' && 'OpenRouter API Key') || 
                         'API Key / Token (if required)'}
                      </label>
                      <input
                        type="password"
                        value={settings.aiApiKey || ''}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            aiApiKey: e.target.value,
                          })
                        }
                        placeholder={settings.aiProvider === 'openai' ? 'sk-proj-...' : 'sk-or-...'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  )}

                  {/* Model Name (For OpenAI, OpenRouter, Custom) */}
                  {(settings.aiProvider || 'gemini') !== 'gemini' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={settings.customModelName || ''}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            customModelName: e.target.value,
                          })
                        }
                        placeholder={
                          settings.aiProvider === 'openai' ? 'gpt-4o-mini' : 
                          settings.aiProvider === 'openrouter' ? 'google/gemini-2.5-flash' : 'llama3'
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  )}

                  {/* Custom Endpoint URL (For Custom) */}
                  {settings.aiProvider === 'custom' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        Custom Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={settings.customBaseUrl || ''}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            customBaseUrl: e.target.value,
                          })
                        }
                        placeholder="e.g., http://localhost:11434/v1"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Ensure local servers (Ollama, LM Studio) are running and configured with CORS enabled.
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Prompt Custom Directives */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Custom Prompt Guidelines
                  </h4>
                  <textarea
                    value={settings.customInstructions || ''}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        customInstructions: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="e.g., Always highlight Jira ticket IDs and group accomplishments into Engineering, Product, and Ops sections..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
