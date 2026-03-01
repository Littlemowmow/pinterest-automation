import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Review from "@/pages/review";
import Queue from "@/pages/queue";
import SettingsPage from "@/pages/settings";
import Privacy from "@/pages/privacy";
import Onboarding from "@/pages/onboarding";
import Login from "@/pages/login";
import { getSettings } from "@/lib/api";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/review": "Review",
  "/queue": "Queue",
  "/settings": "Settings",
};

function TopBar() {
  const [location] = useLocation();
  const title = pageTitles[location] || "AutoPin";
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm lg:hidden sticky top-0 z-50">
      <SidebarTrigger data-testid="button-sidebar-toggle" className="text-zinc-400" />
      <span className="text-sm font-semibold text-zinc-200">{title}</span>
    </header>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1],
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function AppRouter() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/">{() => <AnimatedPage><Dashboard /></AnimatedPage>}</Route>
        <Route path="/review">{() => <AnimatedPage><Review /></AnimatedPage>}</Route>
        <Route path="/queue">{() => <AnimatedPage><Queue /></AnimatedPage>}</Route>
        <Route path="/settings">{() => <AnimatedPage><SettingsPage /></AnimatedPage>}</Route>
        <Route path="/privacy">{() => <AnimatedPage><Privacy /></AnimatedPage>}</Route>
        <Route>{() => <AnimatedPage><NotFound /></AnimatedPage>}</Route>
      </Switch>
    </AnimatePresence>
  );
}

const sidebarStyle = {
  "--sidebar-width": "15rem",
  "--sidebar-width-icon": "3rem",
};

function AppShell() {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-zinc-950 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-5 lg:p-7">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedApp() {
  const [location] = useLocation();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (location === "/onboarding" || location === "/privacy") {
      setNeedsOnboarding(false);
      return;
    }

    if (localStorage.getItem("onboarding_complete") === "true") {
      setNeedsOnboarding(false);
      return;
    }

    getSettings()
      .then((res) => {
        const s = res.data;
        const isSetup = s.google_connected || s.pinterest_connected || s.drive_folder_id;
        if (isSetup) {
          localStorage.setItem("onboarding_complete", "true");
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      })
      .catch(() => {
        // API unavailable — still show onboarding if never completed
        setNeedsOnboarding(true);
      });
  }, [location]);

  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route>
        {needsOnboarding === true ? (
          <Redirect to="/onboarding" />
        ) : (
          <AppShell />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  const [authed, setAuthed] = useState(() => {
    // ?reset in URL clears all state and restarts from login
    if (window.location.search.includes("reset")) {
      localStorage.clear();
      window.history.replaceState({}, "", "/");
      return false;
    }
    return localStorage.getItem("authed") === "true";
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {authed ? (
          <AuthenticatedApp />
        ) : (
          <Login onSuccess={() => setAuthed(true)} />
        )}
        <SonnerToaster
          position="bottom-right"
          duration={4000}
          toastOptions={{
            style: {
              background: "rgb(24 24 27)",
              border: "1px solid rgb(39 39 42)",
              color: "rgb(244 244 245)",
              borderRadius: "10px",
              fontSize: "13px",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
