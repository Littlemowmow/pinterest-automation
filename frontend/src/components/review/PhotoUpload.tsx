'use client';

import { useState, useCallback } from 'react';
import { Upload, X, ImagePlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface PhotoUploadProps {
  onUploadComplete?: () => void;
}

interface UploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function PhotoUpload({ onUploadComplete }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0) {
      setFiles(prev => [
        ...prev,
        ...droppedFiles.map(file => ({ file, status: 'pending' as const }))
      ]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(file =>
      file.type.startsWith('image/')
    );

    if (selectedFiles.length > 0) {
      setFiles(prev => [
        ...prev,
        ...selectedFiles.map(file => ({ file, status: 'pending' as const }))
      ]);
    }

    // Reset input
    e.target.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);

    // Update all pending files to uploading
    setFiles(prev => prev.map(f =>
      f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
    ));

    try {
      const pendingFiles = files.filter(f => f.status === 'uploading').map(f => f.file);
      const result = await api.uploadPhotos(pendingFiles);

      // Update file statuses based on results
      setFiles(prev => prev.map(f => {
        if (f.status !== 'uploading') return f;

        const uploaded = result.photos.find(p => p.file_name === f.file.name);
        const error = result.errors.find(e => e.file === f.file.name);

        if (uploaded) {
          return { ...f, status: 'success' as const };
        } else if (error) {
          return { ...f, status: 'error' as const, error: error.error };
        }
        return f;
      }));

      if (result.uploaded > 0) {
        onUploadComplete?.();
      }

      // Clear successful uploads after a delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'success'));
      }, 2000);

    } catch (error) {
      setFiles(prev => prev.map(f =>
        f.status === 'uploading' ? { ...f, status: 'error' as const, error: 'Upload failed' } : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center transition-colors
            ${isDragging ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
          `}>
            <ImagePlus className="w-7 h-7" />
          </div>

          <div>
            <p className="font-medium text-foreground">
              {isDragging ? 'Drop photos here' : 'Drag & drop photos'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse (JPG, PNG, GIF, WebP)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {files.length} photo{files.length !== 1 ? 's' : ''} selected
            </p>
            {pendingCount > 0 && !isUploading && (
              <Button onClick={uploadFiles} size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingCount} photo{pendingCount !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {files.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {item.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">{item.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
