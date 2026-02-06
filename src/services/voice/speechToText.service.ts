// Speech-to-Text Service - Using OpenAI Whisper API

import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { TranscriptionResult } from "../../types/voice.types";
import { logger } from "../../utils/logger";

// Get API key from environment variables
const OPENAI_API_KEY =
  Constants.expoConfig?.extra?.openaiApiKey ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
  "";

const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";

export interface TranscriptionOptions {
  language?: string; // ISO-639-1 language code (e.g., "en")
  prompt?: string; // Optional prompt to guide the model
  temperature?: number; // 0-1, higher = more creative
}

class SpeechToTextService {
  private apiKey: string;

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
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribe(
    audioUri: string,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    if (!this.isConfigured()) {
      logger.error("OpenAI API key not configured");
      return {
        text: "",
        confidence: 0,
      };
    }

    try {
      // Read the audio file
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error("Audio file not found");
      }

      // Determine the file extension
      const extension = audioUri.split(".").pop()?.toLowerCase() || "m4a";
      const mimeType = this.getMimeType(extension);

      // Create form data for the API request
      const formData = new FormData();

      // Append file using React Native's FormData pattern
      formData.append("file", {
        uri: audioUri,
        name: `audio.${extension}`,
        type: mimeType,
      } as any);

      formData.append("model", "whisper-1");

      // Add optional parameters
      if (options?.language) {
        formData.append("language", options.language);
      }
      if (options?.prompt) {
        formData.append("prompt", options.prompt);
      }
      if (options?.temperature !== undefined) {
        formData.append("temperature", options.temperature.toString());
      }

      // Make API request
      const response = await fetch(WHISPER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API error: ${response.status}`,
        );
      }

      const data = await response.json();

      return {
        text: data.text || "",
        confidence: 0.95, // Whisper doesn't return confidence scores, assume high
        language: options?.language || "en",
      };
    } catch (error) {
      logger.error("Transcription error:", error);
      return {
        text: "",
        confidence: 0,
      };
    }
  }

  /**
   * Transcribe audio with job-search specific prompt
   * This helps Whisper understand job-related terminology
   */
  async transcribeJobCommand(audioUri: string): Promise<TranscriptionResult> {
    const jobSearchPrompt = `This is a voice command for job searching.
    Common phrases include: search for, find, apply to, show me, filter by,
    looking for, frontend, backend, software engineer, remote, USA,
    United States, salary, experience, senior, junior, full-time, part-time.`;

    return this.transcribe(audioUri, {
      language: "en",
      prompt: jobSearchPrompt,
      temperature: 0.2, // Lower temperature for more deterministic results
    });
  }

  /**
   * Get MIME type for audio file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      m4a: "audio/m4a",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      webm: "audio/webm",
      mp4: "audio/mp4",
      mpeg: "audio/mpeg",
      mpga: "audio/mpeg",
      ogg: "audio/ogg",
      flac: "audio/flac",
    };
    return mimeTypes[extension] || "audio/m4a";
  }
}

// Export singleton instance
export const speechToTextService = new SpeechToTextService();
export default speechToTextService;
