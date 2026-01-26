'use client';

import { useState } from 'react';
import { Images, Sparkles, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoCard } from '@/components/review/PhotoCard';
import { PhotoUpload } from '@/components/review/PhotoUpload';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePhotos, usePhotoStats } from '@/hooks/usePhotos';
import { useQueue } from '@/hooks/useQueue';
import { useBoardMappings } from '@/hooks/useSettings';
import { api } from '@/lib/api';
import type { Photo } from '@/lib/types';

export default function ReviewPage() {
  const { photos, isLoading, mutate } = usePhotos('tagged');
  const { mutate: mutateStats } = usePhotoStats();
  const { addToQueue } = useQueue();
  const { mappings } = useBoardMappings();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = () => {
    mutate();
    mutateStats();
  };

  const handleApprove = async (photo: Photo, boardId: string, linkUrl?: string) => {
    await addToQueue(photo.id, boardId, linkUrl);
    mutate();
  };

  const handleSkip = async (photoId: string) => {
    await api.updatePhotoStatus(photoId, 'skipped');
    mutate();
  };

  const handleGenerateTags = async (photoId: string) => {
    setGeneratingId(photoId);
    try {
      await api.generateTags(photoId);
      mutate();
    } catch (error) {
      console.error('Failed to generate tags:', error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!photos) return;

    for (const photo of photos) {
      const suggestedBoard = photo.tags?.[0] || 'neutral';
      const mapping = mappings?.find((m) => m.category === suggestedBoard);
      await addToQueue(photo.id, suggestedBoard, mapping?.link_url || undefined);
    }
    mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 skeleton rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-foreground">Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            {photos?.length || 0} photos ready for review
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowUpload(!showUpload)}
            variant="outline"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Photos
            {showUpload ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          {photos && photos.length > 0 && (
            <Button onClick={handleBulkApprove} variant="success" size="lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Bulk Approve All
            </Button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="section-card">
          <PhotoUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Photo List */}
      {!photos || photos.length === 0 ? (
        <div className="section-card">
          <EmptyState
            icon={<Images className="w-full h-full" />}
            title="No photos to review"
            description="Sync from Google Drive to add photos for review"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              mappings={mappings || []}
              onApprove={handleApprove}
              onSkip={handleSkip}
              onGenerateTags={handleGenerateTags}
              isGenerating={generatingId === photo.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
