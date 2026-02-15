// Scout TTS Service - OpenAI Text-to-Speech with caching

import { Audio } from "expo-av";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { logger } from "../../utils/logger";

const OPENAI_API_KEY =
  Constants.expoConfig?.extra?.openaiApiKey ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
  "";

const TTS_API_URL = "https://api.openai.com/v1/audio/speech";

// Cache directory for TTS audio
const CACHE_DIR = `${FileSystem.cacheDirectory}scout-tts/`;

// Pre-defined phrases with cache keys
const CACHED_PHRASES: Record<string, string> = {
  hmm: "Hmmm...",
  got_it: "Got it!",
  on_it: "On it!",
  sorry: "Sorry, I need internet for that.",
  no_understand: "Sorry, I didn't catch that.",
};

class ScoutTTSService {
  private apiKey: string;
  private currentSound: Audio.Sound | null = null;
  private abortController: AbortController | null = null;
  private initialized = false;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    if (this.initialized) return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      this.initialized = true;
    } catch (error) {
      logger.error("Failed to create TTS cache directory:", error);
    }
  }

  /**
   * Get cache file path for a key
   */
  private getCachePath(key: string): string {
    return `${CACHE_DIR}${key}.mp3`;
  }

  /**
   * Check if a cached phrase exists on disk
   */
  private async isCached(key: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(this.getCachePath(key));
      return info.exists;
    } catch {
      return false;
    }
  }

  /**
   * Pre-generate and cache common phrases (call at app startup)
   */
  async warmupCache(): Promise<void> {
    if (!this.apiKey) return;
    await this.ensureCacheDir();

    for (const [key, text] of Object.entries(CACHED_PHRASES)) {
      const cached = await this.isCached(key);
      if (!cached) {
        try {
          await this.generateAndCache(key, text);
          logger.debug(`Scout TTS: cached phrase "${key}"`);
        } catch (error) {
          logger.warn(`Scout TTS: failed to cache phrase "${key}":`, error);
        }
      }
    }
  }

  /**
   * Generate TTS audio and save to cache
   */
  private async generateAndCache(key: string, text: string): Promise<string> {
    const path = this.getCachePath(key);

    const response = await fetch(TTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "nova",
        input: text,
        speed: 1.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    // RN-compatible: read response as blob, then convert to base64 via FileReader
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // result is "data:audio/mpeg;base64,XXXX..."
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(",")[1];
        if (base64Data) {
          resolve(base64Data);
        } else {
          reject(new Error("Failed to extract base64 from blob"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return path;
  }

  /**
   * Play a pre-cached phrase by key (instant playback)
   */
  async speakCached(key: string): Promise<void> {
    await this.ensureCacheDir();
    const path = this.getCachePath(key);
    const cached = await this.isCached(key);

    if (cached) {
      await this.playAudioFile(path);
    } else if (this.apiKey) {
      // Generate on the fly and cache for next time
      const text = CACHED_PHRASES[key];
      if (text) {
        try {
          const generatedPath = await this.generateAndCache(key, text);
          await this.playAudioFile(generatedPath);
        } catch (error) {
          logger.warn("Scout TTS speakCached error:", error);
        }
      }
    }
  }

  /**
   * Speak arbitrary text (generates TTS on the fly)
   */
  async speak(text: string): Promise<void> {
    if (!this.apiKey) {
      logger.warn("Scout TTS: no API key configured");
      return;
    }

    this.abortController = new AbortController();

    try {
      await this.ensureCacheDir();

      // Use a hash of the text as cache key
      const key = `dynamic_${this.simpleHash(text)}`;
      const cached = await this.isCached(key);

      if (cached) {
        await this.playAudioFile(this.getCachePath(key));
        return;
      }

      const path = await this.generateAndCache(key, text);

      // Check if aborted while generating
      if (this.abortController?.signal.aborted) return;

      await this.playAudioFile(path);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      logger.error("Scout TTS speak error:", error);
    }
  }

  /**
   * Play an audio file using expo-av
   */
  private async playAudioFile(uri: string): Promise<void> {
    // Stop any currently playing sound
    await this.stopCurrentSound();

    try {
      // Configure audio for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync({ uri });
      this.currentSound = sound;

      // Wait for playback to finish
      return new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            this.currentSound = null;
            resolve();
          }
        });
        sound.playAsync().catch(() => {
          this.currentSound = null;
          resolve();
        });
      });
    } catch (error) {
      logger.error("Scout TTS playback error:", error);
    }
  }

  /**
   * Stop current playback and cancel any pending generation
   */
  async stop(): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
    await this.stopCurrentSound();
  }

  /**
   * Stop the currently playing sound
   */
  private async stopCurrentSound(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch {
        // Ignore errors during cleanup
      }
      this.currentSound = null;
    }
  }

  /**
   * Simple hash for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

export const scoutTTSService = new ScoutTTSService();
