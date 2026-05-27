// ── Core Types ────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  resume_uploaded: boolean
  min_salary_lpa: number
  telegram_notifications: boolean
  email_notifications: boolean
  jobs_saved: number
  jobs_applied: number
}

export interface Job {
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  remote: boolean
  salary_min_lpa?: number
  salary_max_lpa?: number
  salary_display: string
  salary_estimated: boolean
  experience_min: number
  experience_max: number
  skills_required: string[]
  description?: string
  apply_url: string
  source_platform: Platform
  posted_at?: string
  scraped_at: string
  is_active: boolean
  job_type: JobType
  fresher_friendly: boolean
  match_score?: number
  is_saved?: boolean
  application_status?: ApplicationStatus
}

export type Platform =
  | "linkedin"
  | "wellfound"
  | "greenhouse"
  | "lever"
  | "remoteok"
  | "naukri"
  | "instahyre"
  | "ycombinator"
  | "unknown"

export type JobType = "full_time" | "internship" | "contract" | "part_time"

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn"

export interface Resume {
  id: string
  filename: string
  skills: string[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  certifications: string[]
  summary: string
  strengths: string[]
  improvement_areas: string[]
  suggested_roles: string[]
  created_at: string
}

export interface EducationEntry {
  degree: string
  institution: string
  year: string
}

export interface ExperienceEntry {
  role: string
  company: string
  duration: string
}

export interface ProjectEntry {
  name: string
  description: string
  technologies: string[]
}

export interface JobMatch {
  match_percentage: number
  matched_skills: string[]
  missing_skills: string[]
  improvement_suggestions: string[]
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  job_id?: string
  is_read: boolean
  created_at: string
}

export interface AnalyticsDashboard {
  summary: {
    jobs_saved: number
    jobs_applied: number
    interviewing: number
    offers: number
    avg_match_score: number
  }
  application_funnel: Record<string, number>
  top_matches: Array<{ job_id: string; score: number }>
  recent_searches: string[]
}

export interface JobFilters {
  platform?: Platform
  remote?: boolean
  min_salary?: number
  max_experience?: number
  job_type?: JobType
  sort_by?: "scraped_at" | "salary" | "match_score"
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  pages: number
}
