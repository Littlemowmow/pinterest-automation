'use client';

import { useState } from 'react';
import { Check, X, Plus, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Photo, BoardMapping } from '@/lib/types';

interface PhotoCardProps {
  photo: Photo;
  mappings: BoardMapping[];
  onApprove: (photo: Photo, boardId: string, linkUrl?: string) => void;
  onSkip: (photoId: string) => void;
  onGenerateTags?: (photoId: string) => void;
  isGenerating?: boolean;
}

export function PhotoCard({
  photo,
  mappings,
  onApprove,
  onSkip,
  onGenerateTags,
  isGenerating = false,
}: PhotoCardProps) {
  const suggestedBoard = photo.tags?.[0] || 'neutral';
  const [tags, setTags] = useState<string[]>(photo.tags || []);
  const [selectedBoard, setSelectedBoard] = useState<string>(suggestedBoard);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [useLink, setUseLink] = useState(
    !!mappings.find((m) => m.category === suggestedBoard)?.link_url
  );

  const selectedMapping = mappings.find((m) => m.category === selectedBoard);

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleBoardChange = (board: string) => {
    setSelectedBoard(board);
    const mapping = mappings.find((m) => m.category === board);
    setUseLink(!!mapping?.link_url);
  };

  const handleApprove = () => {
    const linkUrl = useLink ? selectedMapping?.link_url : undefined;
    onApprove(photo, selectedBoard, linkUrl);
  };

  const visibleTags = tags.slice(0, 4);
  const remainingCount = tags.length - 4;

  return (
    <div
      className="bg-card rounded-xl shadow-soft border border-border p-4 flex items-center gap-4 transition-all duration-150 hover:bg-accent/30 hover:shadow-medium"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
        {photo.thumbnail_url || photo.drive_url ? (
          <img
            src={photo.thumbnail_url || photo.drive_url}
            alt={photo.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No preview</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Filename */}
        <p className="text-sm font-medium text-foreground truncate">{photo.file_name}</p>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-secondary text-muted-foreground text-xs px-2 py-1 rounded-full group cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => handleRemoveTag(tag)}
            >
              {tag}
              <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="bg-secondary text-muted-foreground text-xs px-2 py-1 rounded-full">
              +{remainingCount} more
            </span>
          )}

          {/* Add tag input or button */}
          {isHovered && (
            showTagInput ? (
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                onBlur={() => {
                  handleAddTag();
                  setShowTagInput(false);
                }}
                placeholder="Add tag..."
                className="bg-background border border-input text-xs px-2 py-1 rounded-full outline-none focus:border-ring w-20"
                autoFocus
              />
            ) : (
              <button
                className="inline-flex items-center gap-1 bg-secondary text-muted-foreground text-xs px-2 py-1 rounded-full hover:bg-accent transition-colors"
                onClick={() => setShowTagInput(true)}
              >
                <Plus className="w-3 h-3" />
              </button>
            )
          )}

          {/* Generate Tags button */}
          {onGenerateTags && (
            <button
              className="inline-flex items-center gap-1 border border-input text-muted-foreground text-xs px-3 py-1 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              onClick={() => onGenerateTags(photo.id)}
              disabled={isGenerating}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Tags'}
            </button>
          )}
        </div>

        {/* Board selector row */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Board:</span>
          <Select value={selectedBoard} onValueChange={handleBoardChange}>
            <SelectTrigger className="w-32 h-7 text-xs bg-background border-input">
              <SelectValue placeholder="Select board" />
            </SelectTrigger>
            <SelectContent>
              {mappings.map((mapping) => (
                <SelectItem key={mapping.category} value={mapping.category} className="text-sm">
                  {mapping.board_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Link checkbox */}
          {selectedMapping?.link_url && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
              <input
                type="checkbox"
                checked={useLink}
                onChange={(e) => setUseLink(e.target.checked)}
                className="rounded border-input"
              />
              Include link
            </label>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="inline-flex items-center gap-1.5 border border-input text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          onClick={() => onSkip(photo.id)}
        >
          <X className="w-4 h-4" />
          Skip
        </button>
        <button
          className="inline-flex items-center gap-1.5 bg-success text-success-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleApprove}
          disabled={!selectedBoard}
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
      </div>
    </div>
  );
}
