// Voice Command Service - Orchestrates the entire voice command flow

import { NormalizedJob } from "../../types/job.types";
import { JobProfile } from "../../types/profile.types";
import {
  ParsedVoiceCommand,
  VoiceCommandResult,
  VoiceSessionState,
  JobMatchResult,
} from "../../types/voice.types";
import { voiceRecordingService } from "./voiceRecording.service";
import { speechToTextService } from "./speechToText.service";
import { voiceCommandParserService } from "./voiceCommandParser.service";
import { jobMatcherService } from "./jobMatcher.service";
import { jobService } from "../job.service";

type VoiceCommandCallback = (result: VoiceCommandResult) => void;

class VoiceCommandService {
  private sessionState: VoiceSessionState;
  private currentJobs: NormalizedJob[] = [];
  private currentJobIndex: number = 0;
  private userProfile: JobProfile | null = null;
  private onCommandCallback: VoiceCommandCallback | null = null;

  constructor() {
    this.sessionState = {
      isActive: false,
      recording: {
        isRecording: false,
        isProcessing: false,
        error: null,
        duration: 0,
      },
      sessionId: this.generateSessionId(),
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set the callback for command results
   */
  setCommandCallback(callback: VoiceCommandCallback): void {
    this.onCommandCallback = callback;
  }

  /**
   * Set the current jobs list
   */
  setJobs(jobs: NormalizedJob[]): void {
    this.currentJobs = jobs;
  }

  /**
   * Set current job index (for context)
   */
  setCurrentJobIndex(index: number): void {
    this.currentJobIndex = index;
  }

  /**
   * Set user profile for matching
   */
  setUserProfile(profile: JobProfile | null): void {
    this.userProfile = profile;
  }

  /**
   * Get current session state
   */
  getSessionState(): VoiceSessionState {
    return { ...this.sessionState };
  }

  /**
   * Check if services are configured
   */
  isConfigured(): boolean {
    return (
      speechToTextService.isConfigured() &&
      voiceCommandParserService.isConfigured()
    );
  }

  /**
   * Start voice command session
   */
  async startListening(): Promise<boolean> {
    if (this.sessionState.recording.isRecording) {
      console.warn("Already recording");
      return false;
    }

    // Request permissions
    const hasPermission = await voiceRecordingService.hasPermissions();
    if (!hasPermission) {
      const granted = await voiceRecordingService.requestPermissions();
      if (!granted) {
        this.sessionState.recording.error = "Microphone permission denied";
        return false;
      }
    }

    // Start recording
    const started = await voiceRecordingService.startRecording({
      maxDuration: 15000, // 15 seconds max for voice commands
    });

    if (started) {
      this.sessionState.isActive = true;
      this.sessionState.recording.isRecording = true;
      this.sessionState.recording.error = null;
      return true;
    }

    this.sessionState.recording.error = "Failed to start recording";
    return false;
  }

  /**
   * Stop listening and process the command
   */
  async stopListening(): Promise<VoiceCommandResult> {
    if (!this.sessionState.recording.isRecording) {
      return {
        success: false,
        command: {
          intent: "unknown",
          params: {},
          confidence: 0,
          rawText: "",
        },
        error: "Not recording",
      };
    }

    // Stop recording
    const recordingResult = await voiceRecordingService.stopRecording();
    this.sessionState.recording.isRecording = false;

    if (!recordingResult.success || !recordingResult.uri) {
      return {
        success: false,
        command: {
          intent: "unknown",
          params: {},
          confidence: 0,
          rawText: "",
        },
        error: recordingResult.error || "Recording failed",
      };
    }

    // Process the recording
    this.sessionState.recording.isProcessing = true;

    try {
      // Transcribe audio
      const transcription = await speechToTextService.transcribeJobCommand(
        recordingResult.uri
      );

      if (!transcription.text) {
        return {
          success: false,
          command: {
            intent: "unknown",
            params: {},
            confidence: 0,
            rawText: "",
          },
          error: "Could not understand audio",
        };
      }

      // Parse command
      const parsedCommand = await voiceCommandParserService.parseCommand(
        transcription.text
      );

      this.sessionState.lastCommand = parsedCommand;

      // Execute command
      const result = await this.executeCommand(parsedCommand);

      this.sessionState.lastResult = result;
      this.sessionState.recording.isProcessing = false;

      // Notify callback
      if (this.onCommandCallback) {
        this.onCommandCallback(result);
      }

      // Clean up recording file
      await voiceRecordingService.deleteRecording(recordingResult.uri);

      return result;
    } catch (error) {
      this.sessionState.recording.isProcessing = false;
      const errorMessage =
        error instanceof Error ? error.message : "Processing failed";
      return {
        success: false,
        command: {
          intent: "unknown",
          params: {},
          confidence: 0,
          rawText: "",
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Cancel current recording
   */
  async cancelListening(): Promise<void> {
    await voiceRecordingService.cancelRecording();
    this.sessionState.recording.isRecording = false;
    this.sessionState.recording.isProcessing = false;
    this.sessionState.isActive = false;
  }

  /**
   * Execute a parsed command
   */
  private async executeCommand(
    command: ParsedVoiceCommand
  ): Promise<VoiceCommandResult> {
    switch (command.intent) {
      case "apply":
        return this.handleApplyCommand(command);

      case "skip":
        return this.handleSkipCommand(command);

      case "search":
        return this.handleSearchCommand(command);

      case "filter":
        return this.handleFilterCommand(command);

      case "undo":
        return this.handleUndoCommand(command);

      case "next":
        return this.handleNextCommand(command);

      case "details":
        return this.handleDetailsCommand(command);

      case "help":
        return this.handleHelpCommand(command);

      default:
        return {
          success: false,
          command,
          error: command.suggestion || "Command not understood",
        };
    }
  }

  /**
   * Handle apply command
   */
  private async handleApplyCommand(
    command: ParsedVoiceCommand
  ): Promise<VoiceCommandResult> {
    if (command.params.applyToAll && command.params.matchProfile) {
      // Apply to all matching jobs
      if (!this.userProfile) {
        return {
          success: false,
          command,
          error: "No profile selected for matching",
        };
      }

      const matchingJobs = jobMatcherService.getAutoApplyJobs(
        this.currentJobs,
        this.userProfile
      );

      return {
        success: true,
        command,
        executedAction: "apply_all",
        matchedJobs: matchingJobs.length,
        appliedJobs: matchingJobs.length, // In production, would be actual applied count
      };
    }

    // Apply to current job
    return {
      success: true,
      command,
      executedAction: "apply",
      appliedJobs: 1,
    };
  }

  /**
   * Handle skip command
   */
  private handleSkipCommand(
    command: ParsedVoiceCommand
  ): VoiceCommandResult {
    return {
      success: true,
      command,
      executedAction: "skip",
    };
  }

  /**
   * Handle search command
   */
  private handleSearchCommand(
    command: ParsedVoiceCommand
  ): VoiceCommandResult {
    const searchResults = jobService.searchByVoiceParams(command.params);

    // If profile-based matching is requested
    let matchedResults: Array<{ job: NormalizedJob; match: JobMatchResult }> = [];
    if (command.params.matchProfile && this.userProfile) {
      matchedResults = jobMatcherService.matchByVoiceParams(
        searchResults,
        command.params,
        this.userProfile
      );
    }

    return {
      success: true,
      command,
      executedAction: "search",
      matchedJobs: searchResults.length,
    };
  }

  /**
   * Handle filter command
   */
  private handleFilterCommand(
    command: ParsedVoiceCommand
  ): VoiceCommandResult {
    // Filter current jobs
    const filteredJobs = this.filterJobsByParams(command.params);

    return {
      success: true,
      command,
      executedAction: "filter",
      matchedJobs: filteredJobs.length,
    };
  }

  /**
   * Handle undo command
   */
  private handleUndoCommand(command: ParsedVoiceCommand): VoiceCommandResult {
    return {
      success: true,
      command,
      executedAction: "undo",
    };
  }

  /**
   * Handle next command
   */
  private handleNextCommand(command: ParsedVoiceCommand): VoiceCommandResult {
    return {
      success: true,
      command,
      executedAction: "next",
    };
  }

  /**
   * Handle details command
   */
  private handleDetailsCommand(
    command: ParsedVoiceCommand
  ): VoiceCommandResult {
    const currentJob = this.currentJobs[this.currentJobIndex];
    if (!currentJob) {
      return {
        success: false,
        command,
        error: "No job selected",
      };
    }

    return {
      success: true,
      command,
      executedAction: "details",
    };
  }

  /**
   * Handle help command
   */
  private handleHelpCommand(command: ParsedVoiceCommand): VoiceCommandResult {
    return {
      success: true,
      command,
      executedAction: "help",
    };
  }

  /**
   * Filter jobs by voice command params
   */
  private filterJobsByParams(params: typeof ParsedVoiceCommand.prototype.params): NormalizedJob[] {
    let filtered = [...this.currentJobs];

    if (params.remote) {
      filtered = filtered.filter(
        (job) => job.isRemote || job.workMode.toLowerCase() === "remote"
      );
    }

    if (params.country) {
      const country = params.country.toLowerCase();
      filtered = filtered.filter((job) =>
        job.locations.some((loc) =>
          loc.country?.toLowerCase().includes(country)
        )
      );
    }

    if (params.experienceLevel) {
      const level = params.experienceLevel.toLowerCase();
      filtered = filtered.filter((job) =>
        job.experience.toLowerCase().includes(level)
      );
    }

    if (params.salaryMin) {
      filtered = filtered.filter(
        (job) => !job.salaryMax || job.salaryMax >= params.salaryMin!
      );
    }

    return filtered;
  }

  /**
   * Process text command directly (for testing)
   */
  async processTextCommand(text: string): Promise<VoiceCommandResult> {
    this.sessionState.recording.isProcessing = true;

    try {
      const parsedCommand = await voiceCommandParserService.parseCommand(text);
      this.sessionState.lastCommand = parsedCommand;

      const result = await this.executeCommand(parsedCommand);
      this.sessionState.lastResult = result;
      this.sessionState.recording.isProcessing = false;

      if (this.onCommandCallback) {
        this.onCommandCallback(result);
      }

      return result;
    } catch (error) {
      this.sessionState.recording.isProcessing = false;
      return {
        success: false,
        command: {
          intent: "unknown",
          params: {},
          confidence: 0,
          rawText: text,
        },
        error: error instanceof Error ? error.message : "Processing failed",
      };
    }
  }
}

// Export singleton instance
export const voiceCommandService = new VoiceCommandService();
export default voiceCommandService;
