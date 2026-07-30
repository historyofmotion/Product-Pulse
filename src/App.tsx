import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap,
  Plus,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  FolderKanban,
  RotateCcw,
  Pin,
  Flame,
  Layers,
  ChevronDown,
  Calendar,
  Award,
  AlertTriangle,
  Mic,
  Sliders,
} from 'lucide-react';
import { Project, Accomplishment, WeekRecord, WeeklySummaryData, TagType, ImpactLevel, AppSettings } from './types';
import { INITIAL_PROJECTS, getSampleAccomplishments } from './utils/sampleData';
import { getISOWeekId, getWeekLabel, getWeekDateRange } from './utils/dateUtils';
import { Header } from './components/Header';
import { EasyEntryView } from './components/EasyEntryView';
import { SummaryView } from './components/SummaryView';
import { QuickLogModal } from './components/QuickLogModal';
import { InlineQuickAdd } from './components/InlineQuickAdd';
import { AccomplishmentCard } from './components/AccomplishmentCard';
import { WeeklySummaryModal } from './components/WeeklySummaryModal';
import { WeekHistoryView } from './components/WeekHistoryView';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { HotkeyGuideModal } from './components/HotkeyGuideModal';
import { DataBackupModal } from './components/DataBackupModal';
import { ManagementModal } from './components/ManagementModal';

const STORAGE_KEYS = {
  PROJECTS: 'weekly_status_projects_v1',
  ACCOMPLISHMENTS: 'weekly_status_accomplishments_v1',
  WEEK_RECORDS: 'weekly_status_week_records_v1',
  SETTINGS: 'weekly_status_settings_v1',
};

