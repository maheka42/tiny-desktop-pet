import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Trash2, WifiOff } from "lucide-react";
import { actions, usePet } from "@/lib/pet/store";
import { petChat } from "@/lib/pet/chat.functions";
import { offlineReply } from "@/lib/pet/personality";
import { sendToDesktop } from "@/lib/pet/bridge";
import { stageFor } from "@/lib/pet/progression";
import { PetAvatar } from "./PetAvatar";

export function ChatPanel() {
  const s = usePet();
  const chat = useServerFn(petChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [s.chat.length, busy]);
  useEffect(() => inputRef.current?.focus(), [busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    actions.addChat({ role: "user", content: text });
    setBusy(true);
    const history = [...s.chat, { role: "user" as const, content: text }].map(({ role, content }) => ({ role, content }));
    const open = s.tasks.filter((t) => !t.done).slice(0, 5).map((t) => t.title);
    const context = `Stage ${stageFor(s.xp)}, ${s.xp} XP, streak ${s.streak}. Open tasks: ${open.join("; ") || "none"}.`;
    try {
      const r = await chat({ data: { messages: history, personality: s.settings.personality, context } });
      actions.addChat({ role: "assistant", content: r.text, offline: r.offline });
      sendToDesktop({ type: "pet:say", payload: { text: r.text } });
    } catch {
      actions.addChat({ role: "assistant", content: offlineReply(text), offline: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-soft flex h-[70vh] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b px-5 py-3">
        <PetAvatar stage="Baby" mood="happy" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Chat with {s.settings.personality.name}</h2>
          <p className="text-xs text-muted-foreground">Short, friendly, and on your side.</p>
        </div>
        <button onClick={actions.clearChat} aria-label="Clear conversation" className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {s.chat.length === 0 && <p className="mt-10 text-center text-sm text-muted-foreground">Say hi! Ask for a pep talk or help planning your day.</p>}
        {s.chat.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <div className={m.role === "user" ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-primary-foreground" : "max-w-[80%] py-1"}>
              {m.content}
              {m.offline && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <WifiOff className="h-3 w-3" /> offline
                </span>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-muted-foreground animate-pulse">{s.settings.personality.name} is thinking…</div>}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t p-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Message your pet…"
          aria-label="Message"
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
        <button disabled={busy || !input.trim()} aria-label="Send" className="flex w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
