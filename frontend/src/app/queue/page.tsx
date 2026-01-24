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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueue } from '@/hooks/useQueue';
import { formatDate } from '@/lib/utils';
import type { ScheduledPin } from '@/lib/types';

export default function QueuePage() {
  const { pins, total, nextPost, isPaused, isLoading, reorder, remove, pause, resume } =
    useQueue();

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
    if (confirm('Remove this pin from the queue?')) {
      await remove(pinId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading queue...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posting Queue</h1>
          <p className="text-sm text-gray-500">
            {total} pins scheduled
            {nextPost && (
              <> · Next post: {formatDate(nextPost)}</>
            )}
          </p>
        </div>

        <button
          onClick={isPaused ? resume : pause}
          className={`px-4 py-2 rounded-lg font-medium ${
            isPaused
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          }`}
        >
          {isPaused ? 'Resume Queue' : 'Pause Queue'}
        </button>
      </div>

      {isPaused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Queue is paused. No pins will be posted until resumed.
          </p>
        </div>
      )}

      {!pins || pins.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No pins in queue</p>
          <p className="text-sm text-gray-400 mt-2">
            Approve photos in the Review tab to add them to the queue
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pins.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {pins.map((pin, index) => (
                <SortableQueueItem
                  key={pin.id}
                  pin={pin}
                  position={index + 1}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="mt-4 text-sm text-gray-400 text-center">
        Drag items to reorder. Dates will recalculate automatically.
      </p>
    </div>
  );
}

function SortableQueueItem({
  pin,
  position,
  onRemove,
}: {
  pin: ScheduledPin;
  position: number;
  onRemove: (id: string) => void;
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-4"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 px-1"
      >
        ≡
      </div>

      {/* Position */}
      <div className="text-sm font-medium text-gray-500 w-6">#{position}</div>

      {/* Thumbnail */}
      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {pin.photo_thumbnail_url || pin.photo_drive_url ? (
          <img
            src={pin.photo_thumbnail_url || pin.photo_drive_url}
            alt={pin.photo_file_name || ''}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            ?
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm">
          {pin.photo_file_name || 'Untitled'}
        </p>
        <p className="text-xs text-gray-500">
          Board: {pin.board_id}
          {pin.tags && pin.tags.length > 0 && (
            <> · {pin.tags.slice(0, 3).join(', ')}</>
          )}
        </p>
      </div>

      {/* Scheduled time */}
      <div className="text-sm text-gray-600">
        {pin.scheduled_for ? formatDate(pin.scheduled_for) : 'Not scheduled'}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(pin.id)}
        className="text-gray-400 hover:text-red-600 p-1"
        title="Remove from queue"
      >
        ×
      </button>
    </div>
  );
}
