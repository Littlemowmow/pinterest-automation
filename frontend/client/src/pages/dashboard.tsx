"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  CloudDownload,
  Loader2,
  Pencil,
  ImageIcon,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  TrendingUp,
  CalendarClock,
  Pin,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { getBoardMappings } from "@/lib/api";
import { toast } from "sonner";
import { syncPhotos, getPhotoStats, getSettings, getQueue, updateSettings } from "@/lib/api";
import type { PhotoStats, Settings, ScheduledPin } from "@/lib/types";

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) return;
    const duration = 600;
    const startTime = performance.now();
    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    prevValue.current = end;
  }, [value]);
  return <>{display}</>;
}

import {
  LayoutDashboard, Image, ListOrdered, Settings2, Sparkles, X,
} from "lucide-react";

const tutorialSteps = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "This is your home base. See your stats, next scheduled pin, and posting schedule all in one place.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Image,
    title: "Review",
    desc: "Photos from Google Drive land here. You can generate AI tags, pick a board, then approve or skip each one.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: ListOrdered,
    title: "Queue",
    desc: "Approved photos get scheduled here. Drag to reorder, pause the queue, or remove pins before they post.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Settings2,
    title: "Settings",
    desc: "Connect Google Drive and Pinterest, set your posting interval, and map boards to categories.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Sparkles,
    title: "You're ready!",
    desc: "That's the whole app. Head to Settings to connect your accounts and start pinning automatically.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
];

function AppTutorial({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= tutorialSteps.length - 1) return;
    const timer = setTimeout(() => setCurrent((c) => c + 1), 3500);
    return () => clearTimeout(timer);
  }, [current]);

  const step = tutorialSteps[current];
  const Icon = step.icon;
  const isLast = current === tutorialSteps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDone} />
      <motion.div
        className="relative w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className="glass border-zinc-800/60 p-6 space-y-5 shadow-2xl">
          <button onClick={onDone} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="h-4 w-4" />
          </button>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5">
            {tutorialSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === current ? "w-6 bg-rose-500" : i < current ? "w-1.5 bg-rose-500/40" : "w-1.5 bg-zinc-700"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className={`w-14 h-14 rounded-2xl ${step.bg} border flex items-center justify-center`}>
                <Icon className={`h-7 w-7 ${step.color}`} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-100">{step.title}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
              animate={{ width: `${((current + 1) / tutorialSteps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {isLast && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Button
                onClick={onDone}
                className="w-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30"
              >
                Let's go!
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const fadeUpItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

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

export default function Dashboard() {
  const [showTutorial, setShowTutorial] = useState(() => {
    if (localStorage.getItem("show_tutorial") === "true") {
      localStorage.removeItem("show_tutorial");
      return true;
    }
    return false;
  });
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<PhotoStats>({ new: 0, tagged: 0, approved: 0, scheduled: 0, posted: 0, skipped: 0 });
  const [settings, setSettings] = useState<Settings>({ drive_folder_id: null, posting_interval_hours: 24, default_post_time: "10:00", google_connected: false, pinterest_connected: false });
  const [nextPin, setNextPin] = useState<ScheduledPin | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editInterval, setEditInterval] = useState("24");
  const [editTime, setEditTime] = useState("10:00");
  const [now, setNow] = useState(new Date());
  const [hasBoardMappings, setHasBoardMappings] = useState(false);
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
      getBoardMappings()
        .then((r) => {
          const mappings = Array.isArray(r.data) ? r.data : [];
          setHasBoardMappings(mappings.some((m: { board_id?: string | null }) => m.board_id));
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
  const userName = localStorage.getItem("user_name");
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
      <AnimatePresence>
        {showTutorial && <AppTutorial onDone={() => setShowTutorial(false)} />}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className={`relative rounded-2xl bg-gradient-to-r ${gradient} border border-zinc-800/60 p-6 overflow-hidden gradient-shift-bg`}
      >
        <div className="absolute inset-0 bg-zinc-900/60" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <GreetingIcon className={`h-5 w-5 ${accent}`} />
              <span className={`text-sm font-semibold ${accent} tracking-wide`}>{greeting}{userName ? `, ${userName}` : ""}</span>
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
      </motion.div>

      {(() => {
        const checks = [
          { label: "Connect Google Drive", done: settings.google_connected },
          { label: "Set Drive Folder ID", done: !!settings.drive_folder_id },
          { label: "Connect Pinterest", done: settings.pinterest_connected },
          { label: "Map Board IDs", done: hasBoardMappings },
        ];
        const doneCount = checks.filter((c) => c.done).length;
        if (doneCount < 4) {
          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="glass border-zinc-800/60 p-5" data-testid="card-setup-checklist">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-100">Setup Progress ({doneCount}/{checks.length} complete)</h2>
                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs no-default-active-elevate">{Math.round((doneCount / checks.length) * 100)}%</Badge>
              </div>
              <div className="relative">
                <Progress value={(doneCount / checks.length) * 100} className="h-2 bg-zinc-800 mb-4 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-pink-500" />
                <div className="absolute inset-0 h-2 rounded-full shimmer-bg" />
              </div>
              <div className="space-y-2">
                {checks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-zinc-700" />
                      )}
                      <span className={`text-sm ${item.done ? "text-zinc-400 line-through" : "text-zinc-200"}`}>{item.label}</span>
                    </div>
                    {!item.done && (
                      <Link href="/settings">
                        <Button variant="ghost" size="sm" className="text-xs text-rose-400 h-7 px-2">
                          Go to Settings
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            </motion.div>
          );
        }
        return null;
      })()}

      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {statCards.map((card) => (
          <motion.div key={card.label} variants={fadeUpItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
            <Card
              className={`bg-zinc-900 ${card.border} p-5 shadow-lg ${card.glow} relative overflow-hidden group transition-shadow duration-300 hover:shadow-xl`}
              data-testid={`card-stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${card.bar} opacity-60`} />
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-2 w-2 rounded-full ${card.dotColor}`} />
                <span className="text-xs text-zinc-500 font-medium">{card.label}</span>
              </div>
              <p className={`text-4xl font-bold ${card.accent} leading-none tabular-nums`}><AnimatedCounter value={card.value} /></p>
              <TrendingUp className={`h-3.5 w-3.5 ${card.accent} mt-2 opacity-50`} />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
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
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeUpItem} whileHover={{ y: -2 }}>
        <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-next-pin">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Next Pin</h2>
          </div>
          {nextPin ? (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {(nextPin.photo_storage_url || nextPin.photo_thumbnail_url) ? (
                  <img src={nextPin.photo_storage_url || nextPin.photo_thumbnail_url || ""} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-zinc-600" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-zinc-100 truncate">{nextPin.title || nextPin.photo_file_name}</p>
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
        </motion.div>

        <motion.div variants={fadeUpItem} whileHover={{ y: -2 }}>
        <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-activity">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Recent Activity</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
              <Clock className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No activity yet</p>
            <p className="text-xs text-zinc-600 mt-1">Activity will appear here as you use AutoPin</p>
          </div>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
