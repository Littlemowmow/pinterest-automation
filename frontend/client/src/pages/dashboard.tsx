"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  CloudDownload,
  Loader2,
  Pencil,
  ImageIcon,
  CloudIcon,
  CheckCircle2,
  SendIcon,
  TagIcon,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  TrendingUp,
  CalendarClock,
  Pin,
} from "lucide-react";
import { toast } from "sonner";
import { syncPhotos, getPhotoStats, getSettings, getQueue, updateSettings } from "@/lib/api";
import { mockPhotoStats, mockSettings, mockScheduledPins, mockActivityFeed } from "@/lib/mock-data";
import type { PhotoStats, Settings, ScheduledPin } from "@/lib/types";

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatScheduledTime(dateStr: string | null) {
  if (!dateStr) return "Not scheduled";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getGreetingInfo(hour: number) {
  if (hour >= 5 && hour < 12) return { greeting: "Good morning", Icon: Sunrise, gradient: "from-amber-500/20 via-rose-500/10 to-transparent", accent: "text-amber-400", dot: "bg-amber-400" };
  if (hour >= 12 && hour < 17) return { greeting: "Good afternoon", Icon: Sun, gradient: "from-yellow-500/15 via-rose-500/10 to-transparent", accent: "text-yellow-400", dot: "bg-yellow-400" };
  if (hour >= 17 && hour < 21) return { greeting: "Good evening", Icon: Sunset, gradient: "from-orange-500/15 via-rose-500/10 to-transparent", accent: "text-orange-400", dot: "bg-orange-400" };
  return { greeting: "Good night", Icon: Moon, gradient: "from-indigo-500/15 via-rose-500/10 to-transparent", accent: "text-indigo-400", dot: "bg-indigo-400" };
}

const activityIcons: Record<string, { icon: typeof CloudIcon; color: string; bg: string }> = {
  sync: { icon: CloudIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
  approve: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  post: { icon: SendIcon, color: "text-rose-400", bg: "bg-rose-500/10" },
  tag: { icon: TagIcon, color: "text-purple-400", bg: "bg-purple-500/10" },
};

export default function Dashboard() {
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<PhotoStats>(mockPhotoStats);
  const [settings, setSettings] = useState<Settings>(mockSettings);
  const [nextPin, setNextPin] = useState<ScheduledPin | null>(mockScheduledPins[0] || null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editInterval, setEditInterval] = useState(String(mockSettings.posting_interval_hours));
  const [editTime, setEditTime] = useState(mockSettings.default_post_time);
  const [now, setNow] = useState(new Date());
  const initialized = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    Promise.all([
      getPhotoStats().then((r) => setStats(r.data)).catch(() => {}),
      getSettings().then((r) => {
        setSettings(r.data);
        setEditInterval(String(r.data.posting_interval_hours));
        setEditTime(r.data.default_post_time);
      }).catch(() => {}),
      getQueue()
        .then((r) => {
          const upcoming = r.data.pins?.filter((p: ScheduledPin) => !p.posted_at);
          if (upcoming?.length) setNextPin(upcoming[0]);
        })
        .catch(() => {}),
    ]);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await syncPhotos();
      toast.success("Photos synced from Google Drive");
      const r = await getPhotoStats().catch(() => null);
      if (r) setStats(r.data);
    } catch {
      toast.error("Sync failed — using cached data");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSaveSchedule() {
    try {
      await updateSettings({ posting_interval_hours: Number(editInterval), default_post_time: editTime });
      setSettings((s) => ({ ...s, posting_interval_hours: Number(editInterval), default_post_time: editTime }));
      toast.success("Schedule updated");
      setScheduleOpen(false);
    } catch {
      toast.error("Failed to save schedule");
    }
  }

  const hour = now.getHours();
  const { greeting, Icon: GreetingIcon, gradient, accent, dot } = getGreetingInfo(hour);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const statCards = [
    { label: "New Photos", value: stats.new, glow: "shadow-blue-500/20", border: "border-blue-500/20", accent: "text-blue-400", dotColor: "bg-blue-500", bar: "from-blue-500 to-blue-400" },
    { label: "Pending Review", value: stats.tagged, glow: "shadow-amber-500/20", border: "border-amber-500/20", accent: "text-amber-400", dotColor: "bg-amber-500", bar: "from-amber-500 to-amber-400" },
    { label: "Scheduled", value: stats.scheduled, glow: "shadow-purple-500/20", border: "border-purple-500/20", accent: "text-purple-400", dotColor: "bg-purple-500", bar: "from-purple-500 to-purple-400" },
    { label: "Posted", value: stats.posted, glow: "shadow-green-500/20", border: "border-green-500/20", accent: "text-green-400", dotColor: "bg-green-500", bar: "from-green-500 to-green-400" },
  ];

  return (
    <div className="space-y-6">
      <div className={`relative rounded-2xl bg-gradient-to-r ${gradient} border border-zinc-800/60 p-6 overflow-hidden`}>
        <div className="absolute inset-0 bg-zinc-900/60" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <GreetingIcon className={`h-5 w-5 ${accent}`} />
              <span className={`text-sm font-semibold ${accent} tracking-wide`}>{greeting}</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 leading-none" data-testid="text-welcome">
              Your board is growing
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">Manage your Pinterest posting pipeline</p>
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-2 w-2 rounded-full ${dot} animate-pulse`} />
              <span className="font-mono text-2xl font-bold text-zinc-100 tabular-nums tracking-tight" data-testid="text-live-time">{timeStr}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{dateStr}</p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30 mt-1"
            data-testid="button-sync"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
            <span className="ml-2">Sync from Drive</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className={`bg-zinc-900 ${card.border} p-5 shadow-lg ${card.glow} relative overflow-hidden group hover-elevate`}
            data-testid={`card-stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${card.bar} opacity-60`} />
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-2 w-2 rounded-full ${card.dotColor}`} />
              <span className="text-xs text-zinc-500 font-medium">{card.label}</span>
            </div>
            <p className={`text-4xl font-bold ${card.accent} leading-none tabular-nums`}>{card.value}</p>
            <TrendingUp className={`h-3.5 w-3.5 ${card.accent} mt-2 opacity-50`} />
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700">
              <CalendarClock className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Posting Schedule</p>
              <p className="text-sm text-zinc-200 mt-0.5">
                Every <span className="font-bold text-zinc-100">{settings.posting_interval_hours}h</span>{" "}
                at <span className="font-bold text-zinc-100">{settings.default_post_time}</span>
              </p>
            </div>
          </div>
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-edit-schedule">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Edit Posting Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block uppercase tracking-wide font-medium">Posting Interval</label>
                  <Select value={editInterval} onValueChange={setEditInterval}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="select-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="12">Every 12 hours</SelectItem>
                      <SelectItem value="24">Every 24 hours</SelectItem>
                      <SelectItem value="48">Every 48 hours</SelectItem>
                      <SelectItem value="72">Every 72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block uppercase tracking-wide font-medium">Default Post Time</label>
                  <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="input-post-time" />
                </div>
                <Button onClick={handleSaveSchedule} className="w-full bg-rose-500 text-white" data-testid="button-save-schedule">
                  Save Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-next-pin">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Next Pin</h2>
          </div>
          {nextPin ? (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-6 w-6 text-zinc-600" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-zinc-100 truncate">{nextPin.title || nextPin.photo.file_name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs no-default-active-elevate" data-testid="badge-board">
                    {nextPin.board_name}
                  </Badge>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatScheduledTime(nextPin.scheduled_for)}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {nextPin.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs text-zinc-500 border-zinc-700 no-default-active-elevate">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
                <ImageIcon className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">No pins in queue</p>
            </div>
          )}
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-activity">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Recent Activity</h2>
          </div>
          <div className="space-y-1">
            {mockActivityFeed.map((item, i) => {
              const entry = activityIcons[item.type] || activityIcons.sync;
              const Icon = entry.icon;
              return (
                <div key={item.id}>
                  <div className="flex items-start gap-3 py-2">
                    <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md ${entry.bg} flex items-center justify-center`}>
                      <Icon className={`h-3 w-3 ${entry.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300 truncate">{item.message}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{formatRelativeTime(item.time)}</p>
                    </div>
                  </div>
                  {i < mockActivityFeed.length - 1 && <Separator className="bg-zinc-800/60" />}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
