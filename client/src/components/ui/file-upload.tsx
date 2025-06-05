import React, { useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  selectedFile?: File | null;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = '.pdf,.doc,.docx',
  multiple = false,
  className,
  disabled = false,
  selectedFile = null,
}: FileUploadProps) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {!selectedFile ? (
        <div
          className={cn(
            'border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center transition-colors',
            'hover:border-primary/50 hover:bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-neutral-600 mb-2">
            Drop your file here or{' '}
            <label className="text-primary hover:text-primary/80 cursor-pointer">
              browse
              <input
                type="file"
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                disabled={disabled}
              />
            </label>
          </p>
          <p className="text-xs text-neutral-500">
            Supports: {accept.replace(/\./g, '').toUpperCase()}
          </p>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {onFileRemove && (
              <button
                onClick={onFileRemove}
                className="text-neutral-500 hover:text-red-500 transition-colors"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
