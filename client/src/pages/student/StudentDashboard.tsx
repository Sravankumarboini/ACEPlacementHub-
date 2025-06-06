import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useJobStore } from '@/store/useJobStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Job } from '@shared/schema';
import { JobFilters } from '@/components/jobs/JobFilters';
import { JobCard } from '@/components/jobs/JobCard';
import { JobApplicationModal } from '@/components/modals/JobApplicationModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { searchTerm, locationFilter, typeFilter } = useJobStore();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // Fetch jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Fetch applications to check which jobs user has applied to
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/applications'],
    enabled: !!user,
  });

  // Fetch saved jobs
  const { data: savedJobs = [] } = useQuery({
    queryKey: ['/api/saved-jobs'],
    enabled: !!user,
  });

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job: Job) => {
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || 
        job.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesType = !typeFilter || job.type === typeFilter;
      
      return matchesSearch && matchesLocation && matchesType;
    });
  }, [jobs, searchTerm, locationFilter, typeFilter]);

  const handleApplyJob = (job: Job) => {
    setSelectedJob(job);
    setIsApplicationModalOpen(true);
  };

  const isJobSaved = (jobId: number) => {
    return savedJobs.some((saved: any) => saved.jobId === jobId);
  };

  const hasAppliedToJob = (jobId: number) => {
    return applications.some((app: any) => app.jobId === jobId);
  };

  if (jobsLoading) {
    return (
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <JobFilters />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Available Jobs</h2>
          <span className="text-sm text-neutral-500">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-6xl mb-4">💼</div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No jobs found</h3>
            <p className="text-neutral-500">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
          </div>
        ) : (
          <>
            {filteredJobs.map((job: Job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={isJobSaved(job.id)}
                hasApplied={hasAppliedToJob(job.id)}
                onApply={() => handleApplyJob(job)}
              />
            ))}

            {filteredJobs.length >= 10 && (
              <div className="text-center mt-8">
                <Button variant="outline">
                  Load More Jobs
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <JobApplicationModal
        job={selectedJob}
        isOpen={isApplicationModalOpen}
        onClose={() => {
          setIsApplicationModalOpen(false);
          setSelectedJob(null);
        }}
      />
    </main>
  );
}
