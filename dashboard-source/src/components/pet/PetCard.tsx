import { useEffect, useState } from "react";
import { Flame, Star } from "lucide-react";
import { usePet } from "@/lib/pet/store";
import { dayKey, liveStreak, moodFor, stageProgress } from "@/lib/pet/progression";
import { PetAvatar } from "./PetAvatar";

const MOOD_LINE = { happy: "Feeling great!", content: "Ready when you are.", sleepy: "A bit sleepy…", lonely: "Missed you!" };

export function PetCard() {
  const s = usePet();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);
  const today = dayKey(new Date(now));
  const completedToday = s.tasks.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) === today).length;
  const mood = moodFor({ lastActiveAt: s.lastActiveAt || now, now, completedToday });
  const { stage, pct, next } = stageProgress(s.xp);
  const celebrating = !!s.celebration && now - s.celebration.at < 4000;
  const [, force] = useState(0);
  useEffect(() => {
    if (!s.celebration) return;
    const t = setTimeout(() => force((n) => n + 1), 4000);
    return () => clearTimeout(t);
  }, [s.celebration]);
  const showBubble = !!s.celebration && Date.now() - s.celebration.at < 4000;

  return (
    <section className="card-soft flex flex-col items-center p-6 text-center">
      <div className="relative flex h-52 items-end justify-center">
        {showBubble && (
          <div className="absolute -top-2 rounded-2xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground animate-in fade-in zoom-in">
            {s.celebration!.text}
          </div>
        )}
        <PetAvatar stage={stage} mood={mood} hop={celebrating || showBubble} />
      </div>
      <h2 className="mt-2 text-2xl font-semibold">{s.settings.personality.name}</h2>
      <p className="text-sm text-muted-foreground">
        {stage} · {MOOD_LINE[mood]}
      </p>
      <div className="mt-4 w-full">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{s.xp} XP</span>
          <span>{next ? `${next} XP to evolve` : "Fully evolved"}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-4 grid w-full grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-muted/70 p-3">
          <Flame className="mx-auto mb-1 h-4 w-4 text-accent" />
          <b>{liveStreak(s.lastCompletedDay, s.streak, new Date(now))}</b> day streak
        </div>
        <div className="rounded-xl bg-muted/70 p-3">
          <Star className="mx-auto mb-1 h-4 w-4 text-primary" />
          <b>{completedToday}</b> done today
        </div>
      </div>
    </section>
  );
}
