import { useSyncExternalStore } from "react";
import { DEFAULT_PERSONALITY, type Personality } from "./personality";
import { XP_PER_POMODORO, XP_PER_TASK, dayKey, nextStreak } from "./progression";
import { sendToDesktop } from "./bridge";

export type Task = { id: string; title: string; done: boolean; createdAt: number; completedAt?: number | undefined };
export type ChatMsg = { id: string; role: "user" | "assistant"; content: string; offline?: boolean | undefined };
export type Settings = {
  remindersEnabled: boolean;
  checkInMinutes: number;
  waterMinutes: number;
  pomodoroWork: number;
  pomodoroBreak: number;
  quietStart: string;
  quietEnd: string;
  personality: Personality;
};
export type PetState = {
  xp: number;
  streak: number;
  lastCompletedDay?: string | undefined;
  lastActiveAt: number;
  pomodorosDone: number;
  tasks: Task[];
  chat: ChatMsg[];
  settings: Settings;
  celebration?: { at: number; text: string } | undefined;
};
export type PetSnapshot = Pick<PetState, "xp" | "streak" | "lastCompletedDay" | "pomodorosDone"> & {
  openTasks: number;
};

const KEY = "tiny-desktop-pet:v1";

export const DEFAULT_SETTINGS: Settings = {
  remindersEnabled: true,
  checkInMinutes: 90,
  waterMinutes: 60,
  pomodoroWork: 25,
  pomodoroBreak: 5,
  quietStart: "22:00",
  quietEnd: "08:00",
  personality: DEFAULT_PERSONALITY,
};

const DEFAULT_STATE: PetState = {
  xp: 0,
  streak: 0,
  lastActiveAt: 0,
  pomodorosDone: 0,
  tasks: [],
  chat: [],
  settings: DEFAULT_SETTINGS,
};

let state: PetState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PetState>;
      state = {
        ...DEFAULT_STATE,
        ...p,
        settings: {
          ...DEFAULT_SETTINGS,
          ...p.settings,
          personality: { ...DEFAULT_PERSONALITY, ...p.settings?.personality },
        },
      };
    } else state = { ...DEFAULT_STATE, lastActiveAt: Date.now() };
  } catch {
    state = { ...DEFAULT_STATE, lastActiveAt: Date.now() };
  }
}

export function snapshot(s: PetState = state): PetSnapshot {
  return {
    xp: s.xp,
    streak: s.streak,
    lastCompletedDay: s.lastCompletedDay,
    pomodorosDone: s.pomodorosDone,
    openTasks: s.tasks.filter((t) => !t.done).length,
  };
}

function set(updater: (s: PetState) => PetState) {
  load();
  state = updater(state);
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, celebration: undefined }));
  } catch {}
  listeners.forEach((l) => l());
  sendToDesktop({ type: "state:sync", payload: snapshot() });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function usePet() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => DEFAULT_STATE,
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const actions = {
  addTask(title: string) {
    const t = title.trim();
    if (!t) return;
    set((s) => ({ ...s, lastActiveAt: Date.now(), tasks: [{ id: uid(), title: t, done: false, createdAt: Date.now() }, ...s.tasks] }));
  },
  toggleTask(id: string) {
    set((s) => {
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return s;
      const now = new Date();
      const completing = !task.done;
      const tasks = s.tasks.map((t) =>
        t.id === id ? { ...t, done: completing, completedAt: completing ? now.getTime() : undefined } : t,
      );
      if (!completing) return { ...s, tasks, xp: Math.max(0, s.xp - XP_PER_TASK) };
      sendToDesktop({ type: "task:completed", payload: { title: task.title, xp: XP_PER_TASK } });
      return {
        ...s,
        tasks,
        xp: s.xp + XP_PER_TASK,
        streak: nextStreak(s.lastCompletedDay, s.streak, now),
        lastCompletedDay: dayKey(now),
        lastActiveAt: now.getTime(),
        celebration: { at: now.getTime(), text: `+${XP_PER_TASK} XP — nice one!` },
      };
    });
  },
  deleteTask(id: string) {
    set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  completePomodoro() {
    set((s) => ({
      ...s,
      xp: s.xp + XP_PER_POMODORO,
      pomodorosDone: s.pomodorosDone + 1,
      lastActiveAt: Date.now(),
      celebration: { at: Date.now(), text: `Focus session done! +${XP_PER_POMODORO} XP` },
    }));
  },
  updateSettings(patch: Partial<Settings>) {
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    sendToDesktop({ type: "settings:update", payload: state.settings });
  },
  addChat(msg: Omit<ChatMsg, "id">) {
    set((s) => ({ ...s, lastActiveAt: Date.now(), chat: [...s.chat, { ...msg, id: uid() }].slice(-60) }));
  },
  clearChat() {
    set((s) => ({ ...s, chat: [] }));
  },
};
