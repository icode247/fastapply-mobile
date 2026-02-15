// Wake Word Service - "Hey Scout" detection
// Supports two providers via EXPO_PUBLIC_WAKE_WORD_PROVIDER:
//   "native"    — OS speech recognition (free, no key needed, good for dev/testing)
//   "porcupine" — Picovoice Porcupine (low-power, on-device, needs access key, for production)
//
// EXPO_PUBLIC_WAKE_WORD_ENABLED must be "true" to activate either provider.

import { logger } from "../../utils/logger";

const WAKE_WORD_ENABLED = process.env.EXPO_PUBLIC_WAKE_WORD_ENABLED === "true";
const WAKE_WORD_PROVIDER =
  (process.env.EXPO_PUBLIC_WAKE_WORD_PROVIDER as "native" | "porcupine") || "native";

export type WakeWordCallback = () => void;

/** Common interface both providers implement */
export interface WakeWordProvider {
  start(callback: WakeWordCallback): Promise<boolean>;
  stop(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Native Provider — uses @react-native-voice/voice (OS speech recognition)
// Continuously listens and triggers when "hey scout" appears in transcript.
// Higher battery usage than Porcupine but requires zero API keys.
// ---------------------------------------------------------------------------
class NativeWakeWordProvider implements WakeWordProvider {
  private voiceModule: any = null;
  private callback: WakeWordCallback | null = null;
  private isListening = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  async start(callback: WakeWordCallback): Promise<boolean> {
    this.callback = callback;

    try {
      const Voice = await import("@react-native-voice/voice").catch(() => null);
      if (!Voice?.default) {
        logger.warn("Wake word native: @react-native-voice/voice not installed");
        return false;
      }

      this.voiceModule = Voice.default;

      // Wire up speech events
      this.voiceModule.onSpeechResults = (event: any) => {
        const results: string[] = event?.value || [];
        for (const transcript of results) {
          const lower = transcript.toLowerCase();
          if (
            lower.includes("hey scout") ||
            lower.includes("a scout") ||
            lower.includes("hey scow")
          ) {
            logger.debug("Wake word native: detected in transcript:", transcript);
            this.callback?.();
            // Restart listening after a cooldown to avoid double-triggers
            this.scheduleRestart(2000);
            return;
          }
        }
      };

      this.voiceModule.onSpeechEnd = () => {
        // Speech session ended naturally — restart to keep listening
        if (this.isListening) {
          this.scheduleRestart(300);
        }
      };

      this.voiceModule.onSpeechError = (error: any) => {
        // Errors like "no speech detected" are normal — just restart
        const code = error?.error?.code || error?.error?.message || "";
        if (typeof code === "string" && code.includes("7")) {
          // Error 7 = no match — expected, restart silently
        } else {
          logger.debug("Wake word native: speech error:", code);
        }
        if (this.isListening) {
          this.scheduleRestart(500);
        }
      };

      await this.voiceModule.start("en-US");
      this.isListening = true;
      logger.debug("Wake word native: listening started");
      return true;
    } catch (error) {
      logger.warn("Wake word native: failed to start:", error);
      return false;
    }
  }

  async stop(): Promise<void> {
    this.isListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    try {
      if (this.voiceModule) {
        this.voiceModule.onSpeechResults = null;
        this.voiceModule.onSpeechEnd = null;
        this.voiceModule.onSpeechError = null;
        await this.voiceModule.stop();
        await this.voiceModule.destroy();
        this.voiceModule = null;
      }
      logger.debug("Wake word native: stopped");
    } catch (error) {
      logger.error("Wake word native: stop error:", error);
    }
  }

  private scheduleRestart(delayMs: number) {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(async () => {
      if (!this.isListening || !this.voiceModule) return;
      try {
        await this.voiceModule.start("en-US");
      } catch {
        // Will retry on next error cycle
      }
    }, delayMs);
  }
}

// ---------------------------------------------------------------------------
// Porcupine Provider — Picovoice on-device wake word (production)
// Low-power, runs entirely on-device, needs EXPO_PUBLIC_PICOVOICE_ACCESS_KEY.
// ---------------------------------------------------------------------------
const PICOVOICE_ACCESS_KEY = process.env.EXPO_PUBLIC_PICOVOICE_ACCESS_KEY || "";

class PorcupineWakeWordProvider implements WakeWordProvider {
  private manager: any = null;

  async start(callback: WakeWordCallback): Promise<boolean> {
    if (!PICOVOICE_ACCESS_KEY) {
      logger.warn("Wake word porcupine: no access key configured");
      return false;
    }

    try {
      const PorcupineModule = await import(
        // @ts-expect-error - package may not be installed
        "@picovoice/porcupine-react-native"
      ).catch(() => null);

      if (!PorcupineModule) {
        logger.warn("Wake word porcupine: package not installed");
        return false;
      }

      const { PorcupineManager } = PorcupineModule;

      this.manager = await PorcupineManager.fromBuiltInKeywords(
        PICOVOICE_ACCESS_KEY,
        ["hey google"], // Replace with custom "Hey Scout" .ppn in production
        (keywordIndex: number) => {
          logger.debug("Wake word porcupine: detected! Index:", keywordIndex);
          callback();
        },
        (error: Error) => {
          logger.error("Wake word porcupine: error:", error);
        },
      );

      await this.manager.start();
      logger.debug("Wake word porcupine: listening started");
      return true;
    } catch (error) {
      logger.warn("Wake word porcupine: failed to start:", error);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (!this.manager) return;
    try {
      await this.manager.stop();
      await this.manager.delete();
      this.manager = null;
      logger.debug("Wake word porcupine: stopped");
    } catch (error) {
      logger.error("Wake word porcupine: stop error:", error);
    }
  }
}

// ---------------------------------------------------------------------------
// Main Wake Word Service — picks provider based on env
// ---------------------------------------------------------------------------
class WakeWordService {
  private provider: WakeWordProvider | null = null;
  private callback: WakeWordCallback | null = null;
  private running = false;

  isEnabled(): boolean {
    return WAKE_WORD_ENABLED;
  }

  getProvider(): string {
    return WAKE_WORD_PROVIDER;
  }

  onWakeWordDetected(callback: WakeWordCallback): void {
    this.callback = callback;
  }

  async start(): Promise<boolean> {
    if (!this.isEnabled() || !this.callback) {
      logger.debug(`Wake word: disabled (enabled=${WAKE_WORD_ENABLED})`);
      return false;
    }

    if (this.running) return true;

    // Create provider based on env
    this.provider =
      WAKE_WORD_PROVIDER === "porcupine"
        ? new PorcupineWakeWordProvider()
        : new NativeWakeWordProvider();

    logger.debug(`Wake word: using "${WAKE_WORD_PROVIDER}" provider`);

    const started = await this.provider.start(this.callback);
    this.running = started;
    return started;
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.provider) {
      await this.provider.stop();
      this.provider = null;
    }
  }

  getIsRunning(): boolean {
    return this.running;
  }
}

export const wakeWordService = new WakeWordService();
