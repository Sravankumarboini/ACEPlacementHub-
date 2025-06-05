import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import type { Job } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const applicationSchema = z.object({
  jobId: z.number(),
  resumeFileName: z.string().min(1, 'Please select a resume'),
  coverLetter: z.string().optional(),
  motivation: z.string().min(10, 'Please explain your motivation (min 10 characters)'),
});

interface JobApplicationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobApplicationModal({ job, isOpen, onClose }: JobApplicationModalProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      jobId: job?.id || 0,
      resumeFileName: '',
      coverLetter: '',
      motivation: '',
    },
  });

  // Fetch user's resumes
  const { data: resumes = [] } = useQuery({
    queryKey: ['/api/resumes'],
    enabled: isOpen && !!user,
  });

  const applyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof applicationSchema>) => {
      const response = await apiRequest('POST', '/api/applications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Application submitted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: z.infer<typeof applicationSchema>) => {
    if (!job) return;
    applyMutation.mutate({ ...data, jobId: job.id });
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Job</DialogTitle>
        </DialogHeader>

        {/* Job Details */}
        <div className="bg-neutral-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-neutral-900 mb-2">{job.title}</h3>
          <p className="text-neutral-600 mb-2">{job.company}</p>
          <div className="flex items-center space-x-4 text-sm text-neutral-500">
            <span>📍 {job.location}</span>
            <span>💼 {job.experience}</span>
            <span>💰 {job.salary}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="resumeFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input value={`${user?.firstName} ${user?.lastName}`} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resumeFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input value={user?.email} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resumeFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input value={user?.phone || ''} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resumeFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CGPA</FormLabel>
                    <FormControl>
                      <Input value={user?.cgpa || ''} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resumeFileName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Resume</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your resume" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resumes.map((resume: any) => (
                        <SelectItem key={resume.id} value={resume.fileName}>
                          {resume.originalName} {resume.isDefault && '(Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write a compelling cover letter..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why are you interested in this role?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your interest and motivation..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <label
                htmlFor="terms"
                className="text-sm text-neutral-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that all information provided is accurate and I meet the eligibility criteria for this position.
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
