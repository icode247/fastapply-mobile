import * as DocumentPicker from "expo-document-picker";
import { useCallback, useState } from "react";
import { APP_CONFIG } from "../constants/api";
import { resumeParserService } from "../services";
import { getApiErrorMessage } from "../services/api";
import { useOnboardingStore } from "../stores";

export const useResumeUpload = () => {
  const {
    resumeFile,
    parsedResume,
    isParsingResume,
    parseError,
    setResumeFile,
    setIsParsingResume,
    setParseError,
    prefillFromResume,
  } = useOnboardingStore();

  const [uploadProgress, setUploadProgress] = useState(0);

  const pickResume = useCallback(async () => {
    try {
      setParseError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: [...APP_CONFIG.SUPPORTED_RESUME_TYPES],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return { success: false, canceled: true };
      }

      const file = result.assets[0];

      // Check file size
      if (
        file.size &&
        file.size > APP_CONFIG.MAX_RESUME_SIZE_MB * 1024 * 1024
      ) {
        setParseError(
          `File size must be less than ${APP_CONFIG.MAX_RESUME_SIZE_MB}MB`
        );
        return { success: false, error: "File too large" };
      }

      const resumeFile = {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/pdf",
        file: (file as any).file, // Capture the browser File object for Web
      };

      setResumeFile(resumeFile);
      return { success: true, file: resumeFile };
    } catch (error) {
      const message = getApiErrorMessage(error);
      setParseError(message);
      return { success: false, error: message };
    }
  }, [setResumeFile, setParseError]);

  const parseResume = useCallback(
    async (fileOverride?: any) => {
      const fileToParse = fileOverride || resumeFile;

      if (!fileToParse) {
        setParseError("No resume file selected");
        return { success: false, error: "No file" };
      }

      try {
        setIsParsingResume(true);
        setParseError(null);
        setUploadProgress(0);

        const response = await resumeParserService.parseResume(
          fileToParse,
          (progress) => setUploadProgress(progress)
        );

        if (response.success && response.data) {
          prefillFromResume(response.data);
          return { success: true, data: response.data };
        } else {
          const error = response.error || "Failed to parse resume";
          setParseError(error);
          return { success: false, error };
        }
      } catch (error) {
        const message = getApiErrorMessage(error);
        setParseError(message);
        return { success: false, error: message };
      } finally {
        setIsParsingResume(false);
      }
    },
    [resumeFile, setIsParsingResume, setParseError, prefillFromResume]
  );

  const pickAndParseResume = useCallback(async () => {
    const pickResult = await pickResume();
    if (!pickResult.success || !pickResult.file) {
      return pickResult;
    }

    // Auto-parse after successful pick, passing the fresh file to avoid stale state
    return parseResume(pickResult.file);
  }, [pickResume, parseResume]);

  const clearResume = useCallback(() => {
    setResumeFile(null);
    setParseError(null);
    setUploadProgress(0);
  }, [setResumeFile, setParseError]);

  return {
    // State
    resumeFile,
    parsedResume,
    isParsingResume,
    parseError,
    uploadProgress,

    // Actions
    pickResume,
    parseResume,
    pickAndParseResume,
    clearResume,
  };
};

export default useResumeUpload;
