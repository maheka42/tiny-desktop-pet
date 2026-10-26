import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/pet/AppShell";
import { ChatPanel } from "@/components/pet/ChatPanel";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Tiny Desktop Pet" },
      { name: "description", content: "Talk with your tiny desktop pet for pep talks and planning help." },
      { property: "og:title", content: "Chat — Tiny Desktop Pet" },
      { property: "og:description", content: "Short, friendly conversations with your desktop companion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <ChatPanel />
      </div>
    </AppShell>
  ),
});
