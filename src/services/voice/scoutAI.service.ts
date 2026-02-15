// Scout AI Service - GPT-4o-mini for conversational intent + response

import Constants from "expo-constants";
import { ScoutAction, ScoutResponse, VoiceCommandParams } from "../../types/voice.types";
import { logger } from "../../utils/logger";

const OPENAI_API_KEY =
  Constants.expoConfig?.extra?.openaiApiKey ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
  "";

const GPT_API_URL = "https://api.openai.com/v1/chat/completions";

const SCOUT_SYSTEM_PROMPT = `You are Scout, a voice assistant for the FastApply job search app. You help users find and apply to jobs using voice commands.

PERSONALITY: Friendly, brief, action-oriented. Never more than 15 words in your response.

AVAILABLE ACTIONS:
- "search": Search/filter jobs by criteria (title, location, salary, remote, skills)
- "filter": Refine current job results
- "apply": Apply to current job or matching jobs
- "skip": Skip/reject current job
- "navigate": Go to a screen (dashboard, settings, applications, profiles)
- "details": Show details about current job
- "undo": Undo last swipe action
- "none": Just responding, no action needed

NAVIGATION ROUTES:
- "/(tabs)" or "/(tabs)/index": Jobs feed (swipe deck)
- "/(tabs)/dashboard": Dashboard / applications
- "/(tabs)/settings": Settings
- "/notifications": Notifications
- "/profile/create": Create new profile

PARAMS TO EXTRACT (for search/filter/apply):
- jobTitle: string (e.g. "React developer")
- jobType: string[] (e.g. ["full_time"])
- location: string
- country: string
- state: string
- city: string
- remote: boolean
- experienceLevel: string ("entry"|"mid"|"senior"|"lead")
- salaryMin: number
- salaryMax: number
- company: string
- skills: string[]
- applyToAll: boolean
- matchProfile: boolean

CONTEXT: You will receive the user's current screen and any active filters. Use this to give relevant responses.

Respond ONLY with valid JSON:
{
  "response": "Short spoken response",
  "action": {
    "type": "search",
    "params": { "jobTitle": "React developer", "remote": true },
    "navigation": null
  },
  "emotion": "excited"
}

Emotions: "neutral", "excited", "thinking", "sorry"`;

interface AppContext {
  currentScreen?: string;
  activeFilters?: Record<string, unknown>;
  jobCount?: number;
  currentJobTitle?: string;
}

class ScoutAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Process user transcript through GPT-4o-mini and get action + response
   */
  async process(
    transcript: string,
    context?: AppContext,
    signal?: AbortSignal,
  ): Promise<ScoutResponse> {
    if (!this.isConfigured()) {
      return {
        response: "I need an API key to help you.",
        action: { type: "none", params: {} },
        emotion: "sorry",
      };
    }

    try {
      const contextMessage = context
        ? `\n\nCurrent context: Screen=${context.currentScreen || "jobs"}, Jobs loaded=${context.jobCount || 0}${context.currentJobTitle ? `, Current job="${context.currentJobTitle}"` : ""}${context.activeFilters ? `, Filters=${JSON.stringify(context.activeFilters)}` : ""}`
        : "";

      const response = await fetch(GPT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SCOUT_SYSTEM_PROMPT },
            { role: "user", content: transcript + contextMessage },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`GPT API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No response from GPT");
      }

      const parsed = JSON.parse(content) as ScoutResponse;

      // Validate action type
      const validTypes = [
        "search",
        "filter",
        "apply",
        "skip",
        "navigate",
        "details",
        "undo",
        "none",
      ];
      if (!validTypes.includes(parsed.action?.type)) {
        parsed.action = { type: "none", params: {} };
      }

      return parsed;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw error;
      }

      logger.error("Scout AI processing error:", error);

      // Fallback: try regex-based parsing
      return this.fallbackParse(transcript);
    }
  }

  /**
   * Simple regex fallback when GPT is unavailable
   */
  private fallbackParse(text: string): ScoutResponse {
    const lower = text.toLowerCase();

    // Navigation intents
    if (/\b(dashboard|applications|applied)\b/.test(lower)) {
      return {
        response: "Opening your dashboard.",
        action: { type: "navigate", params: {}, navigation: "/(tabs)/dashboard" },
        emotion: "neutral",
      };
    }

    if (/\b(settings|preferences|account)\b/.test(lower)) {
      return {
        response: "Opening settings.",
        action: { type: "navigate", params: {}, navigation: "/(tabs)/settings" },
        emotion: "neutral",
      };
    }

    // Apply/skip
    if (/^(apply|yes|accept)/i.test(lower)) {
      return {
        response: "Applying now!",
        action: { type: "apply", params: {} },
        emotion: "excited",
      };
    }

    if (/^(skip|no|reject|pass)/i.test(lower)) {
      return {
        response: "Skipped!",
        action: { type: "skip", params: {} },
        emotion: "neutral",
      };
    }

    if (/^(undo|go back)/i.test(lower)) {
      return {
        response: "Undone!",
        action: { type: "undo", params: {} },
        emotion: "neutral",
      };
    }

    // Search/filter - extract basic params
    const params: VoiceCommandParams = {};

    if (/\bremote\b/.test(lower)) params.remote = true;

    const salaryMatch = lower.match(/(?:over|above|at least)\s*\$?(\d+)k?/);
    if (salaryMatch) {
      const val = parseInt(salaryMatch[1]);
      params.salaryMin = val > 1000 ? val : val * 1000;
    }

    const titlePatterns = [
      /(?:react|vue|angular|typescript|python|java|go|rust|node)/i,
      /(?:frontend|backend|full.?stack|mobile|data|devops|ml)/i,
      /(?:software|web)\s*(?:engineer|developer)/i,
    ];

    for (const p of titlePatterns) {
      const match = lower.match(p);
      if (match) {
        params.jobTitle = match[0];
        break;
      }
    }

    if (Object.keys(params).length > 0) {
      const parts: string[] = [];
      if (params.remote) parts.push("remote");
      if (params.jobTitle) parts.push(params.jobTitle);
      parts.push("jobs");
      if (params.salaryMin) parts.push(`over $${params.salaryMin / 1000}k`);

      return {
        response: `Searching for ${parts.join(" ")}!`,
        action: { type: "search", params },
        emotion: "excited",
      };
    }

    return {
      response: "Sorry, I didn't understand that. Try again?",
      action: { type: "none", params: {} },
      emotion: "sorry",
    };
  }
}

export const scoutAIService = new ScoutAIService();
