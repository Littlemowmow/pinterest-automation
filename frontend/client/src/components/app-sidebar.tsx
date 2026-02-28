"use client";

import { useState, useEffect } from "react";
import { Zap, LayoutDashboard, Image, ListOrdered, Settings2, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Review", url: "/review", icon: Image },
  { title: "Queue", url: "/queue", icon: ListOrdered },
  { title: "Settings", url: "/settings", icon: Settings2 },
];

function getGreetingInfo(hour: number) {
  if (hour >= 5 && hour < 12) return { text: "Good morning", Icon: Sunrise, color: "text-amber-400" };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", Icon: Sun, color: "text-yellow-400" };
  if (hour >= 17 && hour < 21) return { text: "Good evening", Icon: Sunset, color: "text-orange-400" };
  return { text: "Good night", Icon: Moon, color: "text-indigo-400" };
}

export function AppSidebar() {
  const [location] = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const { text: greetingText, Icon: GreetingIcon, color: greetingColor } = getGreetingInfo(hour);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30">
            <Zap className="h-4 w-4 text-white" fill="white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent leading-none">
              AutoPin
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Live</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={
                        isActive
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          : "text-zinc-500 border border-transparent"
                      }
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                        <item.icon className={`h-4 w-4 ${isActive ? "text-rose-400" : "text-zinc-500"}`} />
                        <span className={`text-sm font-medium ${isActive ? "text-rose-400" : "text-zinc-400"}`}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4">
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GreetingIcon className={`h-3.5 w-3.5 ${greetingColor} flex-shrink-0`} />
            <span className={`text-xs font-semibold ${greetingColor}`}>{greetingText}</span>
          </div>
          <div className="font-mono text-lg font-bold text-zinc-100 tracking-wider tabular-nums leading-none" data-testid="text-live-time">
            {timeStr}
          </div>
          <div className="text-xs text-zinc-500">{dateStr}</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
