// Voice Command Parser Service - NLU using OpenAI GPT

import Constants from "expo-constants";
import { logger } from "../../utils/logger";
import {
  ParsedVoiceCommand,
  VoiceCommandIntent,
  VoiceCommandParams,
  GPTIntentResponse,
} from "../../types/voice.types";

// Get API key from environment variables
const OPENAI_API_KEY =
  Constants.expoConfig?.extra?.openaiApiKey ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
  "";

const GPT_API_URL = "https://api.openai.com/v1/chat/completions";

// System prompt for intent parsing
const SYSTEM_PROMPT = `You are a job search assistant that parses voice commands into structured actions.

Given a user's voice command about job searching, extract the intent and parameters.

INTENTS:
- "apply": User wants to apply to a job (current or matching profile)
- "skip": User wants to skip/reject the current job
- "search": User wants to search for specific jobs
- "filter": User wants to filter jobs by criteria
- "undo": User wants to undo the last action
- "next": User wants to see the next job
- "details": User wants more details about the current job
- "help": User needs help with commands
- "unknown": Cannot determine intent

PARAMETERS TO EXTRACT:
- jobTitle: Job role/title mentioned (e.g., "frontend developer", "software engineer")
- jobType: Employment type ["full_time", "part_time", "contract", "internship", "freelance"]
- location: General location mentioned
- country: Country mentioned (e.g., "USA", "United States", "Canada")
- state: State/province mentioned (e.g., "California", "New York")
- city: City mentioned (e.g., "San Francisco", "NYC")
- remote: Boolean if remote work is mentioned
- experienceLevel: Level mentioned ("entry", "mid", "senior", "lead", "executive")
- salaryMin: Minimum salary if mentioned (as number)
- salaryMax: Maximum salary if mentioned (as number)
- company: Specific company mentioned
- skills: Array of skills/technologies mentioned
- applyToAll: Boolean if user wants to apply to ALL matching jobs
- matchProfile: Boolean if user wants to match against their profile

Respond ONLY with valid JSON in this format:
{
  "intent": "search",
  "params": {
    "jobTitle": "frontend developer",
    "country": "United States",
    "remote": true
  },
  "confidence": 0.95,
  "suggestion": "I'll search for remote Frontend Developer jobs in the USA"
}`;

// Regex patterns for quick intent matching (fallback)
const INTENT_PATTERNS: Record<VoiceCommandIntent, RegExp[]> = {
  apply: [
    /^(apply|yes|accept|apply to this|i want this|send application)/i,
    /apply (to )?(all|every|matching)/i,
  ],
  skip: [
    /^(skip|no|reject|pass|next|not interested|swipe left)/i,
  ],
  search: [
    /^(search|find|look for|show me|looking for|i want|i need)/i,
    /search for/i,
  ],
  filter: [
    /^(filter|only show|show only|narrow down)/i,
    /filter by/i,
  ],
  undo: [
    /^(undo|go back|previous|take back|cancel)/i,
  ],
  next: [
    /^(next|show next|another|more)/i,
  ],
  details: [
    /^(details|tell me more|more info|about this|what is)/i,
  ],
  help: [
    /^(help|what can you|how do i|commands)/i,
  ],
  unknown: [],
};

