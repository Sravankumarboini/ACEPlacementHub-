import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Briefcase, 
  FileText, 
  TrendingUp,
  Laptop,
  Server,
  Cpu,
  Settings
} from "lucide-react";
import Navbar from "@/components/navbar";
import JobPostModal from "@/components/job-post-modal";
import type { ApplicationWithDetails } from "@shared/schema";

export default function FacultyDashboard() {
  const [isJobPostModalOpen, setIsJobPostModalOpen] = useState(false);

  const { data: applications = [] } = useQuery<ApplicationWithDetails[]>({
    queryKey: ['/api/applications'],
  });

  const departments = [
    { name: "Computer Science", students: 287, icon: Laptop },
    { name: "Information Technology", students: 195, icon: Server },
    { name: "Electronics", students: 156, icon: Cpu },
    { name: "Mechanical", students: 223, icon: Settings },
  ];

  const totalStudents = departments.reduce((sum, dept) => sum + dept.students, 0);
  const activeJobs = 24; // This would come from API
  const totalApplications = applications.length;
  const placementRate = 78; // This would be calculated

  const recentApplications = applications.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="faculty" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold text-foreground">{activeJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold text-foreground">{totalApplications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Placement Rate</p>
                  <p className="text-2xl font-bold text-foreground">{placementRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Departments</h2>
                <p className="text-muted-foreground text-sm">Click on a department to view students</p>
              </div>
              <Button 
                onClick={() => setIsJobPostModalOpen(true)}
                className="btn-primary"
              >
                Post New Job
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {departments.map((dept) => {
                const Icon = dept.icon;
                return (
                  <Button
                    key={dept.name}
                    variant="outline"
                    className="p-4 h-auto text-left justify-start hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <h3 className="font-medium text-foreground">{dept.name}</h3>
                        <p className="text-sm text-muted-foreground">{dept.students} students</p>
                      </div>
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Recent Applications</h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View All
              </Button>
            </div>
            
            {recentApplications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Job Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentApplications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground text-sm font-medium">
                                {application.student?.firstName.charAt(0)}{application.student?.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-foreground">
                                {application.student?.firstName} {application.student?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {application.student?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {application.job?.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {application.job?.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(application.appliedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <JobPostModal
        isOpen={isJobPostModalOpen}
        onClose={() => setIsJobPostModalOpen(false)}
      />
    </div>
  );
}
