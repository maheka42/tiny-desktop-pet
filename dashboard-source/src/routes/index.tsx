import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/pet/AppShell";
import { PetCard } from "@/components/pet/PetCard";
import { TaskList } from "@/components/pet/TaskList";
import { Pomodoro } from "@/components/pet/Pomodoro";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tiny Desktop Pet — Dashboard" },
      { name: "description", content: "Your pet's home base: tasks, focus sessions, XP, streaks and evolution." },
      { property: "og:title", content: "Tiny Desktop Pet — Dashboard" },
      { property: "og:description", content: "A friendly AI desktop companion that grows as you get things done." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <PetCard />
          <Pomodoro />
        </div>
        <section className="card-soft p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Today's tasks</h2>
            <Link to="/tasks" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>
          <TaskList limit={8} />
        </section>
      </div>
    </AppShell>
  );
}
