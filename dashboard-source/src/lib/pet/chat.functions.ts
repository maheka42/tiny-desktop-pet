import { createServerFn } from "@tanstack/react-start";
import { buildSystemPrompt, offlineReply, type Personality } from "./personality";

type Input = {
  messages: { role: "user" | "assistant"; content: string }[];
  personality: Personality;
  context: string;
};

// Server-only: calls Groq with GROQ_API_KEY. Falls back to offline replies.
export const petChat = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!Array.isArray(input?.messages) || input.messages.length === 0) throw new Error("messages required");
    return {
      messages: input.messages.slice(-12).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content).slice(0, 2000),
      })),
      personality: input.personality,
      context: String(input.context ?? "").slice(0, 500),
    };
  })
  .handler(async ({ data }) => {
    const last = data.messages[data.messages.length - 1]?.content ?? "";
    const key = process.env["GROQ_API_KEY"];
    if (!key) return { text: offlineReply(last), offline: true };
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          temperature: 0.8,
          max_tokens: 600,
          messages: [{ role: "system", content: buildSystemPrompt(data.personality, data.context) }, ...data.messages],
        }),
      });
      if (!res.ok) {
        console.error("Groq error", res.status, await res.text());
        return { text: offlineReply(last), offline: true };
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content?.trim();
      return text ? { text, offline: false } : { text: offlineReply(last), offline: true };
    } catch (e) {
      console.error("Groq request failed", e);
      return { text: offlineReply(last), offline: true };
    }
  });
