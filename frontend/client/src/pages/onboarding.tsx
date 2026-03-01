"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight, ArrowLeft, PartyPopper, Crown, User, Cake,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = ["Welcome", "Your Name", "Birthday", "One More Thing"];

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
  const [userName, setUserName] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthdayError, setBirthdayError] = useState("");
  const [showWelcomeConfetti, setShowWelcomeConfetti] = useState(false);
  const [showBirthdayConfetti, setShowBirthdayConfetti] = useState(false);
  const isBelated = (() => { const now = new Date(); return now.getMonth() > 1 || (now.getMonth() === 1 && now.getDate() > 28); })();

  // Trigger welcome confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcomeConfetti(true), 500);
    return () => clearTimeout(timer);
  }, []);

  function handleNameSubmit() {
    if (!userName.trim()) return;
    localStorage.setItem("user_name", userName.trim());
    setStep(2);
  }

  function handleBirthdaySubmit() {
    const month = parseInt(birthMonth, 10);
    const day = parseInt(birthDay, 10);

    if (!birthMonth || !birthDay) {
      setBirthdayError("Nice try... you gotta fill in both fields!");
      return;
    }
    if (month !== 2 || day !== 28) {
      setBirthdayError("Hmm that doesn't look right... are you sure that's YOUR birthday? Try again!");
      return;
    }

    setBirthdayError("");
    localStorage.setItem("user_birthday", `${month}-${day}`);
    setShowBirthdayConfetti(true);

    setTimeout(() => {
      setShowBirthdayConfetti(false);
      setStep(3);
    }, 3000);
  }

  function handleFinish() {
    localStorage.setItem("onboarding_complete", "true");
    localStorage.setItem("show_tutorial", "true");
    setLocation("/");
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-6 gradient-shift-bg">
      {showWelcomeConfetti && step === 0 && <ConfettiCanvas key="welcome" />}
      {showBirthdayConfetti && <ConfettiCanvas key="birthday" />}
      <div className="w-full max-w-xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-pink-500 [&>div]:transition-all [&>div]:duration-500 [&>div]:ease-out" />
          </div>
        </div>

        <AnimatePresence mode="wait">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <motion.div key="step-0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <Card className="glass border-zinc-800/60 p-10 text-center space-y-7">
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30 animate-bounce">
                <Crown className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-zinc-100">Congratulations!</h1>
              <p className="text-lg text-rose-400 font-semibold">
                You are the ONLY user on this entire site.
              </p>
              <p className="text-zinc-400 text-base leading-relaxed max-w-md mx-auto">
                No other users. No waitlist. No "we'll get back to you." Just you. VIP status: confirmed.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 no-default-active-elevate">Population: 1</Badge>
              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 no-default-active-elevate">VIP Access</Badge>
              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 no-default-active-elevate">Zero Competition</Badge>
            </div>
            <Button
              onClick={() => setStep(1)}
              className="bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30 px-8"
            >
              I Accept My Throne
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
          </motion.div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <motion.div key="step-1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <Card className="glass border-zinc-800/60 p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <User className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">What's your name?</h2>
                <p className="text-sm text-zinc-500">So we can properly address our one and only user</p>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNameSubmit(); }}
                placeholder="Your name..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 text-base h-12"
                autoFocus
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)} className="text-zinc-500">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNameSubmit}
                disabled={!userName.trim()}
                className="bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30"
              >
                That's me
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
          </motion.div>
        )}

        {/* Step 2: Birthday */}
        {step === 2 && (
          <motion.div key="step-2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <Card className="glass border-zinc-800/60 p-8 space-y-6">
            {showBirthdayConfetti ? (
              <div className="text-center space-y-5 py-10">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-bounce">
                    <PartyPopper className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100">{isBelated ? `Looks like you missed your birthday gift on your day! Happy belated birthday, ${userName}!` : `Happy Birthday, ${userName}!`}</h2>
                <p className="text-zinc-400 text-base">Taking you to your dashboard...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                    <Cake className="h-6 w-6 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-100">One more thing, {userName}...</h2>
                    <p className="text-sm text-zinc-500">For totally legitimate security purposes</p>
                  </div>
                </div>

                <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-5">
                  <p className="text-base text-zinc-300 leading-relaxed">
                    We need to verify your identity using the most advanced security protocol known to mankind:
                    <span className="text-rose-400 font-semibold"> your birthday.</span>
                  </p>
                  <p className="text-sm text-zinc-500 mt-3">(Don't even think about lying. We'll know. But go ahead, try a fake one.)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Month</label>
                    <Select value={birthMonth} onValueChange={(v) => { setBirthMonth(v); setBirthdayError(""); }}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Day</label>
                    <Select value={birthDay} onValueChange={(v) => { setBirthDay(v); setBirthdayError(""); }}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {birthdayError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-xs text-red-400">{birthdayError}</p>
                  </motion.div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-500">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleBirthdaySubmit}
                    className="bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30"
                  >
                    Verify Me
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </Card>
          </motion.div>
        )}

        {/* Step 3: Warning message */}
        {step === 3 && (
          <motion.div key="step-3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <Card className="glass border-zinc-800/60 p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="text-2xl">😅</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">One more thing...</h2>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-5 space-y-4">
              <p className="text-base text-zinc-300 leading-relaxed">
                Hey ok so this is kinda awkward 😅 the Google Drive and Pinterest forms are waiting to be approved from Google and Pinterest so at the moment....this site is <span className="text-rose-400 font-bold">COMPLETELY USELESS</span>... but it will be fully functional soon and I think you'll really enjoy this once it's ready Insha'Allah.
              </p>
              <p className="text-base text-zinc-300 leading-relaxed">
                This took really long to make so I hope you at least enjoy the result 😊
              </p>
              <p className="text-sm text-zinc-500 mt-3 italic">— message from the supreme leader CEO of AutoPin</p>
            </div>

            <Button
              onClick={handleFinish}
              className="w-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30"
            >
              Take me to my useless dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
