import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, IndianRupee } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { JobWithDetails, Resume } from "@shared/schema";

const applicationSchema = z.object({
  jobId: z.number(),
  resumeId: z.number().optional(),
  coverLetter: z.string().optional(),
  motivation: z.string().min(10, "Please explain your motivation (at least 10 characters)"),
  confirmEligibility: z.boolean().refine(val => val === true, "You must confirm you meet the eligibility criteria"),
});

interface JobApplicationModalProps {
  job: JobWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobApplicationModal({ job, isOpen, onClose }: JobApplicationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ['/api/resumes/my'],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      jobId: job.id,
      resumeId: undefined,
      coverLetter: "",
      motivation: "",
      confirmEligibility: false,
    },
  });

  const applicationMutation = useMutation({
    mutationFn: (data: z.infer<typeof applicationSchema>) => 
      apiRequest('POST', '/api/applications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/my'] });
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully!",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Application failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof applicationSchema>) => {
    applicationMutation.mutate(data);
  };

  const defaultResume = resumes.find(resume => resume.isDefault);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Job</DialogTitle>
        </DialogHeader>

        {/* Job Details */}
        <div className="bg-muted p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-foreground mb-2">{job.title}</h3>
          <p className="text-muted-foreground mb-2">{job.company}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={user ? `${user.firstName} ${user.lastName}` : ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <FormLabel>Email</FormLabel>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={user?.phone || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <FormLabel>CGPA</FormLabel>
                <Input
                  value={user?.cgpa || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="resumeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Resume</FormLabel>
                  <FormControl>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={defaultResume?.id.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id.toString()}>
                            {resume.fileName} {resume.isDefault && "(Default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter (Optional)</FormLabel>
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
                  <FormLabel>Why are you interested in this role? *</FormLabel>
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

            <FormField
              control={form.control}
              name="confirmEligibility"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that all information provided is accurate and I meet the eligibility criteria for this position.
                    </FormLabel>
                    {job.eligibility && (
                      <p className="text-sm text-muted-foreground">
                        Eligibility: {job.eligibility}
                      </p>
                    )}
                  </div>
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
                disabled={applicationMutation.isPending}
              >
                {applicationMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
