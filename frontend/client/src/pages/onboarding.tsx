"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Zap, ArrowRight, ArrowLeft, ExternalLink, CheckCircle, XCircle, FolderOpen,
  Loader2, Sparkles, PartyPopper, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSettings, getGoogleAuthUrl, getPinterestAuthUrl } from "@/lib/api";
import type { Settings } from "@/lib/types";

const STEPS = ["Welcome", "Google Drive", "Pinterest", "Configure"];

function ConfettiCanvas() {
  useEffect(() => {
    const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#f43f5e", "#ec4899", "#a855f7", "#6366f1", "#3b82f6",
      "#22c55e", "#eab308", "#f97316", "#14b8a6", "#ff6b9d",
      "#c084fc", "#fbbf24", "#fb7185", "#34d399", "#60a5fa",
    ];

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      w: number; h: number; color: string; rotation: number;
      rotationSpeed: number; opacity: number; shape: "rect" | "circle" | "star";
    }

    const particles: Particle[] = [];
    const shapes: Particle["shape"][] = ["rect", "circle", "star"];

    // Burst from multiple points
    for (let burst = 0; burst < 5; burst++) {
      const bx = canvas.width * (0.2 + Math.random() * 0.6);
      const by = canvas.height * (0.2 + Math.random() * 0.3);
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        particles.push({
          x: bx, y: by,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          w: 6 + Math.random() * 8,
          h: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
    }

    let frame: number;
    function animate() {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.004;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === "circle") {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          // star
          ctx!.beginPath();
          for (let s = 0; s < 5; s++) {
            const a = (s * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = p.w / 2;
            if (s === 0) ctx!.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx!.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx!.closePath();
          ctx!.fill();
        }
        ctx!.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      id="confetti-canvas"
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    drive_folder_id: null,
    posting_interval_hours: 24,
    default_post_time: "10:00",
    google_connected: false,
    pinterest_connected: false,
  });
  const [folderId, setFolderId] = useState("");
  const [editInterval, setEditInterval] = useState("24");
  const [editTime, setEditTime] = useState("10:00");
  const [loading, setLoading] = useState(true);
  const [savingFolder, setSavingFolder] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
      if (res.data.drive_folder_id) setFolderId(res.data.drive_folder_id);
      setEditInterval(String(res.data.posting_interval_hours));
      setEditTime(res.data.default_post_time);
    } catch {}
  }, []);

  useEffect(() => {
    refreshSettings().finally(() => setLoading(false));
  }, [refreshSettings]);

  // Poll for connection status changes (user may have just connected via OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected" || params.get("pinterest") === "connected") {
      refreshSettings();
      // Clean up URL
      window.history.replaceState({}, "", "/onboarding");
    }
  }, [refreshSettings]);

  async function handleSaveFolder() {
    setSavingFolder(true);
    try {
      await updateSettings({ drive_folder_id: folderId });
      setSettings((s) => ({ ...s, drive_folder_id: folderId }));
      toast.success("Folder ID saved");
    } catch {
      toast.error("Failed to save folder ID");
    } finally {
      setSavingFolder(false);
    }
  }

  async function handleFinish() {
    setSavingConfig(true);
    try {
      await updateSettings({ posting_interval_hours: Number(editInterval), default_post_time: editTime });
    } catch {}
    setSavingConfig(false);

    // Show confetti!
    setShowConfetti(true);

    // Mark onboarding complete
    localStorage.setItem("onboarding_complete", "true");

    // Wait for confetti then redirect
    setTimeout(() => {
      setLocation("/");
    }, 3500);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {showConfetti && <ConfettiCanvas />}
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-pink-500" />
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="bg-zinc-900 border-zinc-800 p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30">
                <Zap className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-zinc-100">Welcome to AutoPin</h1>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
                Automate your Pinterest posting pipeline. Connect Google Drive as your photo source,
                tag and review images with AI, then schedule pins to your boards automatically.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 no-default-active-elevate">Google Drive Sync</Badge>
              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 no-default-active-elevate">AI Tagging</Badge>
              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 no-default-active-elevate">Auto Posting</Badge>
            </div>
            <Button
              onClick={() => setStep(1)}
              className="bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30 px-8"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* Step 1: Google Drive */}
        {step === 1 && (
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Connect Google Drive</h2>
                <p className="text-xs text-zinc-500">Your photo source for the pipeline</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
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
              {!settings.google_connected && (
                <Button asChild size="sm" className="bg-rose-500 text-white text-xs">
                  <a href={getGoogleAuthUrl()}>
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Connect
                  </a>
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Drive Folder ID</label>
              <p className="text-xs text-zinc-600">The ID from your Google Drive folder URL</p>
              <div className="flex gap-2">
                <Input
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="e.g. 1aBcDeFgHiJkLmNoPqRsT"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                />
                <Button
                  onClick={handleSaveFolder}
                  disabled={savingFolder || !folderId}
                  size="sm"
                  className="bg-rose-500 text-white flex-shrink-0"
                >
                  {savingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)} className="text-zinc-500">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(2)} className="bg-zinc-800 text-zinc-200 border border-zinc-700">
                {settings.google_connected ? "Next" : "Skip for now"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Pinterest */}
        {step === 2 && (
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <span className="text-rose-400 text-lg font-bold">P</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Connect Pinterest</h2>
                <p className="text-xs text-zinc-500">Where your pins will be published</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
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
              {!settings.pinterest_connected && (
                <Button asChild size="sm" className="bg-rose-500 text-white text-xs">
                  <a href={getPinterestAuthUrl()}>
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Connect
                  </a>
                </Button>
              )}
            </div>

            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-400/80 leading-relaxed">
                <strong>Note:</strong> If your Pinterest app is in trial/sandbox mode, you may need to
                request production access before pins can be published publicly. The connection will still
                work for testing.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-500">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="bg-zinc-800 text-zinc-200 border border-zinc-700">
                {settings.pinterest_connected ? "Next" : "Skip for now"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Configure */}
        {step === 3 && (
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-5">
            {showConfetti ? (
              <div className="text-center space-y-4 py-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-bounce">
                    <PartyPopper className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100">Happy Birthday! 🎂</h2>
                <p className="text-zinc-400 text-sm">Your AutoPin is all set up and ready to go!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">Configure Posting</h2>
                    <p className="text-xs text-zinc-500">Set your posting schedule</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Posting Interval</label>
                    <Select value={editInterval} onValueChange={setEditInterval}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
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
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Default Post Time</label>
                    <Input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-zinc-200"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3 space-y-2">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Setup Summary</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      {settings.google_connected ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                      <span className={settings.google_connected ? "text-zinc-300" : "text-zinc-600"}>Google Drive</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {settings.drive_folder_id ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                      <span className={settings.drive_folder_id ? "text-zinc-300" : "text-zinc-600"}>Folder ID</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {settings.pinterest_connected ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
                      <span className={settings.pinterest_connected ? "text-zinc-300" : "text-zinc-600"}>Pinterest</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-zinc-300">Every {editInterval}h at {editTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(2)} className="text-zinc-500">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={savingConfig}
                    className="bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30 px-6"
                  >
                    {savingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PartyPopper className="h-4 w-4 mr-2" />}
                    Finish Setup
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
