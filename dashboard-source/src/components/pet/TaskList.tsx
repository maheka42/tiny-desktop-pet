import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { actions, usePet } from "@/lib/pet/store";

export function TaskList({ limit }: { limit?: number }) {
  const { tasks } = usePet();
  const [title, setTitle] = useState("");
  const shown = limit ? tasks.slice(0, limit) : tasks;
  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          actions.addTask(title);
          setTitle("");
        }}
        className="flex gap-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="flex items-center gap-1 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
      {shown.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No tasks yet — add one and I'll cheer you on.</p>}
      <ul className="space-y-2">
        {shown.map((t) => (
          <li key={t.id} className="group flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
            <button
              onClick={() => actions.toggleTask(t.id)}
              aria-label={t.done ? "Mark not done" : "Mark done"}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${t.done ? "border-success bg-success text-primary-foreground" : "border-pet-shade"}`}
            >
              {t.done && <Check className="h-3.5 w-3.5" />}
            </button>
            <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
            <button onClick={() => actions.deleteTask(t.id)} aria-label="Delete task" className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
