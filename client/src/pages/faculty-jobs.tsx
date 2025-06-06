import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  MapPin,
  Briefcase,
  IndianRupee,
  Calendar,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import Navbar from "@/components/navbar";
import { JobPostModal } from "@/components/modals/JobPostModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Job, ApplicationWithDetails } from "@shared/schema";

export default function FacultyJobs() {
  const [isJobPostModalOpen, setIsJobPostModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: applications = [] } = useQuery<ApplicationWithDetails[]>({
    queryKey: ['/api/applications'],
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: number) => apiRequest('DELETE', `/api/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job deleted",
        description: "Job has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const toggleJobStatusMutation = useMutation({
    mutationFn: ({ jobId, isActive }: { jobId: number; isActive: boolean }) =>
      apiRequest('PUT', `/api/jobs/${jobId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job status updated",
        description: "Job status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && job.isActive) ||
      (statusFilter === "inactive" && !job.isActive) ||
      (statusFilter === "expired" && new Date(job.deadline) < new Date());
    
    return matchesSearch && matchesStatus;
  });

  const getJobApplications = (jobId: number) => {
    return applications.filter(app => app.jobId === jobId);
  };

  const getStatusColor = (job: Job) => {
    if (!job.isActive) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    if (new Date(job.deadline) < new Date()) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
  };

  const getStatusText = (job: Job) => {
    if (!job.isActive) return "Inactive";
    if (new Date(job.deadline) < new Date()) return "Expired";
    return "Active";
  };

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDeleteJob = (jobId: number, jobTitle: string) => {
    if (confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const handleToggleJobStatus = (jobId: number, currentStatus: boolean) => {
    toggleJobStatusMutation.mutate({ jobId, isActive: !currentStatus });
  };

  const getJobStats = () => {
    return {
      total: jobs.length,
      active: jobs.filter(job => job.isActive && new Date(job.deadline) >= new Date()).length,
      inactive: jobs.filter(job => !job.isActive).length,
      expired: jobs.filter(job => new Date(job.deadline) < new Date()).length,
    };
  };

  const stats = getJobStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role="faculty" />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="faculty" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Management</h1>
            <p className="text-muted-foreground">Manage job postings and track applications</p>
          </div>
          <Button 
            onClick={() => setIsJobPostModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Inactive Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expired Jobs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search jobs by title or company..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Posted Jobs</h2>
            <span className="text-sm text-muted-foreground">
              {filteredJobs.length} jobs
            </span>
          </div>

          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
                <p className="text-muted-foreground">
                  {jobs.length === 0 
                    ? "Start by posting your first job opportunity."
                    : "No jobs match your current filters."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => {
              const jobApplications = getJobApplications(job.id);
              return (
                <Card key={job.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                          <Badge className={getJobTypeColor(job.type)}>
                            {job.type}
                          </Badge>
                          <Badge className={getStatusColor(job)}>
                            {getStatusText(job)}
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
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            Deadline: {formatDate(job.deadline)}
                          </span>
                          <span className="flex items-center">
                            <Users className="mr-1 h-4 w-4" />
                            {jobApplications.length} applications
                          </span>
                        </div>
                        <p className="text-foreground text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Posted {formatDate(job.createdAt)}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedJob(job)}
                            >
                              View Applications
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleJobStatus(job.id, job.isActive)}
                            >
                              {job.isActive ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteJob(job.id, job.title)}
                              className="text-accent hover:text-accent/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Job Applications Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Applications for {selectedJob.title}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedJob(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                {getJobApplications(selectedJob.id).length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No applications yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getJobApplications(selectedJob.id).map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-sm font-medium">
                              {application.student?.firstName.charAt(0)}{application.student?.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {application.student?.firstName} {application.student?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{application.student?.email}</p>
                            <p className="text-xs text-muted-foreground">Applied {formatDate(application.appliedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`status-${application.status}`}>
                            {application.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <JobPostModal
        isOpen={isJobPostModalOpen}
        onClose={() => setIsJobPostModalOpen(false)}
      />
    </div>
  );
}
