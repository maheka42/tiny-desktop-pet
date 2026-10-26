import { describe, expect, it } from "vitest";
import { isQuietTime, liveStreak, moodFor, nextStreak, stageFor } from "@/lib/pet/progression";

describe("progression", () => {
  it("evolves Baby -> Grown at 100 XP -> Evolved at 300 XP", () => {
    expect(stageFor(99)).toBe("Baby");
    expect(stageFor(100)).toBe("Grown");
    expect(stageFor(300)).toBe("Evolved");
  });
  it("extends streak on consecutive days and resets after a gap", () => {
    const today = new Date(2026, 9, 26);
    expect(nextStreak("2026-10-25", 4, today)).toBe(5);
    expect(nextStreak("2026-10-26", 4, today)).toBe(4);
    expect(nextStreak("2026-10-20", 4, today)).toBe(1);
    expect(liveStreak("2026-10-20", 4, today)).toBe(0);
  });
  it("quiet hours wrap past midnight", () => {
    expect(isQuietTime(new Date(2026, 0, 1, 23, 0), "22:00", "08:00")).toBe(true);
    expect(isQuietTime(new Date(2026, 0, 1, 12, 0), "22:00", "08:00")).toBe(false);
  });
  it("pet gets lonely after a day idle", () => {
    expect(moodFor({ lastActiveAt: 0, now: 25 * 3_600_000, completedToday: 0 })).toBe("lonely");
  });
});
