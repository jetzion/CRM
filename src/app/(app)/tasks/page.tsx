import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { isOverdue, today, type Task } from "@/lib/tasks";
import { requireUser } from "@/lib/supabase/server";
import { TaskList } from "./task-list";

function Section({ title, tasks, empty }: { title: string; tasks: Task[]; empty: string }) {
  return (
    <section aria-labelledby={`${title}-heading`}>
      <h2 id={`${title}-heading`} className="mb-2 font-semibold">
        {title} <span className="text-sm font-normal text-zinc-500">({tasks.length})</span>
      </h2>
      <Card className="py-1">
        {tasks.length ? <TaskList tasks={tasks} /> : <p className="py-3 text-sm text-zinc-500">{empty}</p>}
      </Card>
    </section>
  );
}

export default async function TasksPage() {
  const { supabase } = await requireUser();
  const [open, completed] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, contacts(first_name, last_name)")
      .is("completed_at", null)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("tasks")
      .select("*, contacts(first_name, last_name)")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(20),
  ]);
  if (open.error || completed.error) throw new Error("Could not load tasks.");

  const now = today();
  const openTasks = open.data as Task[];
  const overdue = openTasks.filter((t) => isOverdue(t, now));
  const upcoming = openTasks.filter((t) => !isOverdue(t, now));
  const hasAny = openTasks.length + completed.data.length > 0;

  return (
    <>
      <PageHeader title="Tasks" />
      {!hasAny ? (
        <EmptyState title="No follow-ups yet">
          <p className="mb-4">Open a contact to add a follow-up task.</p>
          <ButtonLink href="/contacts" variant="secondary">Go to contacts</ButtonLink>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          <Section title="Overdue" tasks={overdue} empty="Nothing overdue." />
          <Section title="Upcoming" tasks={upcoming} empty="No upcoming follow-ups." />
          <Section title="Completed" tasks={completed.data as Task[]} empty="No completed tasks yet." />
        </div>
      )}
    </>
  );
}
