import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/pet/AppShell";
import { TaskList } from "@/components/pet/TaskList";
import { PetCard } from "@/components/pet/PetCard";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Tiny Desktop Pet" },
      { name: "description", content: "Add and complete tasks to earn XP and help your pet evolve." },
      { property: "og:title", content: "Tasks — Tiny Desktop Pet" },
      { property: "og:description", content: "Every finished task feeds your pet XP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="card-soft p-6">
          <h1 className="mb-4 text-2xl font-semibold">Task manager</h1>
          <TaskList />
        </section>
        <PetCard />
      </div>
    </AppShell>
  ),
});
