'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useQueue } from '@/hooks/useQueue';
import { useBoardMappings } from '@/hooks/useSettings';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Photo } from '@/lib/types';

export default function ReviewPage() {
  const { photos, isLoading, mutate } = usePhotos('tagged');
  const { addToQueue } = useQueue();
  const { mappings } = useBoardMappings();

  const handleApprove = async (photo: Photo, boardId: string, linkUrl?: string) => {
    await addToQueue(photo.id, boardId, linkUrl);
    mutate();
  };

  const handleSkip = async (photoId: string) => {
    await api.updatePhotoStatus(photoId, 'skipped');
    mutate();
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
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading photos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-sm text-gray-500">
            {photos?.length || 0} photos ready for review
          </p>
        </div>

        {photos && photos.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Bulk Approve All
          </button>
        )}
      </div>

      {!photos || photos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No photos to review</p>
          <p className="text-sm text-gray-400 mt-2">
            Sync from Google Drive to add photos
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {photos.map((photo) => (
            <PhotoReviewCard
              key={photo.id}
              photo={photo}
              mappings={mappings || []}
              onApprove={handleApprove}
              onSkip={handleSkip}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoReviewCard({
  photo,
  mappings,
  onApprove,
  onSkip,
}: {
  photo: Photo;
  mappings: { category: string; board_name: string; link_url?: string }[];
  onApprove: (photo: Photo, boardId: string, linkUrl?: string) => void;
  onSkip: (photoId: string) => void;
}) {
  const suggestedBoard = photo.tags?.[0] || 'neutral';
  const [selectedBoard, setSelectedBoard] = useState(suggestedBoard);
  const [tags, setTags] = useState<string[]>(photo.tags || []);
  const [useLink, setUseLink] = useState(
    !!mappings.find((m) => m.category === suggestedBoard)?.link_url
  );
  const [newTag, setNewTag] = useState('');

  const selectedMapping = mappings.find((m) => m.category === selectedBoard);

  const handleBoardChange = (board: string) => {
    setSelectedBoard(board);
    const mapping = mappings.find((m) => m.category === board);
    setUseLink(!!mapping?.link_url);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleApprove = () => {
    const linkUrl = useLink ? selectedMapping?.link_url : undefined;
    onApprove(photo, selectedBoard, linkUrl);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex gap-4">
        {/* Photo thumbnail */}
        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {photo.thumbnail_url || photo.drive_url ? (
            <img
              src={photo.thumbnail_url || photo.drive_url}
              alt={photo.file_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No preview
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate mb-2">{photo.file_name}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                onClick={() => handleRemoveTag(tag)}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded cursor-pointer hover:bg-red-100 hover:text-red-700"
              >
                {tag} ×
              </span>
            ))}
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="+ add tag"
              className="px-2 py-0.5 text-sm border border-dashed border-gray-300 rounded w-20 focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Board selector */}
          <div className="flex items-center gap-4 mb-3">
            <label className="text-sm text-gray-600">Board:</label>
            <select
              value={selectedBoard}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {mappings.map((m) => (
                <option key={m.category} value={m.category}>
                  {m.board_name}
                </option>
              ))}
            </select>
          </div>

          {/* Link checkbox */}
          {selectedMapping?.link_url && (
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <input
                type="checkbox"
                checked={useLink}
                onChange={(e) => setUseLink(e.target.checked)}
                className="rounded"
              />
              Link to: {selectedMapping.link_url}
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => onSkip(photo.id)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
