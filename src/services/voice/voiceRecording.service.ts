// Voice Recording Service - Using expo-av for audio capture
// Note: expo-av provides the full recording API with format constants

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

export interface RecordingConfig {
  maxDuration?: number; // in milliseconds, default 30 seconds
  onSilenceDetected?: () => void;
  onMeteringUpdate?: (level: number) => void;
  silenceThresholdMs?: number; // default 1500ms
}

export interface RecordingResult {
  success: boolean;
  uri?: string;
  duration?: number;
  error?: string;
  isSilent?: boolean; // True if no voice was detected during recording
}

// Recording options for high quality audio
const HIGH_QUALITY_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
  isMeteringEnabled: true,
};

class VoiceRecordingService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private isUnloaded = false;
  private startTime: number = 0;
  private maxDuration: number = 30000; // 30 seconds default
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private meteringIntervalId: ReturnType<typeof setInterval> | null = null;
  private silenceDuration: number = 0;
  private silenceThresholdMs: number = 1500; // 1.5s default for silence detection
  private onSilenceDetected: (() => void) | undefined;
  private onMeteringUpdate: ((level: number) => void) | undefined;
  private maxVolume: number = -160; // Track max volume to detect empty recordings

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting audio permissions:", error);
      return false;
    }
  }

  /**
   * Check if microphone permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking audio permissions:", error);
      return false;
    }
  }

  /**
   * Configure audio mode for recording
   */
  private async configureAudioMode(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }

  /**
   * Start recording audio
   */
  async startRecording(config?: RecordingConfig): Promise<boolean> {
    try {
      // Check permissions first
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.error("Microphone permission not granted");
          return false;
        }
      }

      // Stop any existing recording
      if (this.recording && this.isRecording) {
        await this.stopRecording();
      }

      // Configure audio mode
      await this.configureAudioMode();

      // Set max duration
      this.maxDuration = config?.maxDuration || 30000;

      // Create and prepare recording
      const { recording } =
        await Audio.Recording.createAsync(HIGH_QUALITY_OPTIONS);
      this.recording = recording;

      this.isRecording = true;
      this.isUnloaded = false;
      this.startTime = Date.now();
      this.onSilenceDetected = config?.onSilenceDetected;
      this.onMeteringUpdate = config?.onMeteringUpdate;
      this.silenceThresholdMs = config?.silenceThresholdMs || 1500;
      this.silenceDuration = 0;
      this.maxVolume = -160; // Reset max volume

      // Start VAD metering
      this.startMetering();

      // Auto-stop after max duration
      this.timeoutId = setTimeout(() => {
        if (this.isRecording) {
          console.log("Max recording duration reached, auto-stopping");
          this.stopRecording();
        }
      }, this.maxDuration);

      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stop recording and return the audio file URI
   */
  async stopRecording(): Promise<RecordingResult> {
    try {
      // Clear timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      // Clear metering
      if (this.meteringIntervalId) {
        clearInterval(this.meteringIntervalId);
        this.meteringIntervalId = null;
      }

      if (!this.recording || !this.isRecording) {
        return {
          success: false,
          error: "No active recording",
        };
      }

      const duration = Date.now() - this.startTime;
      this.isRecording = false;

      // Stop the recording (only if not already unloaded)
      if (!this.isUnloaded && this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.isUnloaded = true;
      }

      // Get the recording URI
      const uri = this.recording?.getURI();

      // Release the recording object to free up resources/mic
      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) {
        return {
          success: false,
          error: "Failed to get recording URI",
        };
      }

      // Verify the file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: "Recording file not found",
        };
      }

      return {
        success: true,
        uri,
        duration,
        isSilent: this.maxVolume < -25, // Consider silent if max volume never exceeded threshold
      };
    } catch (error) {
      console.error("Error stopping recording:", error);
      this.isRecording = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cancel current recording without saving
   */
  async cancelRecording(): Promise<void> {
    try {
      // Clear timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      if (this.recording) {
        // Only unload if not already unloaded
        if (!this.isUnloaded) {
          await this.recording.stopAndUnloadAsync();
          this.isUnloaded = true;
        }

        const uri = this.recording.getURI();

        // Delete the temporary file
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }

        this.recording = null;
      }
      this.isRecording = false;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error("Error canceling recording:", error);
      this.isRecording = false;
      this.recording = null;
      if (this.meteringIntervalId) {
        clearInterval(this.meteringIntervalId);
        this.meteringIntervalId = null;
      }
    }
  }

  /**
   * Get current recording status
   */
  getStatus(): { isRecording: boolean; duration: number } {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? Date.now() - this.startTime : 0,
    };
  }

  /**
   * Start metering for VAD
   */
  private startMetering() {
    // Clear any existing interval
    if (this.meteringIntervalId) {
      clearInterval(this.meteringIntervalId);
    }

    this.meteringIntervalId = setInterval(async () => {
      if (!this.recording || !this.isRecording) return;

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          // Metering: -160dB (silence) to 0dB (loud).
          // Human voice: ~ -15dB to 0dB.
          // Background noise: ~ -45dB to -30dB (based on user logs).
          // New Threshold: If level < -25dB, consider it silence.
          const isSilent = status.metering < -25;

          if (!isSilent) {
            // Update max volume if we detect something louder
            this.maxVolume = Math.max(this.maxVolume, status.metering);
          }

          // Calculate normalized level for UI visualization (0 to 1)
          // Map -60dB -> 0, 0dB -> 1
          if (this.onMeteringUpdate) {
            const normalizedLevel = Math.max(0, (status.metering + 60) / 60);
            this.onMeteringUpdate(normalizedLevel);
          }

          if (isSilent) {
            this.silenceDuration += 100; // 100ms interval
          } else {
            this.silenceDuration = 0;
          }

          if (
            this.silenceDuration >= this.silenceThresholdMs &&
            this.onSilenceDetected
          ) {
            console.log("Silence detected (VAD), auto-stopping");
            this.onSilenceDetected();
            // Clear interval to prevent multiple triggers
            if (this.meteringIntervalId) {
              clearInterval(this.meteringIntervalId);
              this.meteringIntervalId = null;
            }
          }
        }
      } catch (e) {
        // Ignore metering errors
      }
    }, 100);
  }

  /**
   * Get recording levels (for visualization)
   */
  async getRecordingLevels(): Promise<number> {
    if (!this.recording || !this.isRecording) {
      return 0;
    }

    try {
      const status = await this.recording.getStatusAsync();
      if (status.isRecording && status.metering !== undefined) {
        // Convert dB to 0-1 scale
        // Typical range is -160 to 0 dB
        const normalizedLevel = Math.max(0, (status.metering + 60) / 60);
        return Math.min(1, normalizedLevel);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Delete a recording file
   */
  async deleteRecording(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.error("Error deleting recording:", error);
    }
  }

  /**
   * Get file info for a recording
   */
  async getRecordingInfo(
    uri: string,
  ): Promise<{ size: number; exists: boolean } | null> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && !info.isDirectory) {
        return {
          size: info.size || 0,
          exists: true,
        };
      }
      return { size: 0, exists: false };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const voiceRecordingService = new VoiceRecordingService();
export default voiceRecordingService;
