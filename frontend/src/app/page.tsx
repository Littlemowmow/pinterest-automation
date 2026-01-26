'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Image, Clock, CheckCircle, Send, Pencil, Sun, Sunset, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/dashboard/StatCard';
import { NextPinPreview } from '@/components/dashboard/NextPinPreview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { usePhotoStats, useSyncPhotos } from '@/hooks/usePhotos';
import { useSettings } from '@/hooks/useSettings';
import { useQueue } from '@/hooks/useQueue';
import type { QueueItem } from '@/lib/types';

const INTERVALS = [
  { value: '6', label: 'Every 6 hours' },
  { value: '12', label: 'Every 12 hours' },
  { value: '24', label: 'Every 24 hours' },
  { value: '48', label: 'Every 2 days' },
  { value: '168', label: 'Every 7 days' },
];

// Mock activity data for now
const mockActivities = [
  { id: '1', type: 'posted' as const, message: 'Pin posted to Henna board', timestamp: '2 hours ago' },
  { id: '2', type: 'approved' as const, message: '5 photos approved for posting', timestamp: '4 hours ago' },
  { id: '3', type: 'synced' as const, message: '12 new photos synced from Drive', timestamp: 'Yesterday' },
  { id: '4', type: 'posted' as const, message: 'Pin posted to Bridal board', timestamp: '2 days ago' },
];

export default function Dashboard() {
  const { stats, isLoading: statsLoading, mutate: mutateStats } = usePhotoStats();
  const { settings, update: updateSettings } = useSettings();
  const { pins, nextPost, total: queueTotal } = useQueue();
  const { sync } = useSyncPhotos();

  const [syncing, setSyncing] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [tempInterval, setTempInterval] = useState(settings?.posting_interval_hours?.toString() || '12');
  const [tempTime, setTempTime] = useState(settings?.default_post_time?.slice(0, 5) || '09:00');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Convert first queue item to QueueItem format for NextPinPreview
  const nextQueueItem: QueueItem | null = pins?.[0] ? {
    id: pins[0].id,
    photo_id: pins[0].photo_id,
    board_id: pins[0].board_id,
    link_url: pins[0].link_url,
    title: pins[0].title,
    file_name: pins[0].photo_file_name,
    thumbnail_url: pins[0].photo_thumbnail_url,
    position: pins[0].position,
    scheduled_at: pins[0].scheduled_for || new Date().toISOString(),
    status: 'pending',
  } : null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await sync();
      mutateStats();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleScheduleSave = async () => {
    await updateSettings({
      posting_interval_hours: parseInt(tempInterval),
      default_post_time: tempTime + ':00',
    });
    setScheduleDialogOpen(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun, period: 'morning' };
    if (hour < 18) return { text: 'Good afternoon', icon: Sunset, period: 'afternoon' };
    return { text: 'Good evening', icon: Moon, period: 'evening' };
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const getIntervalLabel = () => {
    return INTERVALS.find((i) => i.value === settings?.posting_interval_hours?.toString())?.label || 'Every 12 hours';
  };

  if (statsLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="h-20 skeleton rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              greeting.period === 'morning' ? 'bg-amber-100 text-amber-600' :
              greeting.period === 'afternoon' ? 'bg-orange-100 text-orange-600' :
              'bg-indigo-100 text-indigo-600'
            }`}>
              <GreetingIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-display text-foreground">{greeting.text}</h1>
              <p className="text-sm text-muted-foreground">{formatTime()}</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-3">Here&apos;s what&apos;s happening with your Pinterest automation</p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing || !settings?.google_connected}
          size="lg"
          className="group shadow-glow"
        >
          <RefreshCw className={`w-5 h-5 mr-2 transition-transform group-hover:rotate-180 ${syncing ? 'animate-spin' : ''}`} />
          Sync from Drive
        </Button>
      </div>

      {/* Posting Schedule Inline */}
      <div className="section-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Posting Schedule</p>
            <p className="font-medium text-foreground">
              {getIntervalLabel()} at {settings?.default_post_time?.slice(0, 5) || '09:00'}
            </p>
          </div>
        </div>

        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Pencil className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Posting Schedule</DialogTitle>
              <DialogDescription>
                Configure how often pins are automatically posted
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Posting Interval</Label>
                <Select value={tempInterval} onValueChange={setTempInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVALS.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Post Time</Label>
                <Input
                  type="time"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleSave}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="New Photos"
          value={stats?.new || 0}
          icon={<Image className="w-full h-full" />}
          variant="warning"
          description="Awaiting review"
          href="/review"
        />
        <StatCard
          title="Pending Review"
          value={stats?.tagged || 0}
          icon={<Clock className="w-full h-full" />}
          variant="info"
          description="Ready for approval"
          href="/review"
        />
        <StatCard
          title="Scheduled"
          value={queueTotal || 0}
          icon={<Send className="w-full h-full" />}
          variant="primary"
          description="In posting queue"
          href="/queue"
        />
        <StatCard
          title="Posted"
          value={stats?.posted || 0}
          icon={<CheckCircle className="w-full h-full" />}
          variant="success"
          description="Successfully shared"
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NextPinPreview queueItem={nextQueueItem} />
        <ActivityFeed activities={mockActivities} />
      </div>
    </div>
  );
}
