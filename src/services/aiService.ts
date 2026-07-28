import { GoogleGenAI, Type } from '@google/genai';
import { Project, Accomplishment, WeeklySummaryData, AppSettings } from '../types';

export interface SummaryRequestParams {
  weekLabel: string;
  dateRange: string;
  projects: Project[];
  accomplishments: Accomplishment[];
  tone?: string;
  customInstructions?: string;
}

export interface PolishRequestParams {
  rawText: string;
  projectName?: string;
}

export interface PolishResult {
  polishedText: string;
  suggestedTag: string;
  suggestedImpact: string;
}

/**
 * Gets Gemini API Key from settings, Vite env, or process env
 */
function getClientApiKey(settings?: AppSettings): string | null {
  if (settings?.geminiApiKey && settings.geminiApiKey.trim()) {
    return settings.geminiApiKey.trim();
  }
  // Try Vite environment variable
  const viteEnvKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (viteEnvKey && viteEnvKey.trim()) {
    return viteEnvKey.trim();
  }
  // Try standard process.env if injected
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return null;
}

/**
 * Executes direct in-browser Gemini summary generation
 */
async function generateSummaryInBrowser(
  params: SummaryRequestParams,
  apiKey: string
): Promise<WeeklySummaryData> {
  const ai = new GoogleGenAI({ apiKey });

  const promptData = {
    weekLabel: params.weekLabel || 'Current Week',
    dateRange: params.dateRange || '',
    projects: params.projects || [],
    accomplishments: params.accomplishments.map((acc: any) => ({
      projectName: acc.projectName || 'General',
      content: acc.content,
      tag: acc.tag || 'Update',
      impact: acc.impact || 'Standard',
      createdAt: acc.createdAt,
    })),
  };

  const systemInstruction = `You are an expert executive assistant and product manager writing professional weekly status reports.
Your task is to analyze raw accomplishment notes recorded over the past week across multiple projects and transform them into a polished, crisp, executive-ready weekly status update.

CRITICAL FACTUALITY MANDATE:
- Stick STRICTLY and EXCLUSIVELY to the exact facts, updates, and metrics present in the provided accomplishment data.
- DO NOT invent, assume, extrapolate, or hallucinate unmentioned features, metrics, project status, dates, or results.
- Maintain a professional, active tone based solely on what was actually completed or updated.
${params.customInstructions ? `Additional Instructions: ${params.customInstructions}` : ''}`;

  const prompt = `Analyze these raw accomplishments for ${promptData.weekLabel} (${promptData.dateRange}) and produce a structured weekly summary in ${params.tone || 'executive'} tone:

Data:
${JSON.stringify(promptData, null, 2)}

Return a JSON object with:
1. "executiveSummary": A concise 2-3 sentence high-level overview of overall momentum and key achievements this week.
2. "keyWins": Array of 3-5 major achievements/highlights of the week (short impactful bullet points).
3. "projectSummaries": Array of objects, each containing:
   - "projectId": string
   - "projectName": string
   - "statusColor": string (e.g., "green", "amber", or "blue")
   - "headline": string (one sentence summary of project progress this week)
   - "bulletPoints": array of clean, polished bullet point accomplishment strings
4. "slackFormatted": Markdown text formatted specifically for pasting into Slack / Teams (using *bold*, emojis, clean bullet points).
5. "emailFormatted": Plain text formatted specifically for sending as an executive update email.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          keyWins: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          projectSummaries: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                projectId: { type: Type.STRING },
                projectName: { type: Type.STRING },
                statusColor: { type: Type.STRING },
                headline: { type: Type.STRING },
                bulletPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['projectName', 'headline', 'bulletPoints'],
            },
          },
          slackFormatted: { type: Type.STRING },
          emailFormatted: { type: Type.STRING },
        },
        required: ['executiveSummary', 'keyWins', 'projectSummaries', 'slackFormatted', 'emailFormatted'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Executes direct in-browser Gemini note polishing
 */
async function polishNoteInBrowser(
  params: PolishRequestParams,
  apiKey: string
): Promise<PolishResult> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Refine this quick user note into a concise, professional accomplishment statement for weekly status tracking.
Project context: ${params.projectName || 'General'}
Raw note: "${params.rawText.trim()}"

Return JSON with:
1. "polishedText": A polished, active-voice bullet point statement (15-25 words).
2. "suggestedTag": One of ["Feature", "Fix", "Milestone", "Meeting", "Docs", "Refactor", "Win", "Ops"].
3. "suggestedImpact": One of ["High", "Medium", "Standard"].`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          polishedText: { type: Type.STRING },
          suggestedTag: { type: Type.STRING },
          suggestedImpact: { type: Type.STRING },
        },
        required: ['polishedText', 'suggestedTag', 'suggestedImpact'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Main AI Weekly Summary Generator with server endpoint call & browser fallback
 */
export async function generateWeeklySummary(
  params: SummaryRequestParams,
  settings?: AppSettings
): Promise<WeeklySummaryData> {
  // 1. First try backend Express endpoint
  try {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return {
          ...data.data,
          generatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    console.info('Backend API unavailable. Falling back to client-side Gemini generation.');
  }

  // 2. Fallback to client-side Gemini call
  const apiKey = getClientApiKey(settings);
  if (!apiKey) {
    throw new Error(
      'Gemini API Key missing. Please enter your Gemini API Key in Settings (or run server with GEMINI_API_KEY).'
    );
  }

  return generateSummaryInBrowser(params, apiKey);
}

/**
 * Main AI Note Polishing function with server endpoint call & browser fallback
 */
export async function polishNote(
  params: PolishRequestParams,
  settings?: AppSettings
): Promise<PolishResult> {
  // 1. First try backend Express endpoint
  try {
    const res = await fetch('/api/polish-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (e) {
    console.info('Backend API unavailable. Falling back to client-side Gemini generation.');
  }

  // 2. Fallback to client-side Gemini call
  const apiKey = getClientApiKey(settings);
  if (!apiKey) {
    throw new Error(
      'Gemini API Key missing. Please enter your Gemini API Key in Settings (or run server with GEMINI_API_KEY).'
    );
  }

  return polishNoteInBrowser(params, apiKey);
}
