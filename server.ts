import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Weekly Summary Generator Endpoint
  app.post('/api/summary', async (req, res) => {
    try {
      const { weekLabel, dateRange, projects, accomplishments } = req.body;

      if (!accomplishments || !Array.isArray(accomplishments) || accomplishments.length === 0) {
        return res.status(400).json({
          error: 'No accomplishments provided to summarize.',
        });
      }

      const ai = getGeminiClient();

      const promptData = {
        weekLabel: weekLabel || 'Current Week',
        dateRange: dateRange || '',
        projects: projects || [],
        accomplishments: accomplishments.map((acc: any) => ({
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
- Maintain a professional, active tone based solely on what was actually completed or updated.`;

      const prompt = `Analyze these raw accomplishments for ${promptData.weekLabel} (${promptData.dateRange}) and produce a structured weekly summary:

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

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('Error in /api/summary:', error);
      return res.status(500).json({
        error: error.message || 'Failed to generate weekly summary.',
      });
    }
  });

  // AI Note Polisher Endpoint (Instant refinement of speech notes or quick jottings)
  app.post('/api/polish-note', async (req, res) => {
    try {
      const { rawText, projectName } = req.body;

      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({ error: 'Text is required to polish.' });
      }

      const ai = getGeminiClient();

      const prompt = `Refine this quick user note into a concise, professional accomplishment statement for weekly status tracking.
Project context: ${projectName || 'General'}
Raw note: "${rawText.trim()}"

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

      const parsedData = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('Error in /api/polish-note:', error);
      return res.status(500).json({
        error: error.message || 'Failed to polish note.',
      });
    }
  });

  // Setup Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
