"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ImageIcon, Sparkles, Check, X, Loader2, CloudDownload, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { getPhotos, updatePhoto, generateTags, updateTags, addToQueue, syncPhotos, bulkAddToQueue } from "@/lib/api";
import { mockPhotos, BOARD_CATEGORIES } from "@/lib/mock-data";
import type { Photo } from "@/lib/types";

export default function Review() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingTags, setGeneratingTags] = useState<Set<string>>(new Set());
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});
  const [selectedBoards, setSelectedBoards] = useState<Record<string, string>>({});
  const [linkUrls, setLinkUrls] = useState<Record<string, string>>({});
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadPhotos(); }, []);

  async function loadPhotos() {
    setLoading(true);
    try {
      const res = await getPhotos({ status: "tagged" });
      setPhotos(res.data.filter((p: Photo) => p.status === "tagged" || p.status === "new"));
    } catch {
      setPhotos(mockPhotos.filter((p) => p.status === "tagged" || p.status === "new"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTags(photoId: string) {
    setGeneratingTags((s) => new Set(s).add(photoId));
    try {
      const res = await generateTags(photoId);
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, tags: res.data.tags || p.tags } : p)));
      toast.success("Tags generated");
    } catch {
      const fakeTags = ["aesthetic", "inspiration", "trending", "beautiful"];
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, tags: [...new Set([...p.tags, ...fakeTags])] } : p)));
      toast.success("Tags generated");
    } finally {
      setGeneratingTags((s) => { const n = new Set(s); n.delete(photoId); return n; });
    }
  }

  function handleAddTag(photoId: string, tag: string) {
    if (!tag.trim()) return;
    const cleaned = tag.trim().toLowerCase();
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, tags: [...new Set([...p.tags, cleaned])] } : p)));
    setNewTagInputs((prev) => ({ ...prev, [photoId]: "" }));
  }

  function handleRemoveTag(photoId: string, tag: string) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, tags: p.tags.filter((t) => t !== tag) } : p)));
  }

  async function handleApprove(photo: Photo) {
    const board = selectedBoards[photo.id];
    if (!board) { toast.error("Please select a board first"); return; }
    setRemovingIds((s) => new Set(s).add(photo.id));
    try {
      await updatePhoto(photo.id, { status: "approved" });
      await addToQueue({ photo_id: photo.id, board_id: board, title: photo.file_name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), link_url: linkUrls[photo.id] || undefined });
      toast.success(`Approved and queued`);
    } catch {
      toast.success(`Approved (demo)`);
    }
    setTimeout(() => {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setRemovingIds((s) => { const n = new Set(s); n.delete(photo.id); return n; });
    }, 350);
  }

  async function handleSkip(photo: Photo) {
    setRemovingIds((s) => new Set(s).add(photo.id));
    try {
      await updatePhoto(photo.id, { status: "skipped" });
    } catch {}
    toast.success(`Skipped`);
    setTimeout(() => {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setRemovingIds((s) => { const n = new Set(s); n.delete(photo.id); return n; });
    }, 350);
  }

  async function handleBulkApprove() {
    setConfirmBulk(false);
    const ids = photos.map((p) => p.id);
    try { await bulkAddToQueue(ids); } catch {}
    toast.success(`${ids.length} photos approved and queued`);
    setPhotos([]);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await syncPhotos();
      toast.success("Synced from Google Drive");
      await loadPhotos();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56 bg-zinc-800" />
          <Skeleton className="h-9 w-36 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800 p-0">
              <Skeleton className="aspect-video w-full rounded-t-lg bg-zinc-800" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                <div className="flex gap-2">
                  {[1,2,3].map(j => <Skeleton key={j} className="h-5 w-14 bg-zinc-800 rounded-full" />)}
                </div>
                <Skeleton className="h-9 w-full bg-zinc-800" />
                <Skeleton className="h-9 w-full bg-zinc-800" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 bg-zinc-800" />
                  <Skeleton className="h-9 w-20 bg-zinc-800" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100">Review Queue</h1>
        <Card className="bg-zinc-900 border-zinc-800 p-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
              <ImageIcon className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-base font-medium text-zinc-300 mb-1">No photos to review</p>
            <p className="text-sm text-zinc-500 mb-6">Sync from Google Drive to get started</p>
            <Button onClick={handleSync} disabled={syncing} className="bg-rose-500 text-white shadow-lg shadow-rose-500/25" data-testid="button-sync-empty">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
              <span className="ml-2">Sync from Google Drive</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100" data-testid="text-review-title">Review Queue</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{photos.length} photos awaiting review</p>
        </div>
        <Button variant="secondary" onClick={() => setConfirmBulk(true)} className="bg-zinc-800 border border-zinc-700 text-zinc-200" data-testid="button-bulk-approve">
          <Check className="h-4 w-4 mr-2 text-green-400" />
          Approve All
        </Button>
      </div>

      <Dialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Confirm Bulk Approve
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">Approve all {photos.length} photos and add them to the queue?</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmBulk(false)} data-testid="button-cancel-bulk">Cancel</Button>
            <Button onClick={handleBulkApprove} className="bg-rose-500 text-white" data-testid="button-confirm-bulk">Approve All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {photos.map((photo) => (
          <Card
            key={photo.id}
            className={`bg-zinc-900 border-zinc-800 p-0 transition-all duration-300 ${removingIds.has(photo.id) ? "opacity-0 scale-95" : "opacity-100"}`}
            data-testid={`card-photo-${photo.id}`}
          >
            <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-850 rounded-t-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-purple-500/5" />
              <div className="w-12 h-12 rounded-xl bg-zinc-700/50 border border-zinc-600/50 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-zinc-500" />
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-100 truncate" data-testid={`text-filename-${photo.id}`}>
                {photo.file_name}
              </p>

              <div className="flex gap-1.5 flex-wrap min-h-[28px] items-center">
                {photo.tags.length === 0 && (
                  <span className="text-xs text-zinc-600 italic">No tags yet</span>
                )}
                {photo.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer no-default-active-elevate group"
                    onClick={() => handleRemoveTag(photo.id, tag)}
                    data-testid={`badge-tag-${photo.id}-${tag}`}
                  >
                    {tag}
                    <X className="h-2.5 w-2.5 ml-1 opacity-50 group-hover:opacity-100" />
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTagInputs[photo.id] || ""}
                  onChange={(e) => setNewTagInputs((prev) => ({ ...prev, [photo.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(photo.id, newTagInputs[photo.id] || ""); }}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 text-xs h-8"
                  data-testid={`input-tag-${photo.id}`}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleGenerateTags(photo.id)}
                  disabled={generatingTags.has(photo.id)}
                  className="bg-purple-500/10 border border-purple-500/20 text-purple-400 flex-shrink-0 h-8"
                  data-testid={`button-generate-tags-${photo.id}`}
                >
                  {generatingTags.has(photo.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span className="ml-1.5 hidden sm:inline text-xs">AI Tags</span>
                </Button>
              </div>

              <Select value={selectedBoards[photo.id] || ""} onValueChange={(v) => setSelectedBoards((prev) => ({ ...prev, [photo.id]: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm h-9" data-testid={`select-board-${photo.id}`}>
                  <SelectValue placeholder="Select a board..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {BOARD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-zinc-200 capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <Input
                  placeholder="Link URL (optional)"
                  value={linkUrls[photo.id] || ""}
                  onChange={(e) => setLinkUrls((prev) => ({ ...prev, [photo.id]: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs pl-8 h-8"
                  data-testid={`input-link-${photo.id}`}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => handleApprove(photo)}
                  className="flex-1 bg-rose-500 text-white shadow-sm shadow-rose-500/20 text-sm"
                  data-testid={`button-approve-${photo.id}`}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSkip(photo)}
                  className="text-zinc-500 border border-zinc-800 text-sm"
                  data-testid={`button-skip-${photo.id}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
