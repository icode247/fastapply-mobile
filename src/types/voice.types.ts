// Voice Command Types

export type VoiceCommandIntent =
  | "apply"
  | "skip"
  | "search"
  | "filter"
  | "undo"
  | "next"
  | "details"
  | "help"
  | "unknown";

export interface VoiceCommandParams {
  // Search/Filter params
  jobTitle?: string;
  jobType?: string[];
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  remote?: boolean;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  company?: string;
  skills?: string[];
  // Action params
  applyToAll?: boolean;
  matchProfile?: boolean;
}

export interface ParsedVoiceCommand {
  intent: VoiceCommandIntent;
  params: VoiceCommandParams;
  confidence: number;
  rawText: string;
  suggestion?: string;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  duration: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
}

export interface VoiceCommandResult {
  success: boolean;
  command: ParsedVoiceCommand;
  executedAction?: string;
  matchedJobs?: number;
  appliedJobs?: number;
  error?: string;
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  matchReasons: string[];
  shouldApply: boolean;
}

export interface VoiceSessionState {
  isActive: boolean;
  recording: VoiceRecordingState;
  lastCommand?: ParsedVoiceCommand;
  lastResult?: VoiceCommandResult;
  sessionId: string;
}

// OpenAI API Types
export interface WhisperTranscriptionResponse {
  text: string;
}

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GPTIntentResponse {
  intent: VoiceCommandIntent;
  params: VoiceCommandParams;
  confidence: number;
  suggestion?: string;
}
