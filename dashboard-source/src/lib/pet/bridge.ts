/**
 * Dashboard <-> Electron bridge contract.
 * The Electron preload script exposes `window.tinyPet` via contextBridge.
 * In a normal browser it is undefined and every call is a safe no-op.
 * See docs/ELECTRON_INTEGRATION.md.
 */
import type { Settings, PetSnapshot } from "./store";

export type DashboardToDesktop =
  | { type: "state:sync"; payload: PetSnapshot }
  | { type: "settings:update"; payload: Settings }
  | { type: "task:completed"; payload: { title: string; xp: number } }
  | { type: "pet:say"; payload: { text: string } }
  | { type: "pomodoro:start"; payload: { minutes: number } }
  | { type: "pomodoro:stop" };

export type DesktopToDashboard =
  | { type: "pomodoro:finished" }
  | { type: "reminder:acknowledged"; payload: { kind: "water" | "checkin" } }
  | { type: "pet:clicked" };

export interface TinyPetBridge {
  version: 1;
  send(msg: DashboardToDesktop): void;
  onMessage(cb: (msg: DesktopToDashboard) => void): () => void;
}

declare global {
  interface Window {
    tinyPet?: TinyPetBridge;
  }
}

export function getBridge(): TinyPetBridge | undefined {
  return typeof window !== "undefined" ? window.tinyPet : undefined;
}

export function sendToDesktop(msg: DashboardToDesktop) {
  try {
    getBridge()?.send(msg);
  } catch (e) {
    console.warn("tinyPet bridge send failed", e);
  }
}