class VoiceCommandParserService {
  private apiKey: string;
  private useGPT: boolean = true;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  /**
   * Set API key (for runtime configuration)
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Toggle between GPT and regex-based parsing
   */
  setUseGPT(useGPT: boolean): void {
    this.useGPT = useGPT;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Parse a voice command into structured intent and parameters
   */
  async parseCommand(text: string): Promise<ParsedVoiceCommand> {
    // First try regex-based parsing for simple commands
    const regexResult = this.parseWithRegex(text);

    // For simple commands with high confidence, use regex result
    if (
      regexResult.confidence >= 0.9 &&
      ["apply", "skip", "undo", "next", "help"].includes(regexResult.intent)
    ) {
      return regexResult;
    }

    // For complex commands, use GPT if available
    if (this.useGPT && this.isConfigured()) {
      try {
        const gptResult = await this.parseWithGPT(text);
        return gptResult;
      } catch (error) {
        logger.error("GPT parsing failed, falling back to regex:", error);
        return this.parseWithRegex(text);
      }
    }

    return regexResult;
  }

  /**
   * Parse command using OpenAI GPT
   */
  private async parseWithGPT(text: string): Promise<ParsedVoiceCommand> {
    const response = await fetch(GPT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from GPT");
    }

    // Parse JSON response
    try {
      const parsed: GPTIntentResponse = JSON.parse(content);
      return {
        intent: parsed.intent || "unknown",
        params: parsed.params || {},
        confidence: parsed.confidence || 0.8,
        rawText: text,
        suggestion: parsed.suggestion,
      };
    } catch {
      // If JSON parsing fails, try to extract from text
      logger.error("Failed to parse GPT response as JSON:", content);
      return this.parseWithRegex(text);
    }
  }

  /**
   * Parse command using regex patterns (fallback)
   */
  private parseWithRegex(text: string): ParsedVoiceCommand {
    const normalizedText = text.toLowerCase().trim();

    // Detect intent
    let detectedIntent: VoiceCommandIntent = "unknown";
    let maxConfidence = 0;

    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          detectedIntent = intent as VoiceCommandIntent;
          maxConfidence = 0.8;
          break;
        }
      }
      if (detectedIntent !== "unknown") break;
    }

    // Extract parameters
    const params = this.extractParamsFromText(normalizedText);

    // If we found job-related params but no clear intent, assume search
    if (
      detectedIntent === "unknown" &&
      (params.jobTitle || params.location || params.skills?.length)
    ) {
      detectedIntent = "search";
      maxConfidence = 0.7;
    }

    // Generate suggestion
    const suggestion = this.generateSuggestion(detectedIntent, params);

    return {
      intent: detectedIntent,
      params,
      confidence: maxConfidence,
      rawText: text,
      suggestion,
    };
  }

  /**
   * Extract parameters from text using patterns
   */
  private extractParamsFromText(text: string): VoiceCommandParams {
    const params: VoiceCommandParams = {};

    // Job titles
    const jobTitlePatterns = [
      /(?:frontend|front-end|front end)\s*(?:developer|engineer)?/i,
      /(?:backend|back-end|back end)\s*(?:developer|engineer)?/i,
      /(?:full stack|fullstack)\s*(?:developer|engineer)?/i,
      /software\s*(?:developer|engineer)/i,
      /(?:mobile|ios|android)\s*(?:developer|engineer)?/i,
      /(?:data|ml|machine learning)\s*(?:scientist|engineer)?/i,
      /(?:devops|sre|infrastructure)\s*(?:engineer)?/i,
      /product\s*(?:manager|designer)/i,
      /(?:ui|ux|ui\/ux)\s*(?:designer)?/i,
    ];

    for (const pattern of jobTitlePatterns) {
      const match = text.match(pattern);
      if (match) {
        params.jobTitle = match[0].trim();
        break;
      }
    }

    // Countries
    if (/\b(usa|united states|u\.s\.?a?\.?|america)\b/i.test(text)) {
      params.country = "United States";
    } else if (/\b(uk|united kingdom|britain)\b/i.test(text)) {
      params.country = "United Kingdom";
    } else if (/\bcanada\b/i.test(text)) {
      params.country = "Canada";
    } else if (/\bgermany\b/i.test(text)) {
      params.country = "Germany";
    }

    // States
    const statePatterns: Record<string, RegExp> = {
      California: /\b(california|ca)\b/i,
      "New York": /\b(new york|ny)\b/i,
      Texas: /\b(texas|tx)\b/i,
      Washington: /\b(washington|wa)\b/i,
      Massachusetts: /\b(massachusetts|ma)\b/i,
    };

    for (const [state, pattern] of Object.entries(statePatterns)) {
      if (pattern.test(text)) {
        params.state = state;
        break;
      }
    }

    // Cities
    const cityPatterns: Record<string, RegExp> = {
      "San Francisco": /\b(san francisco|sf|bay area)\b/i,
      "New York": /\b(new york city|nyc|manhattan)\b/i,
      "Los Angeles": /\b(los angeles|la)\b/i,
      Seattle: /\bseattle\b/i,
      Austin: /\baustin\b/i,
      Boston: /\bboston\b/i,
      Chicago: /\bchicago\b/i,
    };

    for (const [city, pattern] of Object.entries(cityPatterns)) {
      if (pattern.test(text)) {
        params.city = city;
        break;
      }
    }

    // Remote
    if (/\b(remote|work from home|wfh|remote only)\b/i.test(text)) {
      params.remote = true;
    }

    // Experience level
    if (/\b(entry|junior|entry-level|entry level)\b/i.test(text)) {
      params.experienceLevel = "entry";
    } else if (/\b(mid|mid-level|mid level|intermediate)\b/i.test(text)) {
      params.experienceLevel = "mid";
    } else if (/\b(senior|sr\.?)\b/i.test(text)) {
      params.experienceLevel = "senior";
    } else if (/\b(lead|principal|staff)\b/i.test(text)) {
      params.experienceLevel = "lead";
    } else if (/\b(executive|director|vp|c-level)\b/i.test(text)) {
      params.experienceLevel = "executive";
    }

    // Salary
    const salaryMatch = text.match(
      /\$?(\d+)k?\s*(?:-|to)\s*\$?(\d+)k?/i
    );
    if (salaryMatch) {
      const min = parseInt(salaryMatch[1]);
      const max = parseInt(salaryMatch[2]);
      params.salaryMin = min > 1000 ? min : min * 1000;
      params.salaryMax = max > 1000 ? max : max * 1000;
    } else {
      const singleSalaryMatch = text.match(
        /(?:at least|minimum|over|above)\s*\$?(\d+)k?/i
      );
      if (singleSalaryMatch) {
        const salary = parseInt(singleSalaryMatch[1]);
        params.salaryMin = salary > 1000 ? salary : salary * 1000;
      }
    }

    // Skills
    const skillKeywords = [
      "react",
      "vue",
      "angular",
      "typescript",
      "javascript",
      "python",
      "java",
      "go",
      "rust",
      "node",
      "aws",
      "gcp",
      "azure",
      "docker",
      "kubernetes",
      "graphql",
      "sql",
      "mongodb",
      "redis",
      "kafka",
    ];
    const foundSkills = skillKeywords.filter((skill) =>
      text.toLowerCase().includes(skill)
    );
    if (foundSkills.length > 0) {
      params.skills = foundSkills;
    }

    // Apply to all
    if (/apply\s*(to\s*)?(all|every|matching)/i.test(text)) {
      params.applyToAll = true;
    }

    // Match profile
    if (/match(ing)?\s*(my\s*)?profile/i.test(text)) {
      params.matchProfile = true;
    }

    return params;
  }

  /**
   * Generate a suggestion based on parsed intent and params
   */
  private generateSuggestion(
    intent: VoiceCommandIntent,
    params: VoiceCommandParams
  ): string {
    switch (intent) {
      case "apply":
        if (params.applyToAll) {
          return "I'll apply to all matching jobs for you";
        }
        return "Applying to this job";

      case "skip":
        return "Skipping this job";

      case "search": {
        const parts: string[] = [];
        if (params.jobTitle) parts.push(params.jobTitle);
        if (params.remote) parts.push("remote");
        parts.push("jobs");
        if (params.city) parts.push(`in ${params.city}`);
        else if (params.state) parts.push(`in ${params.state}`);
        else if (params.country) parts.push(`in ${params.country}`);
        return `Searching for ${parts.join(" ")}`;
      }

      case "filter": {
        const filterParts: string[] = [];
        if (params.remote) filterParts.push("remote");
        if (params.experienceLevel) filterParts.push(params.experienceLevel);
        if (params.salaryMin) filterParts.push(`$${params.salaryMin / 1000}k+`);
        return `Filtering by ${filterParts.join(", ") || "your criteria"}`;
      }

      case "undo":
        return "Undoing last action";

      case "next":
        return "Showing next job";

      case "details":
        return "Here are more details about this job";

      case "help":
        return "You can say: 'Search for frontend jobs in USA', 'Apply to this job', 'Skip', or 'Filter by remote'";

      default:
        return "I didn't understand that. Try saying 'Search for [job type] jobs in [location]'";
    }
  }
}

// Export singleton instance
export const voiceCommandParserService = new VoiceCommandParserService();
export default voiceCommandParserService;
