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
  projectName?: string;
  rawText: string;
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
 * Resolves the API key for alternative providers
 */
function getAIProviderApiKey(settings?: AppSettings): string {
  const provider = settings?.aiProvider || 'gemini';
  if (provider === 'gemini') {
    return getClientApiKey(settings) || '';
  }
  if (settings?.aiApiKey && settings.aiApiKey.trim()) {
    return settings.aiApiKey.trim();
  }
  // Try fallback environment variables
  if (provider === 'openai') {
    return (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
  }
  if (provider === 'openrouter') {
    return (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
  }
  return '';
}

/**
 * Resolves chat completion URL for OpenAI-compatible providers
 */
function resolveBaseUrl(provider: string, customUrl?: string): string {
  if (provider === 'openai') {
    return 'https://api.openai.com/v1/chat/completions';
  }
  if (provider === 'openrouter') {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }
  let url = customUrl || 'http://localhost:11434/v1';
  if (!url.endsWith('/chat/completions')) {
    if (url.endsWith('/')) {
      url += 'chat/completions';
    } else {
      url += '/chat/completions';
    }
  }
  return url;
}

/**
 * Generic caller for OpenAI-compatible completions
 */
async function callOpenAICompatibleAPI(
  endpoint: string,
  model: string,
  apiKey: string,
  systemInstruction: string,
  prompt: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body: any = {
    model: model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ]
  };

  // Enable JSON response format if supported by the provider
  if (endpoint.includes('openai') || endpoint.includes('openrouter')) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API returned error ${response.status}: ${errText || response.statusText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message?.content;
  if (!choice) {
    throw new Error('Received empty completions choice from AI engine.');
  }
  return choice;
}

/**
 * Build system instruction and prompt for Weekly Summary
 */
function buildSummaryPrompt(params: SummaryRequestParams) {
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

  const prompt = `Analyze these raw accomplishments for ${promptData.weekLabel} (${promptData.dateRange}) and produce a structured weekly summary in ${params.tone || 'executive'} tone.
CRITICAL: You must return valid JSON that can be parsed directly.

Data:
${JSON.stringify(promptData, null, 2)}

Return a JSON object with this exact structure:
{
  "executiveSummary": "A concise 2-3 sentence high-level overview of overall momentum and key achievements this week.",
  "keyWins": ["Major achievement 1", "Major achievement 2"],
  "projectSummaries": [
    {
      "projectId": "id-of-project",
      "projectName": "Name of Project",
      "statusColor": "green, amber, or blue",
      "headline": "One sentence summary of project progress this week",
      "bulletPoints": ["Clean, polished accomplishment bullet 1", "Clean, polished accomplishment bullet 2"]
    }
  ],
  "slackFormatted": "Markdown text formatted specifically for pasting into Slack / Teams (using *bold*, emojis, clean bullet points).",
  "emailFormatted": "Plain text formatted specifically for sending as an executive update email."
}`;

  return { systemInstruction, prompt };
}

/**
 * Build prompt for note polishing
 */
function buildPolishPrompt(params: PolishRequestParams) {
  const systemInstruction = `You are an expert executive assistant. Polish user notes into clear accomplishments.`;
  const prompt = `Refine this quick user note into a concise, professional accomplishment statement for weekly status tracking.
Project context: ${params.projectName || 'General'}
Raw note: "${params.rawText.trim()}"

Return JSON with this exact structure:
{
  "polishedText": "A polished, active-voice bullet point statement (15-25 words).",
  "suggestedTag": "One of: Feature, Fix, Milestone, Meeting, Docs, Refactor, Win, Ops",
  "suggestedImpact": "One of: High, Medium, Standard"
}`;

  return { systemInstruction, prompt };
}

/**
 * Executes direct in-browser Gemini summary generation
 */
async function generateSummaryInBrowser(
  params: SummaryRequestParams,
  apiKey: string
): Promise<WeeklySummaryData> {
  const ai = new GoogleGenAI({ apiKey });
  const { systemInstruction, prompt } = buildSummaryPrompt(params);

  const modelCandidates = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.6-flash'];
  let response;
  let lastError;

  for (const modelName of modelCandidates) {
    try {
      response = await ai.models.generateContent({
        model: modelName,
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
      if (response && response.text) break;
    } catch (err: any) {
      lastError = err;
      console.warn(`Browser Gemini ${modelName} call failed, trying next fallback...`, err?.message);
    }
  }

  if (!response || !response.text) {
    throw lastError || new Error('Failed to generate summary with Gemini API.');
  }

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
  const { prompt } = buildPolishPrompt(params);

  const modelCandidates = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.6-flash'];
  let response;
  let lastError;

  for (const modelName of modelCandidates) {
    try {
      response = await ai.models.generateContent({
        model: modelName,
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
      if (response && response.text) break;
    } catch (err: any) {
      lastError = err;
      console.warn(`Browser Gemini ${modelName} polish note call failed...`, err?.message);
    }
  }

  if (!response || !response.text) {
    throw lastError || new Error('Failed to polish note with Gemini API.');
  }

  return JSON.parse(response.text || '{}');
}

/**
 * Main AI Weekly Summary Generator supporting multiple providers and fallbacks
 */
export async function generateWeeklySummary(
  params: SummaryRequestParams,
  settings?: AppSettings
): Promise<WeeklySummaryData> {
  const provider = settings?.aiProvider || 'gemini';

  // 1. Handlers for alternative providers (OpenAI / OpenRouter / Custom local endpoints)
  if (provider !== 'gemini') {
    const endpoint = resolveBaseUrl(provider, settings?.customBaseUrl);
    const key = getAIProviderApiKey(settings);
    const model = settings?.customModelName || (
      provider === 'openai' ? 'gpt-4o-mini' : 
      provider === 'openrouter' ? 'google/gemini-2.5-flash' : 'llama3'
    );

    const { systemInstruction, prompt } = buildSummaryPrompt(params);
    const resContent = await callOpenAICompatibleAPI(endpoint, model, key, systemInstruction, prompt);
    const parsed = JSON.parse(resContent.trim());
    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
  }

  // 2. Default Gemini behavior: Try server route first
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

  // 3. Fallback to client-side Gemini call
  const apiKey = getClientApiKey(settings);
  if (!apiKey) {
    throw new Error(
      'Gemini API Key missing. Please enter your Gemini API Key in Settings (or run server with GEMINI_API_KEY).'
    );
  }

  return generateSummaryInBrowser(params, apiKey);
}

/**
 * Main AI Note Polishing supporting multiple providers and fallbacks
 */
export async function polishNote(
  params: PolishRequestParams,
  settings?: AppSettings
): Promise<PolishResult> {
  const provider = settings?.aiProvider || 'gemini';

  // 1. Handlers for alternative providers (OpenAI / OpenRouter / Custom local endpoints)
  if (provider !== 'gemini') {
    const endpoint = resolveBaseUrl(provider, settings?.customBaseUrl);
    const key = getAIProviderApiKey(settings);
    const model = settings?.customModelName || (
      provider === 'openai' ? 'gpt-4o-mini' : 
      provider === 'openrouter' ? 'google/gemini-2.5-flash' : 'llama3'
    );

    const { systemInstruction, prompt } = buildPolishPrompt(params);
    const resContent = await callOpenAICompatibleAPI(endpoint, model, key, systemInstruction, prompt);
    return JSON.parse(resContent.trim());
  }

  // 2. Default Gemini behavior: Try server route first
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

  // 3. Fallback to client-side Gemini call
  const apiKey = getClientApiKey(settings);
  if (!apiKey) {
    throw new Error(
      'Gemini API Key missing. Please enter your Gemini API Key in Settings (or run server with GEMINI_API_KEY).'
    );
  }

  return polishNoteInBrowser(params, apiKey);
}
