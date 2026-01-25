'use client';

import { GripVertical, X, Clock, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';

interface QueueItemProps {
  id: string;
  position: number;
  thumbnailUrl?: string;
  filename: string;
  board: string;
  tags?: string[];
  scheduledAt: string;
  onRemove: (id: string) => void;
  isDragging?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export function QueueItemCard({
  id,
  position,
  thumbnailUrl,
  filename,
  board,
  tags = [],
  scheduledAt,
  onRemove,
  isDragging = false,
  isFirst = false,
  isLast = false,
}: QueueItemProps) {
  const scheduledDate = new Date(scheduledAt);
  const formattedTime = format(scheduledDate, 'h:mm a');

  const getDateLabel = () => {
    if (isToday(scheduledDate)) return 'Today';
    if (isTomorrow(scheduledDate)) return 'Tomorrow';
    return format(scheduledDate, 'MMM d');
  };

  return (
    <div className="relative flex">
      {/* Timeline connector */}
      <div className="flex flex-col items-center mr-4 flex-shrink-0">
        {!isFirst && <div className="w-px h-4 bg-border" />}
        <div className={cn(
          'w-3 h-3 rounded-full border-2 border-background z-10 flex-shrink-0',
          position === 1 ? 'bg-primary' : 'bg-border'
        )} />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* Card */}
      <div
        className={cn(
          'queue-item flex items-center gap-4 flex-1 mb-3 group',
          isDragging && 'shadow-large ring-2 ring-primary/20 rotate-1'
        )}
      >
        {/* Drag Handle */}
        <button className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Thumbnail */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={filename}
            className="w-16 h-16 object-cover rounded-lg shadow-soft flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{filename}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {board}
            </span>
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground hidden sm:inline">
                #{tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-muted-foreground hidden sm:inline">+{tags.length - 2}</span>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {formattedTime}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{getDateLabel()}</p>
        </div>

        {/* Remove Button - appears on hover */}
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          onClick={() => onRemove(id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
