// Job Matcher Service - Match jobs against user profiles

import { NormalizedJob } from "../../types/job.types";
import { JobProfile, JobPreferences } from "../../types/profile.types";
import { JobMatchResult, VoiceCommandParams } from "../../types/voice.types";

export interface MatchWeights {
  salary: number;
  location: number;
  jobType: number;
  experience: number;
  skills: number;
  remote: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  salary: 25,
  location: 25,
  jobType: 15,
  experience: 15,
  skills: 15,
  remote: 5,
};

class JobMatcherService {
  private weights: MatchWeights = DEFAULT_WEIGHTS;
  private minimumMatchScore: number = 50; // Minimum score to consider for auto-apply

  /**
   * Set custom weights for matching criteria
   */
  setWeights(weights: Partial<MatchWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Set minimum match score for auto-apply
   */
  setMinimumMatchScore(score: number): void {
    this.minimumMatchScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate match score between a job and user profile
   */
  calculateMatchScore(job: NormalizedJob, profile: JobProfile): JobMatchResult {
    const matchReasons: string[] = [];
    let totalScore = 0;

    const preferences = profile.preferences;

    // 1. Salary Match (25%)
    const salaryScore = this.calculateSalaryMatch(job, preferences);
    totalScore += salaryScore * (this.weights.salary / 100);
    if (salaryScore >= 70) {
      matchReasons.push("Salary matches your expectations");
    }

    // 2. Location Match (25%)
    const locationScore = this.calculateLocationMatch(job, profile, preferences);
    totalScore += locationScore * (this.weights.location / 100);
    if (locationScore >= 70) {
      matchReasons.push("Location matches your preferences");
    }

    // 3. Job Type Match (15%)
    const jobTypeScore = this.calculateJobTypeMatch(job, preferences);
    totalScore += jobTypeScore * (this.weights.jobType / 100);
    if (jobTypeScore >= 80) {
      matchReasons.push("Job type matches your preference");
    }

    // 4. Experience Match (15%)
    const experienceScore = this.calculateExperienceMatch(job, profile);
    totalScore += experienceScore * (this.weights.experience / 100);
    if (experienceScore >= 70) {
      matchReasons.push("Experience level is a good fit");
    }

    // 5. Skills Match (15%)
    const skillsScore = this.calculateSkillsMatch(job, profile);
    totalScore += skillsScore * (this.weights.skills / 100);
    if (skillsScore >= 50) {
      matchReasons.push("Your skills match the job requirements");
    }

    // 6. Remote Match (5%)
    const remoteScore = this.calculateRemoteMatch(job, preferences);
    totalScore += remoteScore * (this.weights.remote / 100);
    if (remoteScore >= 100) {
      matchReasons.push("Remote work option available");
    }

    // Normalize score to 0-100
    const normalizedScore = Math.min(100, Math.max(0, totalScore));

    return {
      jobId: job.id,
      matchScore: normalizedScore,
      matchReasons,
      shouldApply: normalizedScore >= this.minimumMatchScore,
    };
  }

  /**
   * Calculate salary match score
   */
  private calculateSalaryMatch(
    job: NormalizedJob,
    preferences?: JobPreferences
  ): number {
    if (!preferences?.desiredSalary && !preferences?.salary) {
      return 70; // Neutral if no salary preference
    }

    if (!job.salaryMin && !job.salaryMax) {
      return 50; // Unknown salary, neutral score
    }

    const desiredSalary = preferences.desiredSalary || preferences.salary?.[0];
    if (!desiredSalary) return 70;

    const jobMaxSalary = job.salaryMax || job.salaryMin || 0;
    const jobMinSalary = job.salaryMin || job.salaryMax || 0;

    // Job pays more than desired
    if (jobMinSalary >= desiredSalary) {
      return 100;
    }

    // Job max is above desired (range covers preference)
    if (jobMaxSalary >= desiredSalary) {
      return 85;
    }

    // Job pays 80-100% of desired
    if (jobMaxSalary >= desiredSalary * 0.8) {
      return 70;
    }

    // Job pays 60-80% of desired
    if (jobMaxSalary >= desiredSalary * 0.6) {
      return 40;
    }

    // Job pays less than 60% of desired
    return 20;
  }

  /**
   * Calculate location match score
   */
  private calculateLocationMatch(
    job: NormalizedJob,
    profile: JobProfile,
    preferences?: JobPreferences
  ): number {
    // If remote only preference and job is remote, perfect match
    if (preferences?.remoteOnly && job.isRemote) {
      return 100;
    }

    // If job is remote, it's generally a good match
    if (job.isRemote) {
      return 90;
    }

    // Check if job location matches preferred locations
    const preferredLocations = preferences?.locations || [];
    const userLocation = profile.currentCity || profile.state || profile.country;

    if (preferredLocations.length > 0) {
      const jobLocationLower = job.location.toLowerCase();
      for (const loc of preferredLocations) {
        if (jobLocationLower.includes(loc.toLowerCase())) {
          return 100;
        }
      }
    }

    // Check if job is in user's current location
    if (userLocation && job.location.toLowerCase().includes(userLocation.toLowerCase())) {
      return 85;
    }

    // Check job locations array
    for (const loc of job.locations) {
      if (profile.country && loc.country?.toLowerCase() === profile.country.toLowerCase()) {
        return 60;
      }
      if (profile.state && loc.state?.toLowerCase() === profile.state.toLowerCase()) {
        return 70;
      }
      if (profile.currentCity && loc.city?.toLowerCase() === profile.currentCity.toLowerCase()) {
        return 85;
      }
    }

    // Remote only preference but job is not remote
    if (preferences?.remoteOnly && !job.isRemote) {
      return 10;
    }

    return 40; // Default for unknown location match
  }

  /**
   * Calculate job type match score
   */
  private calculateJobTypeMatch(
    job: NormalizedJob,
    preferences?: JobPreferences
  ): number {
    if (!preferences?.jobType || preferences.jobType.length === 0) {
      return 70; // Neutral if no job type preference
    }

    const jobTypeLower = job.type.toLowerCase().replace("-", "_").replace(" ", "_");
    const preferredTypes = preferences.jobType.map((t) =>
      t?.toLowerCase().replace("-", "_").replace(" ", "_")
    );

    if (preferredTypes.includes(jobTypeLower)) {
      return 100;
    }

    // Partial match (e.g., user wants full-time, job is contract but still acceptable)
    if (
      preferredTypes.includes("full_time") &&
      ["contract", "freelance"].includes(jobTypeLower)
    ) {
      return 50;
    }

    return 30;
  }

  /**
   * Calculate experience level match score
   */
  private calculateExperienceMatch(
    job: NormalizedJob,
    profile: JobProfile
  ): number {
    const yearsOfExp = profile.yearsOfExperience || 0;
    const jobExpLower = job.experience.toLowerCase();

    // Map years to expected level
    let userLevel: string;
    if (yearsOfExp < 2) {
      userLevel = "entry";
    } else if (yearsOfExp < 5) {
      userLevel = "mid";
    } else if (yearsOfExp < 8) {
      userLevel = "senior";
    } else if (yearsOfExp < 12) {
      userLevel = "lead";
    } else {
      userLevel = "executive";
    }

    // Detect job level from description
    let jobLevel: string;
    if (jobExpLower.includes("entry") || jobExpLower.includes("junior")) {
      jobLevel = "entry";
    } else if (jobExpLower.includes("mid") || jobExpLower.includes("intermediate")) {
      jobLevel = "mid";
    } else if (jobExpLower.includes("senior") || jobExpLower.includes("sr")) {
      jobLevel = "senior";
    } else if (
      jobExpLower.includes("lead") ||
      jobExpLower.includes("principal") ||
      jobExpLower.includes("staff")
    ) {
      jobLevel = "lead";
    } else if (
      jobExpLower.includes("executive") ||
      jobExpLower.includes("director") ||
      jobExpLower.includes("vp")
    ) {
      jobLevel = "executive";
    } else {
      return 70; // Unknown job level, neutral
    }

    const levels = ["entry", "mid", "senior", "lead", "executive"];
    const userIndex = levels.indexOf(userLevel);
    const jobIndex = levels.indexOf(jobLevel);

    // Exact match
    if (userIndex === jobIndex) {
      return 100;
    }

    // One level difference (acceptable)
    if (Math.abs(userIndex - jobIndex) === 1) {
      return 75;
    }

    // Two level difference
    if (Math.abs(userIndex - jobIndex) === 2) {
      return 40;
    }

    // More than two levels
    return 20;
  }

  /**
   * Calculate skills match score
   */
  private calculateSkillsMatch(
    job: NormalizedJob,
    profile: JobProfile
  ): number {
    const userSkills = profile.skills || [];
    if (userSkills.length === 0) {
      return 50; // Neutral if no skills listed
    }

    const jobSkills = job.tags;
    if (jobSkills.length === 0) {
      return 60; // Neutral if no job skills listed
    }

    const userSkillsLower = userSkills.map((s) => s.toLowerCase());
    const jobSkillsLower = jobSkills.map((s) => s.toLowerCase());
    const jobTitleLower = job.title.toLowerCase();

    // Count matching skills
    let matchCount = 0;
    for (const skill of userSkillsLower) {
      if (
        jobSkillsLower.some((js) => js.includes(skill) || skill.includes(js)) ||
        jobTitleLower.includes(skill)
      ) {
        matchCount++;
      }
    }

    // Calculate match percentage
    const matchPercentage = (matchCount / jobSkillsLower.length) * 100;

    if (matchPercentage >= 75) return 100;
    if (matchPercentage >= 50) return 80;
    if (matchPercentage >= 25) return 60;
    if (matchCount > 0) return 40;

    return 20;
  }

  /**
   * Calculate remote work match score
   */
  private calculateRemoteMatch(
    job: NormalizedJob,
    preferences?: JobPreferences
  ): number {
    if (!preferences?.remoteOnly) {
      return 70; // Neutral if no remote preference
    }

    if (job.isRemote || job.workMode.toLowerCase() === "remote") {
      return 100;
    }

    if (job.workMode.toLowerCase() === "hybrid") {
      return 60;
    }

    return 20; // On-site when remote preferred
  }

  /**
   * Filter and rank jobs based on profile match
   */
  filterJobsByProfile(
    jobs: NormalizedJob[],
    profile: JobProfile
  ): Array<{ job: NormalizedJob; match: JobMatchResult }> {
    const results = jobs.map((job) => ({
      job,
      match: this.calculateMatchScore(job, profile),
    }));

    // Sort by match score descending
    results.sort((a, b) => b.match.matchScore - a.match.matchScore);

    return results;
  }

  /**
   * Get jobs that should be auto-applied based on profile
   */
  getAutoApplyJobs(
    jobs: NormalizedJob[],
    profile: JobProfile
  ): Array<{ job: NormalizedJob; match: JobMatchResult }> {
    return this.filterJobsByProfile(jobs, profile).filter(
      ({ match }) => match.shouldApply
    );
  }

  /**
   * Match jobs based on voice command parameters
   */
  matchByVoiceParams(
    jobs: NormalizedJob[],
    params: VoiceCommandParams,
    profile?: JobProfile
  ): Array<{ job: NormalizedJob; match: JobMatchResult }> {
    // First filter by voice params
    let filteredJobs = jobs;

    if (params.jobTitle) {
      const query = params.jobTitle.toLowerCase();
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (params.remote) {
      filteredJobs = filteredJobs.filter(
        (job) => job.isRemote || job.workMode.toLowerCase() === "remote"
      );
    }

    if (params.country) {
      const country = params.country.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some((loc) =>
          loc.country?.toLowerCase().includes(country)
        )
      );
    }

    if (params.state) {
      const state = params.state.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some((loc) => loc.state?.toLowerCase().includes(state))
      );
    }

    if (params.city) {
      const city = params.city.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some((loc) => loc.city?.toLowerCase().includes(city))
      );
    }

    if (params.salaryMin) {
      filteredJobs = filteredJobs.filter(
        (job) => !job.salaryMax || job.salaryMax >= params.salaryMin!
      );
    }

    // If profile provided, calculate match scores
    if (profile) {
      return this.filterJobsByProfile(filteredJobs, profile);
    }

    // Without profile, return with basic match score
    return filteredJobs.map((job) => ({
      job,
      match: {
        jobId: job.id,
        matchScore: 70, // Default score without profile
        matchReasons: ["Matches your search criteria"],
        shouldApply: true,
      },
    }));
  }
}

// Export singleton instance
export const jobMatcherService = new JobMatcherService();
export default jobMatcherService;
