"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GripVertical, ImageIcon, Trash2, CheckCircle2, Loader2, Clock, AlertTriangle, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getQueue, removeFromQueue, reorderQueueItem, pauseQueue, resumeQueue, getSettings } from "@/lib/api";
import { mockScheduledPins, mockSettings } from "@/lib/mock-data";
import type { ScheduledPin, Settings } from "@/lib/types";

function formatTime(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function SortableRow({ pin, onDelete }: { pin: ScheduledPin; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pin.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 group transition-colors ${isDragging ? "border-rose-500/40 shadow-lg shadow-rose-500/10" : ""}`}
      data-testid={`row-pin-${pin.id}`}
    >
      <button className="cursor-grab text-zinc-700 hover-elevate flex-shrink-0 touch-none" {...attributes} {...listeners} data-testid={`drag-handle-${pin.id}`}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="w-11 h-11 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
        <ImageIcon className="h-4 w-4 text-zinc-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100 truncate">{pin.title || pin.photo.file_name}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="secondary" className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 no-default-active-elevate">{pin.board_name}</Badge>
          {pin.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs text-zinc-600 border-zinc-700/50 no-default-active-elevate">{tag}</Badge>
          ))}
          {pin.tags.length > 3 && <span className="text-xs text-zinc-600">+{pin.tags.length - 3}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />{formatTime(pin.scheduled_for)}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">Pos #{pin.position}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(pin.id)} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-delete-${pin.id}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PostedRow({ pin }: { pin: ScheduledPin }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 opacity-50" data-testid={`row-posted-${pin.id}`}>
      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      <div className="w-11 h-11 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
        <ImageIcon className="h-4 w-4 text-zinc-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-300 truncate">{pin.title || pin.photo.file_name}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 no-default-active-elevate">{pin.board_name}</Badge>
          {pin.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs text-zinc-600 border-zinc-700/50 no-default-active-elevate">{tag}</Badge>
          ))}
        </div>
      </div>
      <div className="text-right hidden sm:block flex-shrink-0">
        <p className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(pin.posted_at)}</p>
        <p className="text-xs text-green-600 mt-0.5">Posted</p>
      </div>
    </div>
  );
}

export default function Queue() {
  const [pins, setPins] = useState<ScheduledPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [nextPost, setNextPost] = useState<string | null>(null);
  const [tab, setTab] = useState("upcoming");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(mockSettings);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { loadQueue(); }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const [queueRes, settingsRes] = await Promise.all([getQueue(), getSettings()]);
      setPins(queueRes.data.pins || []);
      setIsPaused(queueRes.data.is_paused || false);
      setNextPost(queueRes.data.next_post || null);
      setSettings(settingsRes.data);
    } catch {
      setPins(mockScheduledPins);
      setNextPost("2026-03-01T10:00:00Z");
    } finally {
      setLoading(false);
    }
  }

  const upcomingPins = pins.filter((p) => !p.posted_at);
  const postedPins = pins.filter((p) => p.posted_at);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = upcomingPins.findIndex((p) => p.id === active.id);
    const newIndex = upcomingPins.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(upcomingPins, oldIndex, newIndex);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = settings.default_post_time.split(":").map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);
    const recalculated = reordered.map((pin, i) => {
      const t = new Date(tomorrow);
      t.setHours(t.getHours() + i * settings.posting_interval_hours);
      return { ...pin, position: i + 1, scheduled_for: t.toISOString() };
    });
    setPins([...recalculated, ...postedPins]);
    reorderQueueItem(String(active.id), newIndex + 1).catch(() => {});
    toast.success("Queue reordered");
  }

  async function handleTogglePause() {
    try {
      if (isPaused) { await resumeQueue(); setIsPaused(false); toast.success("Queue resumed"); }
      else { await pauseQueue(); setIsPaused(true); toast.success("Queue paused"); }
    } catch {
      setIsPaused(!isPaused);
      toast.success(isPaused ? "Queue resumed" : "Queue paused");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try { await removeFromQueue(deleteId); } catch {}
    setPins((prev) => prev.filter((p) => p.id !== deleteId));
    toast.success("Pin removed");
    setDeleteId(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-48 bg-zinc-800" /><Skeleton className="h-9 w-32 bg-zinc-800" /></div>
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-[72px] w-full bg-zinc-800 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100" data-testid="text-queue-title">Posting Queue</h1>
          <div className="flex items-center gap-3 mt-1">
            {nextPost && (
              <span className="text-sm text-zinc-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-rose-400" />
                Next: <span className="text-zinc-400">{formatTime(nextPost)}</span>
              </span>
            )}
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-sm text-zinc-500">{upcomingPins.length} queued</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
            {isPaused ? <PauseCircle className="h-4 w-4 text-amber-400" /> : <PlayCircle className="h-4 w-4 text-green-400" />}
            <span className="text-sm text-zinc-300">{isPaused ? "Paused" : "Active"}</span>
            <Switch checked={!isPaused} onCheckedChange={handleTogglePause} data-testid="switch-pause" />
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 text-sm" data-testid="tab-upcoming">
            Upcoming <Badge className="ml-1.5 bg-zinc-700 text-zinc-300 text-xs no-default-active-elevate">{upcomingPins.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="posted" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 text-sm" data-testid="tab-posted">
            Posted <Badge className="ml-1.5 bg-zinc-700 text-zinc-300 text-xs no-default-active-elevate">{postedPins.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "upcoming" && (
        upcomingPins.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 p-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-base font-medium text-zinc-400 mb-1">Queue is empty</p>
              <p className="text-sm text-zinc-600">Approve photos in Review to start scheduling</p>
            </div>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={upcomingPins.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {upcomingPins.map((pin) => (
                  <SortableRow key={pin.id} pin={pin} onDelete={setDeleteId} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )
      )}

      {tab === "posted" && (
        postedPins.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 p-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-base font-medium text-zinc-400">No posted pins yet</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {postedPins.map((pin) => <PostedRow key={pin.id} pin={pin} />)}
          </div>
        )
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Remove Pin
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">Remove this pin from the queue? This can't be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)} data-testid="button-cancel-delete">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="button-confirm-delete">Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
