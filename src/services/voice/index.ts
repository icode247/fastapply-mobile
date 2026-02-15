// Voice Services - Main Export

export { voiceRecordingService } from "./voiceRecording.service";
export { speechToTextService } from "./speechToText.service";
export { voiceCommandParserService } from "./voiceCommandParser.service";
export { jobMatcherService } from "./jobMatcher.service";
export { voiceCommandService } from "./voiceCommand.service";

// Scout Voice Assistant
export { scoutTTSService } from "./scoutTTS.service";
export { scoutAIService } from "./scoutAI.service";
export { wakeWordService } from "./wakeWord.service";

// Re-export types
export type {
  RecordingConfig,
  RecordingResult,
} from "./voiceRecording.service";
export type { TranscriptionOptions } from "./speechToText.service";
