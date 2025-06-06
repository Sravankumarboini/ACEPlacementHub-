import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Clock, DollarSign, Building2, Calendar } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JobWithDetails } from "@shared/schema";
import JobApplicationModal from "./job-application-modal";

interface JobCardProps {
  job: JobWithDetails;
  showApplyButton?: boolean;
  onApply?: () => void;
}

export default function JobCard({ job, showApplyButton = true }: JobCardProps) {
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (job.savedByUser) {
        return apiRequest('DELETE', `/api/saved-jobs/${job.id}`);
      } else {
        return apiRequest('POST', '/api/saved-jobs', { jobId: job.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/saved-jobs'] });
      toast({
        title: job.savedByUser ? "Job unsaved" : "Job saved",
        description: job.savedByUser ? "Job removed from saved jobs" : "Job added to saved jobs",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update saved jobs",
        variant: "destructive",
      });
    },
  });

  const formatDeadline = (deadline: Date | string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days left`;
  };

  const getDeadlineColor = (deadline: Date | string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-destructive";
    if (diffDays <= 3) return "text-orange-600 dark:text-orange-400";
    return "text-muted-foreground";
  };

  return (
    <>
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>{job.company}</span>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveJobMutation.mutate()}
              disabled={saveJobMutation.isPending}
              className={job.savedByUser ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}
            >
              <Heart className={`h-4 w-4 ${job.savedByUser ? "fill-current" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            {job.salary && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>{job.salary}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="capitalize">
              {job.type}
            </Badge>
            <div className={`flex items-center space-x-1 text-sm ${getDeadlineColor(job.deadline)}`}>
              <Calendar className="h-4 w-4" />
              <span>{formatDeadline(job.deadline)}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.description}
          </p>
          
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        
        {showApplyButton && (
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => setShowApplicationModal(true)}
              disabled={job.appliedByUser}
              variant={job.appliedByUser ? "secondary" : "default"}
            >
              {job.appliedByUser ? "Applied" : "Apply Now"}
            </Button>
          </CardFooter>
        )}
      </Card>

      <JobApplicationModal
        job={job}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
      />
    </>
  );
}