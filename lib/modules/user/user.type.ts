export interface UpdateUserProfilePayload {
  userId: number;
  name?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  experienceYears?: number;
  resumeUrl?: string;
  resumeName?: string;
  resumeText?: string;
}
