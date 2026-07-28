import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  AlertCircle,
  Loader2,
  MessageSquare,
  Award,
  ExternalLink,
  Layers,
  Clock,
  Folder,
  Info,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { WeeklySummaryData, Project, Accomplishment, AppSettings, ProjectSummary, WeekRecord } from '../types';
import { getWeekLabel, getWeekDateRange, formatSmartDate } from '../utils/dateUtils';
import { generateWeeklySummary } from '../services/aiService';

interface SummaryViewProps {
  weekId: string;
  currentWeekId: string;
  weekRecords: WeekRecord[];
  projects: Project[];
  accomplishments: Accomplishment[];
  existingSummary?: WeeklySummaryData;
  settings: AppSettings;
  theme: 'dark' | 'light' | 'paper';
  onSaveSummary: (summary: WeeklySummaryData) => void;
  onSwitchToEnter: () => void;
  onOpenManagement: (tab?: 'storage' | 'backup' | 'projects' | 'ai') => void;
  onSelectWeek: (weekId: string) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  weekId,
  currentWeekId,
  weekRecords,
  projects,
  accomplishments,
  existingSummary,
  settings,
  theme,
  onSaveSummary,
  onSwitchToEnter,
  onOpenManagement,
  onSelectWeek,
}) => {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(existingSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const weekLabel = getWeekLabel(weekId);
  const dateRange = getWeekDateRange(weekId);
  const isHistoricalWeek = weekId !== currentWeekId;

  useEffect(() => {
    if (existingSummary) {
      setSummary(existingSummary);
    } else {
      setSummary(null);
    }
  }, [existingSummary, weekId]);

  // Out-of-sync stale summary detection
  const outOfSyncCount = useMemo(() => {
    if (!summary || !summary.generatedAt) return 0;
    const summaryTime = new Date(summary.generatedAt).getTime();
    return accomplishments.filter(
      (a) => new Date(a.createdAt).getTime() > summaryTime
    ).length;
  }, [summary, accomplishments]);

  // Theme styling rules
  const isLight = theme === 'light';
  const isPaper = theme === 'paper';

  const cardBg = isPaper
    ? 'bg-[#f4efe4] border-[#e2d8c3] text-[#2c2a29]'
    : isLight
    ? 'bg-white border-slate-200 shadow-sm text-slate-900'
    : 'bg-slate-900 border-slate-800 text-slate-100';

  const innerBg = isPaper
    ? 'bg-[#fbf9f4] border-[#d8ccb4] text-[#2c2a29]'
    : isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-950 border-slate-800 text-slate-200';

  const subTextColor = isPaper
    ? 'text-[#6b6455]'
    : isLight
    ? 'text-slate-600'
    : 'text-slate-400';

  // Generate Weekly Summary (AI) - strictly when user gives the go-ahead
  const handleGenerateSummary = async (forceRegenerate = false) => {
    if (accomplishments.length === 0) {
      setError('No updates recorded for this week yet. Add updates in "1. Enter" before generating.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoNotice(null);

    try {
      const generated = await generateWeeklySummary(
        {
          weekLabel,
          dateRange,
          projects,
          accomplishments: accomplishments.map(acc => {
            const proj = projects.find(p => p.id === acc.projectId);
            return { ...acc, projectName: proj?.name || 'General' };
          }),
          tone: settings.summaryTone || 'executive',
          customInstructions: settings.customInstructions || '',
        },
        settings
      );

      setSummary(generated);
      onSaveSummary(generated);
      setInfoNotice('Saved Summary (AI) successfully!');
      setTimeout(() => setInfoNotice(null), 3000);
    } catch (err: any) {
      console.error('Summary error:', err);
      setError(err.message || 'Error generating Gemini AI summary.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to build Markdown for a single project (Summary (AI) + Logged Updates)
  const buildProjectMarkdown = (
    proj: Project,
    projectSummary?: ProjectSummary,
    projNotes: Accomplishment[] = []
  ) => {
    let md = `### Project: ${proj.name}\n\n`;

    if (projectSummary) {
      md += `**Summary (AI):** ${projectSummary.headline}\n`;
      if (projectSummary.bulletPoints && projectSummary.bulletPoints.length > 0) {
        projectSummary.bulletPoints.forEach((bp) => {
          md += `- ${bp}\n`;
        });
      }
      md += `\n`;
    }

    if (projNotes.length > 0) {
      md += `**Updates:**\n`;
      projNotes.forEach((note) => {
        md += `- ${note.content.replace(/\n/g, ' ')}\n`;
      });
      md += `\n`;
    } else {
      md += `_No logged updates for this project._\n\n`;
    }

    return md;
  };

  // Construct full Markdown clipping containing Executive Summary (AI) + All Projects
  const buildFullMarkdownClipping = () => {
    let md = `# Weekly Status Report - ${weekLabel} (${dateRange})\n\n`;

    if (summary) {
      md += `## Summary (AI) Overview\n${summary.executiveSummary}\n\n`;

      if (summary.keyWins && summary.keyWins.length > 0) {
        md += `### Key Wins & Deliverables\n`;
        summary.keyWins.forEach((win) => {
          md += `- ${win}\n`;
        });
        md += `\n`;
      }
    }

    md += `## Project Breakdown & Logged Updates\n\n`;

    const activeProjects = projects.filter((p) => p.status === 'active');
    activeProjects.forEach((proj) => {
      const ps = summary?.projectSummaries?.find(
        (item) => item.projectId === proj.id || item.projectName.toLowerCase() === proj.name.toLowerCase()
      );
      const projNotes = accomplishments.filter((a) => a.projectId === proj.id);
      
      if (ps || projNotes.length > 0) {
        md += buildProjectMarkdown(proj, ps, projNotes) + `---\n\n`;
      }
    });

    return md;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Helper to format URLs in text into clickable <a> links
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

  // Filter active projects
  const activeProjects = projects.filter((p) => p.status === 'active');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Page Top Bar */}
      <div className={`${cardBg} border rounded-3xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold">Summary & Weekly Report</h2>
          </div>
          <p className={`text-xs ${subTextColor} mt-1`}>
            {weekLabel} ({dateRange})
          </p>
        </div>

        {/* Week Selector Dropdown & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
            <select
              value={weekId}
              onChange={(e) => onSelectWeek(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value={currentWeekId} className="bg-slate-900 text-slate-100">
                Current Week ({getWeekLabel(currentWeekId)})
              </option>
              {weekRecords
                .filter((w) => w.weekId !== currentWeekId)
                .map((rec) => (
                  <option key={rec.weekId} value={rec.weekId} className="bg-slate-900 text-slate-100">
                    {rec.weekLabel} ({rec.dateRange})
                  </option>
                ))}
            </select>
          </div>

          {isHistoricalWeek && (
            <button
              onClick={() => onSelectWeek(currentWeekId)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return to Current Week</span>
            </button>
          )}

          {/* Circular Refresh Icon Button */}
          <button
            onClick={() => handleGenerateSummary(true)}
            disabled={isLoading || accomplishments.length === 0}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center transition-colors"
            title={summary ? "Regenerate Summary (AI)" : "Generate Summary (AI)"}
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : 'text-slate-300'}`} />
          </button>

          <button
            onClick={() => handleGenerateSummary(true)}
            disabled={isLoading || accomplishments.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={accomplishments.length === 0 ? "No updates recorded yet" : "Click to generate Summary (AI)"}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-200" />
            )}
            <span>{summary ? 'Regenerate Summary' : 'Generate Summary'}</span>
          </button>
        </div>
      </div>

      {/* Out-of-Sync Stale Summary Indicator Alert */}
      {outOfSyncCount > 0 && (
        <div className="p-3.5 bg-amber-950/60 border border-amber-500/50 text-amber-200 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>AI Summary is out of date:</strong> {outOfSyncCount} new update{outOfSyncCount > 1 ? 's' : ''} added since summary was last generated.
            </span>
          </div>
          <button
            onClick={() => handleGenerateSummary(true)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Regenerate Summary</span>
          </button>
        </div>
      )}

      {/* Info Notice */}
      {infoNotice && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{infoNotice}</span>
        </div>
      )}

      {/* Warning if no updates recorded */}
      {accomplishments.length === 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-amber-200">No updates recorded for this week yet</h3>
          <p className="text-xs text-amber-300/80">
            Switch to <strong className="text-amber-100">1. Enter</strong> and log your updates. Once you're ready, click "Generate Summary (AI)".
          </p>
          <button
            onClick={onSwitchToEnter}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold inline-block cursor-pointer"
          >
            Go to Enter
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading AI State */}
      {isLoading && (
        <div className={`${cardBg} border rounded-3xl p-12 text-center space-y-4`}>
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm font-bold">Synthesizing weekly updates with Gemini AI...</p>
          <p className={`text-xs ${subTextColor}`}>Extracting factual project highlights strictly from recorded updates.</p>
        </div>
      )}

      {/* ----------------- SECTION 1: EXECUTIVE SUMMARY (AI) ----------------- */}
      {!isLoading && summary && (
        <div className="space-y-4">
          
          {/* Section Header & Export Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Summary (AI)</span>
              </h3>
              <button
                onClick={() => setShowFormatInfo(!showFormatInfo)}
                className="text-slate-400 hover:text-indigo-400 p-1 transition-colors cursor-pointer"
                title="How Slack vs Email formatting works"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prominent Copy Full Markdown Clipping Button */}
            <button
              onClick={() => handleCopy(buildFullMarkdownClipping(), 'full_md')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              {copiedType === 'full_md' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied Full Markdown Report!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Entire Summary Markdown</span>
                </>
              )}
            </button>
          </div>

          {/* Slack vs Email Info Drawer */}
          {showFormatInfo && (
            <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs space-y-2 animate-fade-in text-indigo-200">
              <p className="font-bold">Formatting Differences (Slack vs Email):</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                <li><strong>Slack Format:</strong> Uses single asterisks <code className="bg-indigo-900/60 px-1 rounded">*bold*</code> and mrkdwn bullet lists for native rendering inside Slack message composer windows.</li>
                <li><strong>Email / Document Format:</strong> Uses standard Markdown <code className="bg-indigo-900/60 px-1 rounded">**bold**</code>, headings <code className="bg-indigo-900/60 px-1 rounded"># Title</code>, and structured bullet lists suitable for email clients, Notion, Jira, or Google Docs.</li>
              </ul>
            </div>
          )}

          {/* AI Executive Content Card */}
          <div className={`${cardBg} border rounded-3xl p-6 space-y-5 shadow-sm`}>
            
            {/* Executive Summary */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                Executive Overview
              </span>
              <p className="text-base font-bold leading-relaxed">
                {summary.executiveSummary}
              </p>
            </div>

            {/* Key Wins */}
            {summary.keyWins && summary.keyWins.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Key Deliverables & Highlights</span>
                </span>
                <ul className="space-y-2">
                  {summary.keyWins.map((win, idx) => (
                    <li key={idx} className={`text-xs p-3 rounded-xl border flex items-start gap-2 ${innerBg}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Export Formats */}
            <div className="pt-3 border-t border-slate-800/40 flex items-center justify-end gap-2 text-xs flex-wrap">
              <button
                onClick={() => handleCopy(summary.slackFormatted, 'slack')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedType === 'slack' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{copiedType === 'slack' ? 'Copied Slack Text' : 'Copy Overview for Slack'}</span>
              </button>

              <button
                onClick={() => handleCopy(summary.emailFormatted, 'email')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedType === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{copiedType === 'email' ? 'Copied Email Text' : 'Copy Overview for Email'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ----------------- SECTION 2: PER-PROJECT BREAKDOWN WITH INDIVIDUAL UPDATES ----------------- */}
      <div className="space-y-6 pt-4 border-t border-slate-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Project Updates</span>
            </h3>
            <p className={`text-xs ${subTextColor} mt-0.5`}>
              Each project lists its Summary (AI) and recorded updates. Click "Copy Update" on any project to copy its markdown.
            </p>
          </div>
        </div>

        {activeProjects.length === 0 ? (
          <div className={`${cardBg} border rounded-2xl p-8 text-center space-y-2`}>
            <p className="text-xs text-slate-400">No active projects found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeProjects.map((proj) => {
              const projSummary = summary?.projectSummaries?.find(
                (ps) => ps.projectId === proj.id || ps.projectName.toLowerCase() === proj.name.toLowerCase()
              );
              const projNotes = accomplishments.filter((a) => a.projectId === proj.id);
              const projMdType = `proj_${proj.id}`;

              return (
                <div
                  key={proj.id}
                  className={`${cardBg} border rounded-3xl p-6 shadow-sm space-y-4 transition-all hover:border-indigo-500/40 relative group`}
                >
                  {/* Project Header Bar with Click-to-Copy */}
                  <div
                    onClick={() =>
                      handleCopy(
                        buildProjectMarkdown(proj, projSummary, projNotes),
                        projMdType
                      )
                    }
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-indigo-400">{proj.name}</h4>
                        <p className={`text-[11px] ${subTextColor}`}>
                          Click header or button to copy markdown for {proj.name}
                        </p>
                      </div>
                    </div>

                    {/* Single Click "Copy Update" Button per Project */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(
                          buildProjectMarkdown(proj, projSummary, projNotes),
                          projMdType
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        copiedType === projMdType
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      }`}
                      title={`Copy markdown update for ${proj.name}`}
                    >
                      {copiedType === projMdType ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Copied {proj.name} Update!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Update</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 1. Project Summary (AI) Section */}
                  {projSummary && (
                    <div className={`p-4 rounded-2xl border space-y-2 ${innerBg}`}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                          Summary (AI)
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-snug">{projSummary.headline}</p>
                      {projSummary.bulletPoints && projSummary.bulletPoints.length > 0 && (
                        <ul className="text-xs space-y-1 pl-1 pt-1 opacity-90">
                          {projSummary.bulletPoints.map((bp, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-1.5">
                              <span className="text-purple-400">•</span>
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* 2. Individual Updates Listed as Rows */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block px-1">
                      Updates
                    </span>

                    {projNotes.length === 0 ? (
                      <div className={`p-3 rounded-xl border text-xs ${subTextColor} ${innerBg}`}>
                        No updates recorded for this project yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {projNotes.map((note) => (
                          <div
                            key={note.id}
                            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${innerBg} transition-all hover:border-slate-700`}
                          >
                            <div className="space-y-1 flex-1">
                              <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                                {renderTextWithLinks(note.content)}
                              </p>
                              <span className={`text-[10px] ${subTextColor} flex items-center gap-1 font-semibold`}>
                                <Clock className="w-3 h-3 text-indigo-400" />
                                {formatSmartDate(note.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
