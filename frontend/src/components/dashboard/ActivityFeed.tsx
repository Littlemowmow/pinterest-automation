'use client';

import { CheckCircle, Clock, Image, XCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'posted' | 'approved' | 'skipped' | 'synced';
  message: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const activityColors = {
  posted: 'bg-success',
  approved: 'bg-primary',
  skipped: 'bg-muted-foreground',
  synced: 'bg-warning',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="section-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-section text-foreground">Recent Activity</h3>
        {activities.length > 5 && (
          <Link
            href="/queue"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="empty-state py-8">
          <Clock className="empty-state-icon" />
          <p className="empty-state-title">No recent activity</p>
          <p className="empty-state-description">
            Your activity will appear here once you start syncing and posting
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {activities.slice(0, 5).map((activity, index) => {
              return (
                <div key={activity.id} className="flex items-start gap-4 relative animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  {/* Timeline dot */}
                  <div className={cn('w-3 h-3 rounded-full border-2 border-background z-10', activityColors[activity.type])} />

                  <div className="flex-1 min-w-0 -mt-0.5">
                    <p className="text-sm text-foreground leading-relaxed">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
