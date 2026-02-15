// Wake Word Service - "Hey Scout" detection via Porcupine
// Graceful fallback: if Porcupine is not installed or no key, it just doesn't run.

import { logger } from "../../utils/logger";

const WAKE_WORD_ENABLED = process.env.EXPO_PUBLIC_WAKE_WORD_ENABLED === "true";
const PICOVOICE_ACCESS_KEY = process.env.EXPO_PUBLIC_PICOVOICE_ACCESS_KEY || "";

type WakeWordCallback = () => void;

class WakeWordService {
  private callback: WakeWordCallback | null = null;
  private isRunning = false;
  private porcupineManager: any = null;

  /**
   * Whether wake word detection is available and enabled
   */
  isEnabled(): boolean {
    return WAKE_WORD_ENABLED && !!PICOVOICE_ACCESS_KEY;
  }

  /**
   * Register callback for wake word detection
   */
  onWakeWordDetected(callback: WakeWordCallback): void {
    this.callback = callback;
  }

  /**
   * Start listening for "Hey Scout"
   */
  async start(): Promise<boolean> {
    if (!this.isEnabled()) {
      logger.debug("Wake word: disabled or no access key");
      return false;
    }

    if (this.isRunning) return true;

    try {
      // Dynamic import so the app doesn't crash if porcupine isn't installed
      const PorcupineModule = await import(
        // @ts-expect-error - package may not be installed
        "@picovoice/porcupine-react-native"
      ).catch(() => null);

      if (!PorcupineModule) {
        logger.warn("Wake word: @picovoice/porcupine-react-native not installed");
        return false;
      }

      const { PorcupineManager } = PorcupineModule;

      // Use built-in "hey google" as dev fallback, or custom .ppn for production
      // In production, use a custom "Hey Scout" keyword file
      this.porcupineManager = await PorcupineManager.fromBuiltInKeywords(
        PICOVOICE_ACCESS_KEY,
        ["hey google"], // Fallback built-in keyword for dev; replace with custom .ppn in prod
        (keywordIndex: number) => {
          logger.debug("Wake word detected! Index:", keywordIndex);
          this.callback?.();
        },
        (error: Error) => {
          logger.error("Wake word error:", error);
        },
      );

      await this.porcupineManager.start();
      this.isRunning = true;
      logger.debug("Wake word: listening started");
      return true;
    } catch (error) {
      logger.warn("Wake word: failed to start:", error);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Stop listening
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.porcupineManager) return;

    try {
      await this.porcupineManager.stop();
      await this.porcupineManager.delete();
      this.porcupineManager = null;
      this.isRunning = false;
      logger.debug("Wake word: stopped");
    } catch (error) {
      logger.error("Wake word: stop error:", error);
      this.isRunning = false;
    }
  }

  /**
   * Get current running state
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const wakeWordService = new WakeWordService();
