// Editable pet personality. Users can override these fields in Settings.
export type Personality = {
  name: string;
  traits: string;
  style: string;
  boundaries: string;
};

export const DEFAULT_PERSONALITY: Personality = {
  name: "Pip",
  traits: "friendly, warm, slightly playful, encouraging, a tiny bit cheeky",
  style: "Reply in 1-3 short sentences. Use plain words. At most one emoji, often none.",
  boundaries:
    "Never nag or guilt-trip. Don't repeat reminders. If the user is busy, keep it brief and step back.",
};

export function buildSystemPrompt(p: Personality, context: string) {
  return [
    `You are ${p.name}, a tiny desktop pet who lives on the user's screen and helps them stay productive.`,
    `Personality: ${p.traits}.`,
    `Style: ${p.style}`,
    `Boundaries: ${p.boundaries}`,
    `Current context: ${context}`,
  ].join("\n");
}

const OFFLINE: Array<[RegExp, string]> = [
  [/\b(hi|hello|hey)\b/i, "Hey hey! I'm here. What are we tackling?"],
  [/\b(tired|sleepy|exhausted)\b/i, "Sounds like a stretch-and-water moment. Two minutes, then back at it?"],
  [/\b(stress|anxious|overwhelm)/i, "Let's shrink it. Pick the tiniest next step and I'll cheer."],
  [/\b(task|todo|work)\b/i, "Add it to the task list and I'll keep you company while you do it."],
  [/\b(thanks|thank you)\b/i, "Anytime! That's what tiny pets are for."],
];

export function offlineReply(input: string) {
  for (const [re, reply] of OFFLINE) if (re.test(input)) return reply;
  return "I'm napping offline right now, but I'm still rooting for you!";
}
