import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { actions, usePet } from "@/lib/pet/store";
import { getBridge, sendToDesktop } from "@/lib/pet/bridge";

// Dashboard-side focus timer. When the desktop app is connected it also
// receives pomodoro:start so the pet can show focus mode on screen.
export function Pomodoro() {
  const { settings } = usePet();
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [left, setLeft] = useState(settings.pomodoroWork * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) setLeft((phase === "work" ? settings.pomodoroWork : settings.pomodoroBreak) * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pomodoroWork, settings.pomodoroBreak]);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  useEffect(() => {
    if (left > 0) return;
    if (phase === "work") {
      actions.completePomodoro();
      setPhase("break");
      setLeft(settings.pomodoroBreak * 60);
    } else {
      setPhase("work");
      setLeft(settings.pomodoroWork * 60);
      setRunning(false);
    }
  }, [left, phase, settings.pomodoroBreak, settings.pomodoroWork]);

  useEffect(() => getBridge()?.onMessage((m) => m.type === "pomodoro:finished" && setLeft(0)), []);

  const toggle = () => {
    const next = !running;
    setRunning(next);
    sendToDesktop(next ? { type: "pomodoro:start", payload: { minutes: Math.ceil(left / 60) } } : { type: "pomodoro:stop" });
  };
  const reset = () => {
    setRunning(false);
    setPhase("work");
    setLeft(settings.pomodoroWork * 60);
    sendToDesktop({ type: "pomodoro:stop" });
  };
  const mm = String(Math.floor(Math.max(left, 0) / 60)).padStart(2, "0");
  const ss = String(Math.max(left, 0) % 60).padStart(2, "0");

  return (
    <section className="card-soft p-6">
      <h3 className="text-lg font-semibold">{phase === "work" ? "Focus session" : "Break time"}</h3>
      <p className="my-3 font-display text-5xl font-semibold tabular-nums">
        {mm}:{ss}
      </p>
      <div className="flex gap-2">
        <button onClick={toggle} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90">
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} aria-label="Reset timer" className="rounded-xl bg-muted px-3 text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
