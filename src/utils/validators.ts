import { z } from "zod";

// Email validation
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

// Password validation (if needed in future)
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Name validation
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters");

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
  .optional()
  .or(z.literal(""));

// URL validation
export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .optional()
  .or(z.literal(""));

// Registration form schema
export const registerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  referralCode: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

// Sign in form schema
export const signInFormSchema = z.object({
  email: emailSchema,
});

export type SignInFormData = z.infer<typeof signInFormSchema>;

// Job profile form schemas
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: emailSchema,
  phoneNumber: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  headline: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  currentCity: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipcode: z.string().optional(),
  linkedinURL: urlSchema,
  githubURL: urlSchema,
  website: urlSchema,
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

export const experienceItemSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  current: z.boolean().optional(),
});

export type ExperienceItemFormData = z.infer<typeof experienceItemSchema>;

export const educationItemSchema = z.object({
  school: z.string().min(1, "School name is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional(),
  major: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
});

export type EducationItemFormData = z.infer<typeof educationItemSchema>;

export const preferencesSchema = z.object({
  jobType: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  salary: z.tuple([z.number(), z.number()]).optional(),
  positions: z.array(z.string()).optional(),
  remoteOnly: z.boolean().optional(),
  locations: z.array(z.string()).optional(),
});

export type PreferencesFormData = z.infer<typeof preferencesSchema>;

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validateUrl = (url: string): boolean => {
  if (!url) return true;
  return urlSchema.safeParse(url).success;
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  return phoneSchema.safeParse(phone).success;
};
