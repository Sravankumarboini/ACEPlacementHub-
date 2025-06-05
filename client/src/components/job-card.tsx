import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Briefcase, IndianRupee, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import JobApplicationModal from "./job-application-modal";
import type { JobWithDetails } from "@shared/schema";

interface JobCardProps {
  job: JobWithDetails;
  showApplyButton?: boolean;
  onApply?: () => void;
}

export default function JobCard({ job, showApplyButton = true }: JobCardProps) {
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveJobMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/saved-jobs', { jobId: job.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saved-jobs'] });
      toast({
        title: "Job saved",
        description: "Job has been added to your saved jobs.",
      });
    },
  });

  const unsaveJobMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/saved-jobs/${job.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saved-jobs'] });
      toast({
        title: "Job unsaved",
        description: "Job has been removed from your saved jobs.",
      });
    },
  });

  const handleSaveToggle = () => {
    if (job.savedByUser) {
      unsaveJobMutation.mutate();
    } else {
      saveJobMutation.mutate();
    }
  };

  const formatDeadline = (deadline: Date) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDeadlinePassed = new Date(job.deadline) < new Date();
  
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full-time':
        return 'bg-secondary/10 text-secondary';
      case 'internship':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'part-time':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Card className="card-hover">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                <Badge className={getJobTypeColor(job.type)}>
                  {job.type}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">{job.company}</p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  {job.location}
                </span>
                {job.experience && (
                  <span className="flex items-center">
                    <Briefcase className="mr-1 h-4 w-4" />
                    {job.experience}
                  </span>
                )}
                {job.salary && (
                  <span className="flex items-center">
                    <IndianRupee className="mr-1 h-4 w-4" />
                    {job.salary}
                  </span>
                )}
              </div>
              <p className="text-foreground text-sm mb-4 line-clamp-2">
                {job.description}
              </p>
              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.slice(0, 4).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {job.skills.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{job.skills.length - 4} more
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Deadline: {formatDeadline(job.deadline)}
                  {isDeadlinePassed && (
                    <span className="ml-2 text-accent">(Expired)</span>
                  )}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveToggle}
                    disabled={saveJobMutation.isPending || unsaveJobMutation.isPending}
                    className={job.savedByUser ? "text-accent" : "text-muted-foreground hover:text-accent"}
                  >
                    <Heart className={`h-4 w-4 ${job.savedByUser ? "fill-current" : ""}`} />
                  </Button>
                  {showApplyButton && !isDeadlinePassed && !job.appliedByUser && (
                    <Button
                      size="sm"
                      className="btn-primary"
                      onClick={() => setIsApplicationModalOpen(true)}
                    >
                      Apply Now
                    </Button>
                  )}
                  {job.appliedByUser && (
                    <Badge variant="outline" className="text-secondary">
                      Applied
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <JobApplicationModal
        job={job}
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
      />
    </>
  );
}
