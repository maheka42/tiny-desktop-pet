import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, ListTodo, MessageCircle, Settings, Monitor } from "lucide-react";
import { getBridge, sendToDesktop } from "@/lib/pet/bridge";
import { usePet, snapshot } from "@/lib/pet/store";

const NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function DesktopStatus() {
  const [connected, setConnected] = useState(false);
  useEffect(() => setConnected(!!getBridge()), []);
  return (
    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
      <Monitor className="h-3.5 w-3.5" />
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-muted-foreground/40"}`} />
      {connected ? "Desktop pet connected" : "Desktop app not connected"}
    </div>
  );
}


function DesktopSync() {
  const state = usePet();
  useEffect(() => {
    if (!getBridge()) return;
    sendToDesktop({ type: "state:sync", payload: snapshot(state) });
    sendToDesktop({ type: "settings:update", payload: state.settings });
  }, [state.xp, state.streak, state.pomodorosDone, state.tasks.length, state.settings]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-meadow">
      <DesktopSync />
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <Link to="/" className="font-display text-2xl font-semibold text-secondary-foreground">
          Tiny Desktop Pet
        </Link>
        <nav className="flex gap-1 rounded-full card-soft p-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground" }}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <DesktopStatus />
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-16">{children}</main>
    </div>
  );
}
