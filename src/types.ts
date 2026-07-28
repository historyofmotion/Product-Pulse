export type TagType = 'Feature' | 'Fix' | 'Milestone' | 'Meeting' | 'Docs' | 'Refactor' | 'Win' | 'Ops' | 'General';

export type ImpactLevel = 'High' | 'Medium' | 'Standard';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string; // Tailwind color name like 'indigo', 'emerald', 'amber', 'rose', 'sky', 'violet'
  icon?: string;
  status: 'active' | 'archived';
  order: number;
}

export interface Accomplishment {
  id: string;
  projectId: string;
  content: string;
  originalSpeechRaw?: string;
  tag: TagType;
  impact: ImpactLevel;
  weekId: string; // e.g., '2026-W30'
  createdAt: string; // ISO date string
  isPinned?: boolean;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  statusColor: string;
  headline: string;
  bulletPoints: string[];
}

export interface WeeklySummaryData {
  executiveSummary: string;
  keyWins: string[];
  projectSummaries: ProjectSummary[];
  slackFormatted: string;
  emailFormatted: string;
  generatedAt?: string;
}

export interface WeekRecord {
  weekId: string; // e.g. '2026-W30'
  weekLabel: string; // e.g. 'Week 30, 2026'
  dateRange: string; // e.g. 'Jul 20 - Jul 26, 2026'
  status: 'current' | 'archived';
  accomplishments: Accomplishment[];
  summary?: WeeklySummaryData;
  archivedAt?: string;
}

export interface AppSettings {
  autoPolishOnVoice: boolean;
  speechLanguage: string;
  soundEffects: boolean;
  theme: 'dark' | 'light' | 'paper';
  defaultProjectId?: string;
  summaryTone?: 'executive' | 'concise' | 'detailed';
  aiModel?: string;
  customInstructions?: string;
  activeStorageFileName?: string;
  storageLocation?: string;
  geminiApiKey?: string;
}
