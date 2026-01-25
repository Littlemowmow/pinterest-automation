'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListOrdered, Pause, Play, AlertTriangle, GripVertical, X, Clock, ImageIcon } from 'lucide-react';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQueue } from '@/hooks/useQueue';
import { cn } from '@/lib/utils';
import type { ScheduledPin } from '@/lib/types';

export default function QueuePage() {
  const { pins, total, nextPost, isPaused, isLoading, reorder, remove, pause, resume, mutate } =
    useQueue();
  const [togglingPause, setTogglingPause] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && pins) {
      const oldIndex = pins.findIndex((p) => p.id === active.id);
      const newIndex = pins.findIndex((p) => p.id === over.id);
      reorder(active.id as string, newIndex);
    }
  };

  const handleRemove = async (pinId: string) => {
    await remove(pinId);
    mutate();
  };

  const handleTogglePause = async () => {
    setTogglingPause(true);
    try {
      if (isPaused) {
        await resume();
      } else {
        await pause();
      }
      mutate();
    } catch (error) {
      console.error('Failed to toggle pause:', error);
    } finally {
      setTogglingPause(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 skeleton rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-foreground">Posting Queue</h1>
          <p className="text-muted-foreground mt-1">
            {total} pins scheduled
            {nextPost && (
              <span className="ml-2">
                &bull; Next post in {formatDistanceToNow(new Date(nextPost))}
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={handleTogglePause}
          disabled={togglingPause}
          variant={isPaused ? 'default' : 'outline'}
          size="lg"
        >
          {isPaused ? (
            <>
              <Play className="w-5 h-5 mr-2" />
              Resume Queue
            </>
          ) : (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause Queue
            </>
          )}
        </Button>
      </div>

      {/* Paused Warning */}
      {isPaused && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-sm text-warning">
            Queue is paused. No pins will be posted until you resume.
          </p>
        </div>
      )}

      {/* Helper text */}
      {pins && pins.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Drag to reorder. Dates recalculate automatically.
        </p>
      )}

      {/* Queue List */}
      {!pins || pins.length === 0 ? (
        <div className="section-card">
          <EmptyState
            icon={<ListOrdered className="w-full h-full" />}
            title="Your queue is empty"
            description="Approve photos from the Review Queue to add them here"
          />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pins.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="relative">
              {pins.map((pin, index) => (
                <SortableQueueItem
                  key={pin.id}
                  pin={pin}
                  position={index + 1}
                  onRemove={handleRemove}
                  isFirst={index === 0}
                  isLast={index === pins.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableQueueItem({
  pin,
  position,
  onRemove,
  isFirst,
  isLast,
}: {
  pin: ScheduledPin;
  position: number;
  onRemove: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pin.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const scheduledDate = pin.scheduled_for ? new Date(pin.scheduled_for) : new Date();
  const formattedTime = format(scheduledDate, 'h:mm a');

  const getDateLabel = () => {
    if (isToday(scheduledDate)) return 'Today';
    if (isTomorrow(scheduledDate)) return 'Tomorrow';
    return format(scheduledDate, 'MMM d');
  };

  return (
    <div ref={setNodeRef} style={style} className="relative flex">
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
          isDragging && 'shadow-large ring-2 ring-primary/20 rotate-1 opacity-50'
        )}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Thumbnail */}
        {pin.photo_thumbnail_url || pin.photo_drive_url ? (
          <img
            src={pin.photo_thumbnail_url || pin.photo_drive_url}
            alt={pin.photo_file_name || ''}
            className="w-16 h-16 object-cover rounded-lg shadow-soft flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {pin.photo_file_name || 'Untitled'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {pin.board_id}
            </span>
            {pin.tags && pin.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground hidden sm:inline">
                #{tag}
              </span>
            ))}
            {pin.tags && pin.tags.length > 2 && (
              <span className="text-xs text-muted-foreground hidden sm:inline">+{pin.tags.length - 2}</span>
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
          onClick={() => onRemove(pin.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
