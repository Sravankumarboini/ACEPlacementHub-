import { create } from 'zustand';
import type { Job, Application, SavedJob } from '@shared/schema';

interface JobState {
  jobs: Job[];
  applications: Application[];
  savedJobs: SavedJob[];
  searchTerm: string;
  locationFilter: string;
  typeFilter: string;
  setJobs: (jobs: Job[]) => void;
  setApplications: (applications: Application[]) => void;
  setSavedJobs: (savedJobs: SavedJob[]) => void;
  setSearchTerm: (term: string) => void;
  setLocationFilter: (location: string) => void;
  setTypeFilter: (type: string) => void;
  addApplication: (application: Application) => void;
  updateApplication: (id: number, updates: Partial<Application>) => void;
  toggleSavedJob: (jobId: number) => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  applications: [],
  savedJobs: [],
  searchTerm: '',
  locationFilter: '',
  typeFilter: '',
  setJobs: (jobs) => set({ jobs }),
  setApplications: (applications) => set({ applications }),
  setSavedJobs: (savedJobs) => set({ savedJobs }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  addApplication: (application) => 
    set((state) => ({ applications: [...state.applications, application] })),
  updateApplication: (id, updates) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      ),
    })),
  toggleSavedJob: (jobId) =>
    set((state) => {
      const isSaved = state.savedJobs.some((saved) => saved.jobId === jobId);
      if (isSaved) {
        return {
          savedJobs: state.savedJobs.filter((saved) => saved.jobId !== jobId),
        };
      } else {
        const newSavedJob: SavedJob = {
          id: Date.now(), // Temporary ID
          studentId: 0, // Will be set properly when API call is made
          jobId,
          savedAt: new Date(),
        };
        return {
          savedJobs: [...state.savedJobs, newSavedJob],
        };
      }
    }),
}));
