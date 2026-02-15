import { create } from "zustand";
import {
  DEFAULT_JOB_PREFERENCES,
  JobPreferencesFormValues,
} from "../components/feed/JobPreferencesForm";
import { EducationItem, ExperienceItem, ParsedResume } from "../types";

interface OnboardingState {
  // Current step
  currentStep: number;
  totalSteps: number;

  // Resume data
  resumeFile: {
    uri: string;
    name: string;
    type: string;
    file?: any;
  } | null;
  parsedResume: ParsedResume | null;
  isParsingResume: boolean;
  parseError: string | null;

  // Form data (collected during onboarding)
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phoneCountryCode: string;
  headline: string;
  summary: string;
  currentCity: string;
  state: string;
  country: string;
  timezone: string;
  linkedinURL: string;
  githubURL: string;
  website: string;

  // Professional info
  skills: string[];
  yearsOfExperience: number;
  experience: ExperienceItem[];
  education: EducationItem[];

  // Job Preferences (same as job filters modal)
  jobPreferences: JobPreferencesFormValues;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setResumeFile: (
    file: {
      uri: string;
      name: string;
      type: string;
      file?: any;
    } | null
  ) => void;
  setParsedResume: (data: ParsedResume | null) => void;
  setIsParsingResume: (loading: boolean) => void;
  setParseError: (error: string | null) => void;

  updatePersonalInfo: (data: Partial<OnboardingState>) => void;
  updateExperience: (experience: ExperienceItem[]) => void;
  updateEducation: (education: EducationItem[]) => void;
  updateSkills: (skills: string[]) => void;
  updateJobPreferences: (preferences: JobPreferencesFormValues) => void;
  resetJobPreferences: () => void;

  prefillFromResume: (data: ParsedResume) => void;
  reset: () => void;

  getProfileData: () => Partial<ParsedResume>;
}

const initialState = {
  currentStep: 0,
  totalSteps: 4,

  resumeFile: null,
  parsedResume: null,
  isParsingResume: false,
  parseError: null,

  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  phoneCountryCode: "+1",
  headline: "",
  summary: "",
  currentCity: "",
  state: "",
  country: "",
  timezone: "",
  linkedinURL: "",
  githubURL: "",
  website: "",

  skills: [],
  yearsOfExperience: 0,
  experience: [],
  education: [],

  jobPreferences: { ...DEFAULT_JOB_PREFERENCES },
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  setResumeFile: (file) => set({ resumeFile: file }),
  setParsedResume: (data) => set({ parsedResume: data }),
  setIsParsingResume: (loading) => set({ isParsingResume: loading }),
  setParseError: (error) => set({ parseError: error }),

  updatePersonalInfo: (data) => set((state) => ({ ...state, ...data })),

  updateExperience: (experience) => set({ experience }),

  updateEducation: (education) => set({ education }),

  updateSkills: (skills) => set({ skills }),

  updateJobPreferences: (jobPreferences) => set({ jobPreferences }),

  resetJobPreferences: () =>
    set({ jobPreferences: { ...DEFAULT_JOB_PREFERENCES } }),

  prefillFromResume: (data) => {
    set({
      parsedResume: data,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      phoneNumber: data.phoneNumber || "",
      phoneCountryCode: data.phoneCountryCode || "+1",
      headline: data.headline || "",
      summary: data.summary || "",
      currentCity: data.currentCity || "",
      state: data.state || "",
      country: data.country || "",
      timezone: data.timezone || "",
      linkedinURL: data.linkedinURL || "",
      githubURL: data.githubURL || "",
      website: data.website || "",
      skills: data.skills || [],
      yearsOfExperience: data.yearsOfExperience || 0,
      experience: data.experience || [],
      education: data.education || [],
    });
  },

  reset: () => set(initialState),

  getProfileData: () => {
    const state = get();
    // Note: jobPreferences are stored locally and used for job filtering
    // They are not sent to the backend profile API
    return {
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      phoneNumber: state.phoneNumber,
      phoneCountryCode: state.phoneCountryCode,
      headline: state.headline,
      summary: state.summary,
      currentCity: state.currentCity,
      state: state.state,
      country: state.country,
      timezone: state.timezone,
      linkedinURL: state.linkedinURL,
      githubURL: state.githubURL,
      website: state.website,
      skills: state.skills,
      yearsOfExperience: state.yearsOfExperience,
      experience: state.experience,
      education: state.education,
    };
  },
}));

export default useOnboardingStore;
