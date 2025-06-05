import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobStore } from '@/store/useJobStore';
import type { Job } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  hasApplied?: boolean;
  onApply: () => void;
}

export function JobCard({ job, isSaved = false, hasApplied = false, onApply }: JobCardProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest('DELETE', `/api/saved-jobs/${job.id}`);
      } else {
        await apiRequest('POST', '/api/saved-jobs', { jobId: job.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-jobs'] });
      toast({
        title: isSaved ? 'Job unsaved' : 'Job saved',
        description: isSaved ? 'Job removed from saved list' : 'Job added to saved list',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update saved job',
        variant: 'destructive',
      });
    },
  });

  const formatDeadline = (deadline: Date | string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isDeadlinePassed = (deadline: Date | string) => {
    return new Date(deadline) < new Date();
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full-time':
        return 'bg-secondary/10 text-secondary';
      case 'internship':
        return 'bg-blue-100 text-blue-700';
      case 'part-time':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const deadlinePassed = isDeadlinePassed(job.deadline);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-neutral-900">{job.title}</h3>
            <Badge className={`text-sm font-medium ${getJobTypeColor(job.jobType)}`}>
              {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
            </Badge>
          </div>
          
          <p className="text-neutral-600 mb-2">{job.company}</p>
          
          <div className="flex items-center space-x-4 text-sm text-neutral-500 mb-3">
            <span className="flex items-center">
              <MapPin size={14} className="mr-1" />
              {job.location}
            </span>
            {job.experience && (
              <span className="flex items-center">
                <Briefcase size={14} className="mr-1" />
                {job.experience}
              </span>
            )}
            {job.salary && (
              <span className="flex items-center">
                <DollarSign size={14} className="mr-1" />
                {job.salary}
              </span>
            )}
          </div>
          
          <p className="text-neutral-700 text-sm mb-4 line-clamp-2">
            {job.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skillsRequired?.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skillsRequired && job.skillsRequired.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{job.skillsRequired.length - 4} more
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 flex items-center">
              <Clock size={14} className="mr-1" />
              Deadline: {formatDeadline(job.deadline)}
              {deadlinePassed && (
                <span className="ml-2 text-red-500 font-medium">(Expired)</span>
              )}
            </span>
            
            <div className="flex space-x-2">
              {user?.role === 'student' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveJobMutation.mutate()}
                    disabled={saveJobMutation.isPending}
                    className={`p-2 ${isSaved ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'}`}
                  >
                    <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={onApply}
                    disabled={hasApplied || deadlinePassed}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {hasApplied ? 'Applied' : deadlinePassed ? 'Expired' : 'Apply Now'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
