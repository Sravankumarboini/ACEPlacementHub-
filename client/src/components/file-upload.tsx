import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileText, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resumes/my'] });
      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded successfully.",
      });
      onUploadSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf' && 
        !file.name.endsWith('.doc') && 
        !file.name.endsWith('.docx')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        Upload Resume
      </h3>
      <p className="text-muted-foreground mb-4">
        Drag and drop your resume here, or click to browse
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="btn-primary"
      >
        {uploadMutation.isPending ? "Uploading..." : "Choose File"}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Supported formats: PDF, DOC, DOCX (Max 5MB)
      </p>
    </div>
  );
}
