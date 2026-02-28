"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Loader2, Save, RefreshCw, CheckCircle, XCircle, FolderOpen, Sliders } from "lucide-react";
import { toast } from "sonner";
import {
  getSettings, updateSettings, getBoardMappings, updateBoardMapping, fetchPinterestBoards,
  getGoogleAuthUrl, getPinterestAuthUrl, disconnectGoogle, disconnectPinterest,
} from "@/lib/api";
import { mockSettings, mockBoardMappings } from "@/lib/mock-data";
import type { Settings, BoardMapping } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(mockSettings);
  const [mappings, setMappings] = useState<BoardMapping[]>(mockBoardMappings);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);
  const [fetchingBoards, setFetchingBoards] = useState(false);
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  const [editInterval, setEditInterval] = useState("24");
  const [editTime, setEditTime] = useState("10:00");
  const [editFolderId, setEditFolderId] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [settingsRes, mappingsRes] = await Promise.all([getSettings(), getBoardMappings()]);
      setSettings(settingsRes.data);
      setMappings(mappingsRes.data);
      setEditInterval(String(settingsRes.data.posting_interval_hours));
      setEditTime(settingsRes.data.default_post_time);
      setEditFolderId(settingsRes.data.drive_folder_id || "");
    } catch {
      setEditInterval(String(mockSettings.posting_interval_hours));
      setEditTime(mockSettings.default_post_time);
      setEditFolderId(mockSettings.drive_folder_id || "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true);
    try {
      await updateSettings({ posting_interval_hours: Number(editInterval), default_post_time: editTime });
      setSettings((s) => ({ ...s, posting_interval_hours: Number(editInterval), default_post_time: editTime }));
      toast.success("Schedule saved");
    } catch { toast.error("Failed to save"); }
    finally { setSavingSchedule(false); }
  }

  async function handleSaveFolder() {
    setSavingFolder(true);
    try {
      await updateSettings({ drive_folder_id: editFolderId });
      setSettings((s) => ({ ...s, drive_folder_id: editFolderId }));
      toast.success("Folder ID saved");
    } catch { toast.error("Failed to save"); }
    finally { setSavingFolder(false); }
  }

  async function handleFetchBoards() {
    setFetchingBoards(true);
    try {
      await fetchPinterestBoards();
      toast.success("Pinterest boards fetched");
    } catch { toast.error("Failed to fetch boards"); }
    finally { setFetchingBoards(false); }
  }

  async function handleSaveMapping(category: string) {
    const m = mappings.find((x) => x.category === category);
    if (!m) return;
    setSavingRows((s) => new Set(s).add(category));
    try {
      await updateBoardMapping(category, { board_id: m.board_id || undefined, board_name: m.board_name, link_url: m.link_url || undefined });
      toast.success(`"${category}" saved`);
    } catch { toast.error(`Failed to save "${category}"`); }
    finally { setSavingRows((s) => { const n = new Set(s); n.delete(category); return n; }); }
  }

  function handleMappingChange(category: string, field: keyof BoardMapping, value: string) {
    setMappings((prev) => prev.map((m) => (m.category === category ? { ...m, [field]: value } : m)));
  }

  async function handleDisconnectGoogle() {
    try { await disconnectGoogle(); } catch {}
    setSettings((s) => ({ ...s, google_connected: false }));
    toast.success("Google Drive disconnected");
  }

  async function handleDisconnectPinterest() {
    try { await disconnectPinterest(); } catch {}
    setSettings((s) => ({ ...s, pinterest_connected: false }));
    toast.success("Pinterest disconnected");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-36 bg-zinc-800" />
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-40 w-full bg-zinc-800 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your integrations and posting preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-google">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <FolderOpen className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Google Drive</h2>
              <p className="text-xs text-zinc-500">Photo source integration</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {settings.google_connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${settings.google_connected ? "text-green-400" : "text-red-400"}`}>
                {settings.google_connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            {settings.google_connected ? (
              <Button variant="ghost" size="sm" onClick={handleDisconnectGoogle} className="text-zinc-400 text-xs" data-testid="button-disconnect-google">
                Disconnect
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-rose-500 text-white text-xs" data-testid="button-connect-google">
                <a href={getGoogleAuthUrl()}>
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Connect
                </a>
              </Button>
            )}
          </div>

          <Separator className="bg-zinc-800 mb-4" />

          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Folder ID</label>
            <div className="flex gap-2">
              <Input
                value={editFolderId}
                onChange={(e) => setEditFolderId(e.target.value)}
                placeholder="Enter Drive folder ID"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                data-testid="input-folder-id"
              />
              <Button onClick={handleSaveFolder} disabled={savingFolder} size="icon" className="bg-rose-500 text-white flex-shrink-0" data-testid="button-save-folder">
                {savingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-pinterest">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <span className="text-rose-400 text-sm font-bold">P</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Pinterest</h2>
              <p className="text-xs text-zinc-500">Publishing integration</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.pinterest_connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${settings.pinterest_connected ? "text-green-400" : "text-red-400"}`}>
                {settings.pinterest_connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            {settings.pinterest_connected ? (
              <Button variant="ghost" size="sm" onClick={handleDisconnectPinterest} className="text-zinc-400 text-xs" data-testid="button-disconnect-pinterest">
                Disconnect
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-rose-500 text-white text-xs" data-testid="button-connect-pinterest">
                <a href={getPinterestAuthUrl()}>
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Connect
                </a>
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-posting">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Sliders className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Posting Configuration</h2>
            <p className="text-xs text-zinc-500">Frequency and timing settings</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Interval</label>
            <Select value={editInterval} onValueChange={setEditInterval}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200" data-testid="select-settings-interval">
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
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Default Time</label>
            <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" data-testid="input-settings-time" />
          </div>
        </div>
        <Button onClick={handleSaveSchedule} disabled={savingSchedule} className="mt-4 bg-rose-500 text-white shadow-sm shadow-rose-500/20" data-testid="button-save-posting">
          {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="ml-2">Save Schedule</span>
        </Button>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 p-5" data-testid="card-board-mappings">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Board Mappings</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Map categories to your Pinterest boards</p>
          </div>
          <Button variant="secondary" onClick={handleFetchBoards} disabled={fetchingBoards} className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm" data-testid="button-fetch-boards">
            {fetchingBoards ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Fetch Boards</span>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-xs text-zinc-500 uppercase tracking-wide">Category</TableHead>
                <TableHead className="text-xs text-zinc-500 uppercase tracking-wide">Board Name</TableHead>
                <TableHead className="text-xs text-zinc-500 uppercase tracking-wide">Board ID</TableHead>
                <TableHead className="text-xs text-zinc-500 uppercase tracking-wide">Link URL</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.category} className="border-zinc-800/60" data-testid={`row-mapping-${m.category}`}>
                  <TableCell>
                    <span className="text-sm font-semibold text-zinc-200 capitalize">{m.category}</span>
                  </TableCell>
                  <TableCell>
                    <Input value={m.board_name} onChange={(e) => handleMappingChange(m.category, "board_name", e.target.value)} className="bg-zinc-800 border-zinc-700/60 text-zinc-300 text-xs h-8" data-testid={`input-board-name-${m.category}`} />
                  </TableCell>
                  <TableCell>
                    <Input value={m.board_id || ""} onChange={(e) => handleMappingChange(m.category, "board_id", e.target.value)} className="bg-zinc-800 border-zinc-700/60 text-zinc-300 text-xs h-8" data-testid={`input-board-id-${m.category}`} />
                  </TableCell>
                  <TableCell>
                    <Input value={m.link_url || ""} onChange={(e) => handleMappingChange(m.category, "link_url", e.target.value)} className="bg-zinc-800 border-zinc-700/60 text-zinc-300 text-xs h-8" data-testid={`input-link-url-${m.category}`} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleSaveMapping(m.category)} disabled={savingRows.has(m.category)} className="text-zinc-500" data-testid={`button-save-mapping-${m.category}`}>
                      {savingRows.has(m.category) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
