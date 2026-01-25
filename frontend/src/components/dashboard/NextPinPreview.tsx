'use client';

import { Clock, ExternalLink, ImageIcon, CalendarClock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { QueueItem } from '@/lib/types';

interface NextPinPreviewProps {
  queueItem?: QueueItem | null;
}

export function NextPinPreview({ queueItem }: NextPinPreviewProps) {
  if (!queueItem) {
    return (
      <div className="section-card animate-fade-in">
        <h3 className="text-section text-foreground mb-4">Next Scheduled Pin</h3>
        <div className="empty-state py-8">
          <CalendarClock className="empty-state-icon" />
          <p className="empty-state-title">Your queue is empty</p>
          <p className="empty-state-description">
            Approve photos from the Review Queue to schedule them for posting
          </p>
          <Link href="/review">
            <Button variant="outline" size="sm" className="mt-4">
              Go to Review Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const scheduledDate = new Date(queueItem.scheduled_at);
  const timeUntil = formatDistanceToNow(scheduledDate, { addSuffix: false });
  const formattedDate = format(scheduledDate, 'MMM d, yyyy');
  const formattedTime = format(scheduledDate, 'h:mm a');

  return (
    <div className="section-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-section text-foreground">Next Scheduled Pin</h3>
        <div className="status-badge status-badge-info">
          <Clock className="w-3.5 h-3.5" />
          <span>In {timeUntil}</span>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Large Image Preview */}
        <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-medium flex-shrink-0">
          {queueItem.thumbnail_url ? (
            <>
              <img
                src={queueItem.thumbnail_url}
                alt={queueItem.file_name || 'Preview'}
                className="w-full h-full object-cover"
              />
              {/* Time overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium">{formattedTime}</p>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Pin Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <p className="font-medium text-foreground truncate">
              {queueItem.file_name || 'Untitled'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {formattedDate} at {formattedTime}
            </p>
            <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {queueItem.board_id}
            </span>
          </div>

          {queueItem.link_url && (
            <a
              href={queueItem.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
