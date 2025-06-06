import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Briefcase, TrendingUp } from "lucide-react";
import Navbar from "@/components/navbar";
import { JobPostModal } from "@/components/modals/JobPostModal";
import type { Job, ApplicationWithDetails, User } from "@shared/schema";

export default function AdminDashboard() {
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  // Fetch statistics
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: applications = [] } = useQuery<ApplicationWithDetails[]>({
    queryKey: ['/api/applications/all'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const stats = {
    totalStudents: users.filter(user => user.role === 'student').length,
    activeJobs: jobs.filter(job => job.isActive).length,
    placementRate: applications.filter(app => app.status === 'accepted').length / Math.max(applications.length, 1) * 100,
  };

  const recentJobs = jobs.slice(0, 5);
  
  // Group applications by job to show job-wise application counts
  const jobApplicationCounts = jobs.map(job => {
    const jobApplications = applications.filter(app => app.jobId === job.id);
    return {
      job,
      applicationCount: jobApplications.length,
      recentApplications: jobApplications.slice(0, 3)
    };
  }).filter(item => item.applicationCount > 0).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="faculty" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage placements and track student progress</p>
          </div>
          <Button onClick={() => setIsJobModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Placement Rate</p>
                  <p className="text-2xl font-bold text-foreground">{stats.placementRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Job Postings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={job.isActive ? "default" : "secondary"}>
                          {job.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentJobs.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No jobs posted yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job-wise Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications by Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobApplicationCounts.map((item) => (
                  <div key={item.job.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{item.job.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.job.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">{item.applicationCount}</p>
                        <p className="text-sm text-muted-foreground">applications</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.job.isActive ? "default" : "secondary"}>
                        {item.job.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{item.job.type}</Badge>
                    </div>
                  </div>
                ))}
                {jobApplicationCounts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No applications yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <JobPostModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
      />
    </div>
  );
}