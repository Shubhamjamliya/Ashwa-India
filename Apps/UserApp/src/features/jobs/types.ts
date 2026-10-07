export type JobCategory = 'trainer' | 'groom' | 'stable-manager' | 'rider' | 'veterinarian' | 'driver';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'hired' | 'rejected';
export type JobStatus = 'active' | 'paused' | 'filled' | 'closed';

export type Job = {
  _id: string;
  title: string;
  category: JobCategory;
  jobType: string;
  city: string;
  address?: string;
  experienceYears: number;
  salaryText?: string;
  openings: number;
  hiredCount?: number;
  applicants?: number;
  deadline?: string;
  description?: string;
  requirements?: string;
  status?: JobStatus;
  employer?: { name?: string };
  contact?: { name?: string; phone?: string };
  posterName?: string;
  posterPhone?: string;
  saved?: boolean;
  applicationStatus?: ApplicationStatus;
};

export type JobApplication = {
  _id: string;
  status: ApplicationStatus;
  job?: Job;
  applicantName?: string;
  applicantPhone?: string;
  applicantModel?: string;
  coverNote?: string;
  resume?: { url?: string; filename?: string };
};

export const JOB_CATEGORY_LABEL: Record<JobCategory, string> = {
  trainer: 'Trainer',
  groom: 'Groom',
  'stable-manager': 'Stable Manager',
  rider: 'Rider',
  veterinarian: 'Veterinarian',
  driver: 'Driver',
};

export const APPLICATION_LABEL: Record<ApplicationStatus, { label: string; bg: string; fg: string }> = {
  applied: { label: 'Applied', bg: '#DBEAFE', fg: '#1E40AF' },
  shortlisted: { label: 'Shortlisted', bg: '#FEF3C7', fg: '#92400E' },
  hired: { label: 'Hired', bg: '#D1FAE5', fg: '#065F46' },
  rejected: { label: 'Not selected', bg: '#E5E5E5', fg: '#404040' },
};