export default function App() {
  const currentISOWeek = getISOWeekId();

  // State initialization with localStorage fallback
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return INITIAL_PROJECTS;
  });

  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOMPLISHMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return getSampleAccomplishments();
  });

  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEEK_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      autoPolishOnVoice: false,
      speechLanguage: 'en-US',
      soundEffects: true,
      theme: 'dark',
      summaryTone: 'executive',
      activeStorageFileName: 'weekly_status_data_v1.json',
    };
  });

  // Selected week (defaults to current active week)
  const [selectedWeekId, setSelectedWeekId] = useState<string>(currentISOWeek);

  // Active Mode: 'enter' (Notes w/ visible projects & URLs) or 'summary' (AI Summary)
  const [activeMode, setActiveMode] = useState<'enter' | 'summary'>('enter');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<TagType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  
  // Unified Management Modal State
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [managementTab, setManagementTab] = useState<'storage' | 'backup' | 'projects' | 'ai'>('storage');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist state updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOMPLISHMENTS, JSON.stringify(accomplishments));
    } catch (e) {}
  }, [accomplishments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WEEK_RECORDS, JSON.stringify(weekRecords));
    } catch (e) {}
  }, [weekRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  // Open management modal with specific tab
  const handleOpenManagement = (tab: 'storage' | 'backup' | 'projects' | 'ai' = 'storage') => {
    setManagementTab(tab);
    setIsManagementOpen(true);
  };

  // Is selected week an active current week or past archived week?
  const isHistoricalWeek = selectedWeekId !== currentISOWeek;

  // Active week's accomplishments
  const weekAccomplishments = useMemo(() => {
    if (isHistoricalWeek) {
      const pastRecord = weekRecords.find((w) => w.weekId === selectedWeekId);
      return pastRecord ? pastRecord.accomplishments : [];
    }
    return accomplishments.filter((a) => a.weekId === currentISOWeek);
  }, [accomplishments, weekRecords, selectedWeekId, isHistoricalWeek, currentISOWeek]);

  // Filtered accomplishments
  const filteredAccomplishments = useMemo(() => {
    return weekAccomplishments.filter((acc) => {
      // Project filter
      if (selectedProjectId !== 'ALL' && acc.projectId !== selectedProjectId) {
        return false;
      }
      // Tag filter
      if (selectedTag !== 'ALL' && acc.tag !== selectedTag) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContent = acc.content.toLowerCase().includes(query);
        const projName = projects.find((p) => p.id === acc.projectId)?.name.toLowerCase() || '';
        const matchesProj = projName.includes(query);
        if (!matchesContent && !matchesProj) return false;
      }
      return true;
    });
  }, [weekAccomplishments, selectedProjectId, selectedTag, searchQuery, projects]);

  // Pinned vs Standard items
  const pinnedAccomplishments = useMemo(() => {
    return filteredAccomplishments.filter((a) => a.isPinned);
  }, [filteredAccomplishments]);

  const standardAccomplishments = useMemo(() => {
    return filteredAccomplishments.filter((a) => !a.isPinned);
  }, [filteredAccomplishments]);

  // High Impact Count
  const highImpactCount = useMemo(() => {
    return weekAccomplishments.filter((a) => a.impact === 'High').length;
  }, [weekAccomplishments]);

  // Active projects list
  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'active');
  }, [projects]);

  // Keyboard Hotkey Listener
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside input/textarea/editable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd+K or Ctrl+K -> Quick Log Modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickLogOpen(true);
        return;
      }

      // 'N' key -> Quick Log Modal
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsQuickLogOpen(true);
        return;
      }

      // 'Shift + R' -> AI Summary
      if (e.key.toLowerCase() === 'r' && e.shiftKey) {
        e.preventDefault();
        setIsSummaryModalOpen(true);
        return;
      }

      // '?' -> Hotkeys guide
      if (e.key === '?') {
        e.preventDefault();
        setIsHotkeysOpen((prev) => !prev);
        return;
      }

      // '1' to '9' -> Select active project
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index === 0) {
          setSelectedProjectId('ALL');
        } else if (activeProjects[index - 1]) {
          setSelectedProjectId(activeProjects[index - 1].id);
        }
      }

      // Escape -> close open dialogs
      if (e.key === 'Escape') {
        setIsQuickLogOpen(false);
        setIsSummaryModalOpen(false);
        setIsHistoryOpen(false);
        setIsProjectManagerOpen(false);
        setIsHotkeysOpen(false);
        setIsBackupOpen(false);
        setIsResetConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [activeProjects]);

  // Save accomplishment
  const handleSaveAccomplishment = useCallback(
    (data: {
      id?: string;
      projectId: string;
      content: string;
      tag: TagType;
      impact: ImpactLevel;
      originalSpeechRaw?: string;
    }) => {
      const newAcc: Accomplishment = {
        id: data.id || `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        projectId: data.projectId,
        content: data.content,
        tag: data.tag,
        impact: data.impact,
        originalSpeechRaw: data.originalSpeechRaw,
        weekId: currentISOWeek,
        createdAt: new Date().toISOString(),
      };

      setAccomplishments((prev) => [newAcc, ...prev]);
    },
    [currentISOWeek]
  );

  // Pin toggle
  const handleTogglePin = (id: string) => {
    setAccomplishments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a))
    );
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    setAccomplishments((prev) => prev.filter((a) => a.id !== id));
    showToast('Deleted note.');
  };

  // Edit note
  const handleEditNote = (id: string, newContent: string) => {
    setAccomplishments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, content: newContent } : a))
    );
    showToast('Updated note.');
  };

  // Save generated summary to week record or current week
  const handleSaveSummary = (summaryData: WeeklySummaryData) => {
    if (isHistoricalWeek) {
      setWeekRecords((prev) =>
        prev.map((w) =>
          w.weekId === selectedWeekId ? { ...w, summary: summaryData } : w
        )
      );
    } else {
      // Find if weekRecord exists for current week
      setWeekRecords((prev) => {
        const existingIndex = prev.findIndex((w) => w.weekId === currentISOWeek);
        const record: WeekRecord = {
          weekId: currentISOWeek,
          weekLabel: getWeekLabel(currentISOWeek),
          dateRange: getWeekDateRange(currentISOWeek),
          status: 'current',
          accomplishments: weekAccomplishments,
          summary: summaryData,
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = record;
          return updated;
        } else {
          return [record, ...prev];
        }
      });
    }
    showToast('Saved AI summary.');
  };

  // Finalize & Reset Week
  const handleFinalizeAndResetWeek = () => {
    // Archive current week accomplishments into weekRecords
    const currentAccs = accomplishments.filter((a) => a.weekId === currentISOWeek);

    const newRecord: WeekRecord = {
      weekId: currentISOWeek,
      weekLabel: getWeekLabel(currentISOWeek),
      dateRange: getWeekDateRange(currentISOWeek),
      status: 'archived',
      accomplishments: currentAccs,
      archivedAt: new Date().toISOString(),
    };

    setWeekRecords((prev) => {
      const filtered = prev.filter((w) => w.weekId !== currentISOWeek);
      return [newRecord, ...filtered];
    });

    // Clear current week accomplishments
    setAccomplishments((prev) => prev.filter((a) => a.weekId !== currentISOWeek));

    setIsResetConfirmOpen(false);
    showToast('Week finalized & archived to History! Ready for new week.');
  };

  // Project management handlers
  const handleAddProject = (p: Omit<Project, 'id' | 'order'>) => {
    const newProj: Project = {
      ...p,
      id: `proj-${Date.now()}`,
      order: projects.length + 1,
    };
    setProjects((prev) => [...prev, newProj]);
    showToast(`Added project "${p.name}"`);
  };

  const handleUpdateProject = (p: Project) => {
    setProjects((prev) => prev.map((item) => (item.id === p.id ? p : item)));
    showToast(`Updated "${p.name}"`);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((item) => item.id !== id));
    showToast('Deleted project.');
  };

  // Data import/reset handlers
  const handleImportData = (data: {
    projects: Project[];
    accomplishments: Accomplishment[];
    weekRecords?: WeekRecord[];
  }) => {
    if (data.projects) setProjects(data.projects);
    if (data.accomplishments) setAccomplishments(data.accomplishments);
    if (data.weekRecords) setWeekRecords(data.weekRecords);
    showToast('Successfully imported backup data!');
  };

  const handleResetToSample = () => {
    setProjects(INITIAL_PROJECTS);
    setAccomplishments(getSampleAccomplishments());
    setWeekRecords([]);
    setSelectedWeekId(currentISOWeek);
    showToast('Reset workspace with sample demo data!');
  };

  const currentTheme = settings.theme || 'dark';

  const appBg = currentTheme === 'paper'
    ? 'bg-[#fbf9f4] text-[#2c2a29]'
    : currentTheme === 'light'
    ? 'bg-slate-100 text-slate-900'
    : 'bg-slate-950 text-slate-100';

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'paper') => {
    setSettings((prev) => ({ ...prev, theme: newTheme }));
    showToast(`Skin updated to ${newTheme.toUpperCase()} theme!`);
  };

  return (
    <div className={`min-h-screen ${appBg} flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white`}>
      
      {/* Toast Floating Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-xl border border-indigo-400/40 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeMode={activeMode}
        onChangeMode={setActiveMode}
        currentWeekId={currentISOWeek}
        selectedWeekId={selectedWeekId}
        isHistoricalWeek={isHistoricalWeek}
        theme={currentTheme}
        onChangeTheme={handleThemeChange}
        onOpenManagement={handleOpenManagement}
        onOpenHotkeys={() => setIsHotkeysOpen(true)}
        onResetWeek={() => setIsResetConfirmOpen(true)}
        accomplishmentCount={weekAccomplishments.length}
      />

      {/* Historical Week Indicator Banner */}
      {isHistoricalWeek && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>
            Viewing archived accomplishments for <strong>{getWeekLabel(selectedWeekId)}</strong> ({getWeekDateRange(selectedWeekId)}).
          </span>
          <button
            onClick={() => setSelectedWeekId(currentISOWeek)}
            className="underline font-bold hover:text-white ml-2 cursor-pointer"
          >
            Return to Active Week
          </button>
        </div>
      )}

      {/* Main Workspace Body: Mode 1 (Enter) vs Mode 2 (Summary) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeMode === 'enter' ? (
          <EasyEntryView
            projects={projects}
            accomplishments={weekAccomplishments}
            theme={currentTheme}
            onSaveAccomplishment={handleSaveAccomplishment}
            onUpdateAccomplishment={handleEditNote}
            onDeleteAccomplishment={handleDeleteNote}
            onAddProject={(proj) => handleAddProject({ ...proj, description: '' })}
            onSwitchToSummary={() => setActiveMode('summary')}
          />
        ) : (
          <SummaryView
            weekId={selectedWeekId}
            currentWeekId={currentISOWeek}
            weekRecords={weekRecords}
            projects={projects}
            accomplishments={weekAccomplishments}
            existingSummary={
              weekRecords.find((w) => w.weekId === selectedWeekId)?.summary
            }
            settings={settings}
            theme={currentTheme}
            onSaveSummary={(genSummary) => {
              handleSaveSummary(genSummary);
            }}
            onSwitchToEnter={() => setActiveMode('enter')}
            onOpenManagement={handleOpenManagement}
            onSelectWeek={(wId) => setSelectedWeekId(wId)}
          />
        )}
      </main>

      {/* Unified Workspace Management Modal */}
      <ManagementModal
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        activeTab={managementTab}
        projects={projects}
        accomplishments={accomplishments}
        weekRecords={weekRecords}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('Updated settings!');
        }}
        onAddProject={handleAddProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onImportData={handleImportData}
        onResetData={handleResetToSample}
        onSelectWeek={(wId) => setSelectedWeekId(wId)}
        selectedWeekId={selectedWeekId}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Product Pulse • 1. Enter notes w/ links • 2. Get AI summary
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => handleOpenManagement('storage')}
              className="hover:text-indigo-400 cursor-pointer"
            >
              Data File Storage
            </button>
            <button
              onClick={() => handleOpenManagement('backup')}
              className="hover:text-indigo-400 cursor-pointer"
            >
              Import / Export
            </button>
            <button
              onClick={() => handleOpenManagement('projects')}
              className="hover:text-indigo-400 cursor-pointer"
            >
              Manage Projects
            </button>
            <button
              onClick={() => setIsHotkeysOpen(true)}
              className="hover:text-indigo-400 cursor-pointer"
            >
              Shortcuts (?)
            </button>
          </div>
        </div>
      </footer>

      {/* Quick Log Modal (Cmd + K) */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        projects={projects}
        defaultProjectId={selectedProjectId !== 'ALL' ? selectedProjectId : undefined}
        onSaveAccomplishment={handleSaveAccomplishment}
      />

      {/* AI Weekly Summary Modal */}
      <WeeklySummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        weekId={selectedWeekId}
        projects={projects}
        accomplishments={weekAccomplishments}
        existingSummary={
          isHistoricalWeek
            ? weekRecords.find((w) => w.weekId === selectedWeekId)?.summary
            : weekRecords.find((w) => w.weekId === currentISOWeek)?.summary
        }
        onSaveSummary={handleSaveSummary}
        onResetWeek={() => setIsResetConfirmOpen(true)}
        isHistorical={isHistoricalWeek}
      />

      {/* Week History Archive Drawer */}
      <WeekHistoryView
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        weekRecords={weekRecords}
        projects={projects}
        onSelectWeek={(wId) => setSelectedWeekId(wId)}
        selectedWeekId={selectedWeekId}
      />

      {/* Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        projects={projects}
        onAddProject={handleAddProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Hotkey Shortcuts Guide */}
      <HotkeyGuideModal
        isOpen={isHotkeysOpen}
        onClose={() => setIsHotkeysOpen(false)}
      />

      {/* Data Backup Modal */}
      <DataBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        projects={projects}
        accomplishments={accomplishments}
        weekRecords={weekRecords}
        onImportData={handleImportData}
        onResetToSampleData={handleResetToSample}
      />

      {/* Finalize & Reset Week Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                Finalize & Reset Current Week?
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will archive all {weekAccomplishments.length} current accomplishments for{' '}
              <strong>{getWeekLabel(currentISOWeek)}</strong> into your History Archive and clear your active board for a clean fresh slate.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeAndResetWeek}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 cursor-pointer"
              >
                Yes, Finalize & Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
