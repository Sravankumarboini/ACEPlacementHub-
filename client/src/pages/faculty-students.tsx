import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Users, 
  Laptop,
  Server,
  Cpu,
  Settings,
  FileText,
  Mail,
  Phone
} from "lucide-react";
import Navbar from "@/components/navbar";
import type { User, ApplicationWithDetails } from "@shared/schema";

export default function FacultyStudents() {
  const [selectedDepartment, setSelectedDepartment] = useState("Computer Science");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  const { data: students = [] } = useQuery<User[]>({
    queryKey: ['/api/users/departments', selectedDepartment],
    enabled: !!selectedDepartment,
  });

  const { data: studentApplications = [] } = useQuery<ApplicationWithDetails[]>({
    queryKey: ['/api/applications'],
    enabled: !!selectedStudent,
  });

  const departments = [
    { name: "Computer Science", icon: Laptop, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    { name: "Information Technology", icon: Server, color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" },
    { name: "Electronics", icon: Cpu, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
    { name: "Mechanical", icon: Settings, color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" },
  ];

  const filteredStudents = students.filter(student =>
    !searchTerm ||
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentApplications = (studentId: number) => {
    return studentApplications.filter(app => app.studentId === studentId);
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">View and manage student records by department</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Department Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Departments</h3>
                <div className="space-y-2">
                  {departments.map((dept) => {
                    const Icon = dept.icon;
                    return (
                      <Button
                        key={dept.name}
                        variant={selectedDepartment === dept.name ? "default" : "outline"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => setSelectedDepartment(dept.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${dept.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {students.length} students
                            </p>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedDepartment} Students
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search students..."
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{filteredStudents.length} students</span>
                    </Badge>
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
                    <p className="text-muted-foreground">
                      {students.length === 0 
                        ? "No students in this department yet."
                        : "No students match your search criteria."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredStudents.map((student) => {
                      const applications = getStudentApplications(student.id);
                      return (
                        <Card key={student.id} className="card-hover cursor-pointer" onClick={() => setSelectedStudent(student)}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-primary-foreground text-sm font-medium">
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">
                                  {student.firstName} {student.lastName}
                                </h4>
                                <div className="flex items-center space-x-1 mt-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground truncate">
                                    {student.email}
                                  </p>
                                </div>
                                {student.phone && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      {student.phone}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center space-x-2">
                                    {student.cgpa && (
                                      <Badge variant="secondary" className="text-xs">
                                        CGPA: {student.cgpa}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3" />
                                    <span>{applications.length} applications</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Student Details Modal/Overlay */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedStudent(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                {/* Student Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Email:</span> {selectedStudent.email}</p>
                      {selectedStudent.phone && (
                        <p><span className="text-muted-foreground">Phone:</span> {selectedStudent.phone}</p>
                      )}
                      <p><span className="text-muted-foreground">Department:</span> {selectedStudent.department}</p>
                      {selectedStudent.cgpa && (
                        <p><span className="text-muted-foreground">CGPA:</span> {selectedStudent.cgpa}</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Applications */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Application History</h3>
                  {getStudentApplications(selectedStudent.id).length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No applications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getStudentApplications(selectedStudent.id).map((application) => (
                        <div key={application.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{application.job?.title}</p>
                            <p className="text-sm text-muted-foreground">{application.job?.company}</p>
                            <p className="text-xs text-muted-foreground">Applied {formatDate(application.appliedAt)}</p>
                          </div>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
