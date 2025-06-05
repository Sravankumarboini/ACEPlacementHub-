import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Trash2, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  cgpa: z.string().optional(),
  skills: z.string().optional(),
});

export default function StudentProfile() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      cgpa: user?.cgpa || '',
      skills: user?.skills?.join(', ') || '',
    },
  });

  // Fetch resumes
  const { data: resumes = [] } = useQuery({
    queryKey: ['/api/resumes'],
  });

  // Fetch user applications for stats
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/applications'],
  });

  // Fetch saved jobs for stats
  const { data: savedJobs = [] } = useQuery({
    queryKey: ['/api/saved-jobs'],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const updateData = {
        ...data,
        skills: data.skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
      };
      const response = await apiRequest('PUT', '/api/user/profile', updateData);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast({ title: 'Success', description: 'Profile updated successfully!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  // Upload resume mutation
  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('isDefault', 'false');
      
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Resume uploaded successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload resume',
        variant: 'destructive',
      });
    },
  });

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (resumeId: number) => {
      await apiRequest('DELETE', `/api/resumes/${resumeId}`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Resume deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete resume',
        variant: 'destructive',
      });
    },
  });

  // Set default resume mutation
  const setDefaultResumeMutation = useMutation({
    mutationFn: async (resumeId: number) => {
      await apiRequest('PUT', `/api/resumes/${resumeId}/default`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Default resume updated!' });
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set default resume',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadResumeMutation.mutate(selectedFile);
    }
  };

  const calculateProfileCompletion = () => {
    const fields = [
      user?.firstName,
      user?.lastName,
      user?.email,
      user?.phone,
      user?.department,
      user?.cgpa,
      user?.skills?.length,
    ];
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  return (
    <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input {...form.register('firstName')} />
                    {form.formState.errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input {...form.register('lastName')} />
                    {form.formState.errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input {...form.register('email')} />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input {...form.register('phone')} />
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={form.watch('department')} 
                      onValueChange={(value) => form.setValue('department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Civil">Civil</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="cgpa">CGPA</Label>
                    <Input {...form.register('cgpa')} placeholder="e.g. 8.5" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea
                    {...form.register('skills')}
                    placeholder="e.g. React, Node.js, Python, JavaScript"
                    rows={3}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resume Management */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                onFileSelect={setSelectedFile}
                onFileRemove={() => setSelectedFile(null)}
                selectedFile={selectedFile}
                accept=".pdf,.doc,.docx"
              />
              
              {selectedFile && (
                <Button
                  onClick={handleFileUpload}
                  disabled={uploadResumeMutation.isPending}
                  className="w-full"
                >
                  {uploadResumeMutation.isPending ? 'Uploading...' : 'Upload Resume'}
                </Button>
              )}

              {/* Existing Resumes */}
              <div className="space-y-3">
                {resumes.map((resume: any) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="text-red-500" size={20} />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {resume.originalName}
                        </p>
                        {resume.isDefault && (
                          <p className="text-xs text-green-600">Default Resume</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!resume.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultResumeMutation.mutate(resume.id)}
                          disabled={setDefaultResumeMutation.isPending}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteResumeMutation.mutate(resume.id)}
                        disabled={deleteResumeMutation.isPending}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Applications Sent</span>
                <span className="font-semibold text-neutral-900">{applications.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Jobs Saved</span>
                <span className="font-semibold text-neutral-900">{savedJobs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Resumes Uploaded</span>
                <span className="font-semibold text-neutral-900">{resumes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Profile Completion</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full transition-all" 
                      style={{ width: `${calculateProfileCompletion()}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">
                    {calculateProfileCompletion()}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
