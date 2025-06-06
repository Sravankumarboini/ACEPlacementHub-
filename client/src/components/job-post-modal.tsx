import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertJobSchema } from "@shared/schema";

const jobPostSchema = insertJobSchema.extend({
  deadline: z.string().min(1, "Deadline is required"),
  skills: z.string().optional(),
  requirements: z.string().optional(),
});

interface JobPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobPostModal({ isOpen, onClose }: JobPostModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof jobPostSchema>>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      type: "full-time",
      experience: "",
      salary: "",
      description: "",
      requirements: "",
      skills: "",
      eligibility: "",
      deadline: "",
      isActive: true,
    },
  });

  const jobPostMutation = useMutation({
    mutationFn: (data: z.infer<typeof jobPostSchema>) => {
      const processedData = {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        requirements: data.requirements ? data.requirements.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      return apiRequest('POST', '/api/jobs', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Job posted successfully",
        description: "The job has been posted and is now visible to students.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error('Job posting error:', error);
      
      // Handle structured error responses from server
      if (error.response?.data?.errors) {
        const errorMessage = error.response.data.errors.join('\n');
        toast({
          title: "Please fix the following issues:",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (error.response?.data?.message) {
        toast({
          title: "Unable to post job",
          description: error.response.data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to post job",
          description: "Please check all required fields and try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: z.infer<typeof jobPostSchema>) => {
    jobPostMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post New Job</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TechCorp Solutions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bangalore, India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Required</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2-4 years" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8-12 LPA or 25K/month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
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
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List requirements separated by commas (e.g., Bachelor's degree, 2+ years experience, Strong communication skills)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List skills separated by commas (e.g., React, Node.js, Python, SQL)"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eligibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Criteria</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CGPA >= 7.5, Final year students only" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Deadline *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                className="flex-1 btn-primary"
                disabled={jobPostMutation.isPending}
              >
                {jobPostMutation.isPending ? "Posting..." : "Post Job"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
