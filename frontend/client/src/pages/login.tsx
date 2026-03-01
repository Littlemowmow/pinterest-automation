"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Lock, Loader2 } from "lucide-react";

const SITE_PASSWORD = "Sabira1998";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(false);

    // Small delay to feel natural
    setTimeout(() => {
      if (password === SITE_PASSWORD) {
        localStorage.setItem("authed", "true");
        onSuccess();
      } else {
        setError(true);
      }
      setChecking(false);
    }, 400);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-800 p-8 w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30">
            <Zap className="h-7 w-7 text-white" fill="white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              AutoPin
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Enter your password to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <Input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Password"
                className={`bg-zinc-800 border-zinc-700 text-zinc-100 pl-10 h-11 ${error ? "border-red-500/50 focus-visible:ring-red-500/30" : ""}`}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-red-400 pl-1">Incorrect password. Try again.</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={checking || !password}
            className="w-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/30 h-11"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
