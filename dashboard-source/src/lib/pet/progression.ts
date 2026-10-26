export type Stage = "Baby" | "Grown" | "Evolved";
export type Mood = "happy" | "content" | "sleepy" | "lonely";

export const XP_PER_TASK = 10;
export const XP_PER_POMODORO = 15;
export const GROWN_AT = 100;
export const EVOLVED_AT = 300;

export function stageFor(xp: number): Stage {
  if (xp >= EVOLVED_AT) return "Evolved";
  if (xp >= GROWN_AT) return "Grown";
  return "Baby";
}

export function stageProgress(xp: number) {
  const stage = stageFor(xp);
  if (stage === "Evolved") return { stage, pct: 100, next: null as number | null };
  const [from, to] = stage === "Baby" ? [0, GROWN_AT] : [GROWN_AT, EVOLVED_AT];
  return { stage, pct: Math.round(((xp - from) / (to - from)) * 100), next: to };
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Streak = consecutive days with at least one completed task. */
export function nextStreak(lastDay: string | undefined, streak: number, today: Date) {
  const t = dayKey(today);
  if (lastDay === t) return streak;
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return lastDay === dayKey(y) ? streak + 1 : 1;
}

/** Streak shown to user: drops to 0 if yesterday and today were both missed. */
export function liveStreak(lastDay: string | undefined, streak: number, today: Date) {
  if (!lastDay) return 0;
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return lastDay === dayKey(today) || lastDay === dayKey(y) ? streak : 0;
}

export function moodFor(opts: { lastActiveAt: number; now: number; completedToday: number }): Mood {
  const idleH = (opts.now - opts.lastActiveAt) / 3_600_000;
  if (idleH > 24) return "lonely";
  if (opts.completedToday >= 3) return "happy";
  if (idleH > 4) return "sleepy";
  return opts.completedToday > 0 ? "happy" : "content";
}

export function isQuietTime(now: Date, start: string, end: string) {
  const m = now.getHours() * 60 + now.getMinutes();
  const [sh = 0, sm = 0] = start.split(":").map(Number);
  const [eh = 0, em = 0] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? m >= s && m < e : m >= s || m < e;
}
