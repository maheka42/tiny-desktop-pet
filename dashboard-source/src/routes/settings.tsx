import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/pet/AppShell";
import { actions, usePet } from "@/lib/pet/store";
import { DEFAULT_PERSONALITY, type Personality } from "@/lib/pet/personality";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Tiny Desktop Pet" },
      { name: "description", content: "Configure reminders, focus sessions, quiet hours and your pet's personality." },
      { property: "og:title", content: "Settings — Tiny Desktop Pet" },
      { property: "og:description", content: "Tune reminders, quiet hours and personality." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-semibold">{label}</span>
      {children}
    </label>
  );
}

function SettingsPage() {
  const { settings } = usePet();
  const num = (k: "checkInMinutes" | "waterMinutes" | "pomodoroWork" | "pomodoroBreak") => (
    <input type="number" min={1} max={480} value={settings[k]} onChange={(e) => actions.updateSettings({ [k]: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} />
  );
  const setP = (patch: Partial<Personality>) => actions.updateSettings({ personality: { ...settings.personality, ...patch } });

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card-soft space-y-4 p-6">
          <h2 className="text-xl font-semibold">Reminders & focus</h2>
          <p className="text-xs text-muted-foreground">Reminders are delivered by the desktop app. These values are sent to it when connected.</p>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={settings.remindersEnabled} onChange={(e) => actions.updateSettings({ remindersEnabled: e.target.checked })} className="h-4 w-4 accent-primary" />
            Reminders on
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in every (min)">{num("checkInMinutes")}</Field>
            <Field label="Water every (min)">{num("waterMinutes")}</Field>
            <Field label="Focus length (min)">{num("pomodoroWork")}</Field>
            <Field label="Break length (min)">{num("pomodoroBreak")}</Field>
            <Field label="Quiet hours start">
              <input type="time" value={settings.quietStart} onChange={(e) => actions.updateSettings({ quietStart: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Quiet hours end">
              <input type="time" value={settings.quietEnd} onChange={(e) => actions.updateSettings({ quietEnd: e.target.value })} className={inputCls} />
            </Field>
          </div>
        </section>
        <section className="card-soft space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Personality</h2>
            <button onClick={() => actions.updateSettings({ personality: DEFAULT_PERSONALITY })} className="text-sm text-primary hover:underline">
              Reset
            </button>
          </div>
          <Field label="Name">
            <input value={settings.personality.name} onChange={(e) => setP({ name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Traits">
            <textarea rows={2} value={settings.personality.traits} onChange={(e) => setP({ traits: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Speaking style">
            <textarea rows={2} value={settings.personality.style} onChange={(e) => setP({ style: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Boundaries">
            <textarea rows={2} value={settings.personality.boundaries} onChange={(e) => setP({ boundaries: e.target.value })} className={inputCls} />
          </Field>
        </section>
      </div>
    </AppShell>
  );
}
