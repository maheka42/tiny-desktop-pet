import type { Mood, Stage } from "@/lib/pet/progression";

const SIZE: Record<Stage, number> = { Baby: 110, Grown: 150, Evolved: 180 };

export function PetAvatar({ stage, mood, hop }: { stage: Stage; mood: Mood; hop?: boolean }) {
  const s = SIZE[stage];
  const eyes =
    mood === "sleepy" ? (
      <>
        <path d="M36 52 q6 4 12 0" className="stroke-foreground" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M62 52 q6 4 12 0" className="stroke-foreground" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="42" cy="52" r="5" className="fill-foreground" />
        <circle cx="68" cy="52" r="5" className="fill-foreground" />
        <circle cx="44" cy="50" r="1.6" className="fill-card" />
        <circle cx="70" cy="50" r="1.6" className="fill-card" />
      </>
    );
  const mouth =
    mood === "lonely" ? "M48 70 q7 -5 14 0" : mood === "happy" ? "M46 66 q9 10 18 0" : "M48 67 q7 5 14 0";
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 110 110"
      className={hop ? "animate-pet-hop" : "animate-pet-bob"}
      role="img"
      aria-label={`${stage} pet feeling ${mood}`}
    >
      {stage !== "Baby" && (
        <>
          <path d="M30 30 L24 8 L44 24 Z" className="fill-pet-shade" />
          <path d="M80 30 L86 8 L66 24 Z" className="fill-pet-shade" />
        </>
      )}
      {stage === "Evolved" && <path d="M45 14 l10 -10 l10 10 l-10 6z" className="fill-accent" />}
      <ellipse cx="55" cy="98" rx="30" ry="5" className="fill-muted-foreground" opacity="0.15" />
      <path d="M15 60 C15 30 35 20 55 20 C75 20 95 30 95 60 C95 85 78 95 55 95 C32 95 15 85 15 60Z" className="fill-pet" />
      <path d="M25 80 C35 92 75 92 85 80 C78 90 65 95 55 95 C45 95 32 90 25 80Z" className="fill-pet-shade" opacity="0.5" />
      {eyes}
      <circle cx="32" cy="64" r="5" className="fill-pet-cheek" opacity="0.7" />
      <circle cx="78" cy="64" r="5" className="fill-pet-cheek" opacity="0.7" />
      <path d={mouth} className="stroke-foreground" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
