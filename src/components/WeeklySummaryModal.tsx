import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileText,
  MessageSquare,
  Award,
} from 'lucide-react';
import { WeeklySummaryData, Project, Accomplishment } from '../types';
import { getWeekLabel, getWeekDateRange } from '../utils/dateUtils';
import { generateWeeklySummary } from '../services/aiService';

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekId: string;
  projects: Project[];
  accomplishments: Accomplishment[];
  existingSummary?: WeeklySummaryData;
  onSaveSummary: (summary: WeeklySummaryData) => void;
  onResetWeek?: () => void;
  isHistorical?: boolean;
}

export const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({
  isOpen,
  onClose,
  weekId,
  projects,
  accomplishments,
  existingSummary,
  onSaveSummary,
  onResetWeek,
  isHistorical = false,
}) => {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(existingSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'slack' | 'email'>('preview');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const weekLabel = getWeekLabel(weekId);
  const dateRange = getWeekDateRange(weekId);

  useEffect(() => {
    if (existingSummary) {
      setSummary(existingSummary);
    } else {
      setSummary(null);
    }
  }, [existingSummary, weekId]);

  // Generate Summary function
  const handleGenerateSummary = async () => {
    if (accomplishments.length === 0) {
      setError('Add at least one accomplishment before generating a summary.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generated = await generateWeeklySummary({
        weekLabel,
        dateRange,
        projects,
        accomplishments,
      });

      setSummary(generated);
      onSaveSummary(generated);
    } catch (err: any) {
      console.error('Summary error:', err);
      setError(err.message || 'Error generating weekly summary.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger auto generation on open if no summary exists
  useEffect(() => {
    if (isOpen && !summary && accomplishments.length > 0 && !isLoading) {
      handleGenerateSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                AI Weekly Status Report
              </h2>
              <p className="text-xs text-slate-400">
                {weekLabel} ({dateRange}) • Gemini 3.6 Flash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSummary}
              disabled={isLoading || accomplishments.length === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Regenerate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Executive Dashboard
          </button>

          <button
            onClick={() => setActiveTab('slack')}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'slack'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Slack / Teams Format
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Email Update
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Synthesizing Weekly Accomplishments...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini is organizing notes by project and polishing executive headlines.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <p className="text-slate-400 mt-0.5">
                  Log accomplishments for the week first, then click Regenerate.
                </p>
              </div>
            </div>
          )}

          {/* Render Summary Data */}
          {!isLoading && summary && (
            <>
              {/* TAB 1: Preview Dashboard */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  
                  {/* Executive Overview Box */}
                  <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-500/30 rounded-2xl">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Executive Summary
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {summary.executiveSummary}
                    </p>
                  </div>

                  {/* Key Wins */}
                  {summary.keyWins && summary.keyWins.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        Top Wins of the Week
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {summary.keyWins.map((win, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span>{win}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Summaries */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                      Project Highlights Breakdown
                    </h3>
                    <div className="space-y-4">
                      {summary.projectSummaries.map((pSum, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                              {pSum.projectName}
                            </h4>
                          </div>

                          <p className="text-xs font-semibold text-slate-300 mb-3 italic">
                            "{pSum.headline}"
                          </p>

                          <ul className="space-y-2">
                            {pSum.bulletPoints.map((bp, bIdx) => (
                              <li
                                key={bIdx}
                                className="text-xs text-slate-300 flex items-start gap-2"
                              >
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>{bp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Slack / Teams Markdown */}
              {activeTab === 'slack' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Formatted markdown ready to paste into Slack or Teams channel
                    </span>
                    <button
                      onClick={() => handleCopy(summary.slackFormatted, 'slack')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedType === 'slack' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Slack Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={summary.slackFormatted}
                    rows={14}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-300 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* TAB 3: Executive Email Format */}
              {activeTab === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Plain text structured for status updates & stakeholder emails
                    </span>
                    <button
                      onClick={() => handleCopy(summary.emailFormatted, 'email')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedType === 'email' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email Update</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={summary.emailFormatted}
                    rows={14}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-300 focus:outline-none resize-none"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>

          {!isHistorical && onResetWeek && (
            <button
              onClick={() => {
                onClose();
                onResetWeek();
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Finalize & Reset Week</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
