import React, { useState } from 'react';
import {
  X,
  History,
  Calendar,
  Sparkles,
  ChevronRight,
  Folder,
  FileText,
  Search,
} from 'lucide-react';
import { WeekRecord, Project } from '../types';
import { AccomplishmentCard } from './AccomplishmentCard';

interface WeekHistoryViewProps {
  isOpen: boolean;
  onClose: () => void;
  weekRecords: WeekRecord[];
  projects: Project[];
  onSelectWeek: (weekId: string) => void;
  selectedWeekId: string;
}

export const WeekHistoryView: React.FC<WeekHistoryViewProps> = ({
  isOpen,
  onClose,
  weekRecords,
  projects,
  onSelectWeek,
  selectedWeekId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredWeeks = weekRecords.filter((w) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchesLabel = w.weekLabel.toLowerCase().includes(term);
    const matchesAcc = w.accomplishments.some((a) =>
      a.content.toLowerCase().includes(term)
    );
    return matchesLabel || matchesAcc;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Past Weeks Archive
              </h2>
              <p className="text-xs text-slate-400">
                Review historical accomplishments and generated AI status summaries
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

        {/* Search Bar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search historical notes or week numbers..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* History Content Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredWeeks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No archived weeks found.</p>
              <p className="text-xs">
                As weeks pass or when you finalize a week, past records will accumulate here.
              </p>
            </div>
          ) : (
            filteredWeeks.map((record) => {
              const isCurrent = record.weekId === selectedWeekId;
              const hasSummary = !!record.summary;

              return (
                <div
                  key={record.weekId}
                  className={`p-4 bg-slate-950/70 border rounded-2xl transition-all ${
                    isCurrent
                      ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {record.weekLabel}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({record.dateRange})
                        </span>
                        {record.status === 'current' && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                            Active Current
                          </span>
                        )}
                        {hasSummary && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-violet-500/20 text-purple-300 border border-purple-500/30 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-300" />
                            AI Summarized
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        {record.accomplishments.length} accomplishments logged across projects
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onSelectWeek(record.weekId);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <span>View Week</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Highlights preview */}
                  {record.summary?.executiveSummary && (
                    <div className="mt-3 p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl text-xs text-slate-300 line-clamp-2 italic">
                      "{record.summary.executiveSummary}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Close Archive
          </button>
        </div>

      </div>
    </div>
  );
};
