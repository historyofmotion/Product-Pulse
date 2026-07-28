import React from 'react';
import {
  Zap,
  PenSquare,
  Sparkles,
  Sliders,
  RotateCcw,
  HelpCircle,
  Moon,
  Sun,
  FileText,
} from 'lucide-react';
import { getWeekLabel, getWeekDateRange } from '../utils/dateUtils';

interface HeaderProps {
  activeMode: 'enter' | 'summary';
  onChangeMode: (mode: 'enter' | 'summary') => void;
  currentWeekId: string;
  selectedWeekId: string;
  isHistoricalWeek: boolean;
  theme: 'dark' | 'light' | 'paper';
  onChangeTheme: (theme: 'dark' | 'light' | 'paper') => void;
  onOpenManagement: (tab?: 'storage' | 'backup' | 'projects' | 'ai') => void;
  onOpenHotkeys: () => void;
  onResetWeek: () => void;
  accomplishmentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onChangeMode,
  currentWeekId,
  selectedWeekId,
  isHistoricalWeek,
  theme,
  onChangeTheme,
  onOpenManagement,
  onOpenHotkeys,
  onResetWeek,
  accomplishmentCount,
}) => {
  const weekLabel = getWeekLabel(selectedWeekId);
  const dateRange = getWeekDateRange(selectedWeekId);

  const isLight = theme === 'light';
  const isPaper = theme === 'paper';

  const headerBg = isPaper
    ? 'bg-[#f4efe4]/95 border-[#e2d8c3] text-[#2c2a29]'
    : isLight
    ? 'bg-white/95 border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';

  const titleColor = isPaper ? 'text-[#2c2a29]' : isLight ? 'text-slate-900' : 'text-white';
  const subtextColor = isPaper ? 'text-[#6b6455]' : isLight ? 'text-slate-500' : 'text-slate-400';

  const switchBg = isPaper
    ? 'bg-[#e2d8c3]'
    : isLight
    ? 'bg-slate-200'
    : 'bg-slate-950';

  const btnSecondary = isPaper
    ? 'bg-[#e2d8c3] hover:bg-[#d8ccb4] text-[#2c2a29] border-[#d8ccb4]'
    : isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';

  return (
    <header className={`sticky top-0 z-30 backdrop-blur border-b shadow-sm ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand & App Title */}
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Product Pulse Icon"
              className="w-9 h-9 rounded-xl shadow-lg ring-1 ring-white/20 shrink-0 object-cover"
            />
            <div className="hidden sm:block">
              <h1 className={`text-base font-bold tracking-tight leading-none ${titleColor}`}>
                Product Pulse
              </h1>
              <p className={`text-[11px] mt-0.5 font-medium ${subtextColor}`}>
                {weekLabel} ({dateRange})
              </p>
            </div>
          </div>

          {/* TWO MAIN MODES/PAGES SWITCHER */}
          <div className={`flex items-center p-1 rounded-2xl border ${switchBg} border-slate-700/20 shadow-inner`}>
            <button
              onClick={() => onChangeMode('enter')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeMode === 'enter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : `${subtextColor} hover:opacity-80`
              }`}
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>1. Enter</span>
            </button>
            <button
              onClick={() => onChangeMode('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeMode === 'summary'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-600/30'
                  : `${subtextColor} hover:opacity-80`
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>2. Summary</span>
            </button>
          </div>

          {/* Skinning Theme Toggle & Management */}
          <div className="flex items-center gap-2">
            
            {/* Skinning Selector Pill */}
            <div className={`flex items-center p-1 rounded-xl border ${btnSecondary} text-xs gap-1`}>
              <button
                onClick={() => onChangeTheme('dark')}
                className={`p-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="Dark Theme Skin"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px] font-bold">Dark</span>
              </button>

              <button
                onClick={() => onChangeTheme('light')}
                className={`p-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  theme === 'light'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="Light Theme Skin"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px] font-bold">Light</span>
              </button>

              <button
                onClick={() => onChangeTheme('paper')}
                className={`p-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  theme === 'paper'
                    ? 'bg-amber-800 text-amber-50 shadow'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="Paper Theme Skin"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px] font-bold">Paper</span>
              </button>
            </div>

            {/* Management Modal Trigger */}
            <button
              onClick={() => onOpenManagement('storage')}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl font-semibold text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${btnSecondary}`}
              title="Management (Storage, Import/Export, Previous Weeks, Projects, AI Settings)"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Management</span>
            </button>

            {/* Finalize / Reset Week */}
            {!isHistoricalWeek && (
              <button
                onClick={onResetWeek}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${btnSecondary}`}
                title="Finalize & Reset Week"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Shortcuts Help */}
            <button
              onClick={onOpenHotkeys}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${btnSecondary}`}
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
