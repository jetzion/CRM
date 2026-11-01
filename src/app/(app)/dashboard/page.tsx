import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { fullName, type Contact } from "@/lib/contacts";
import { requireUser } from "@/lib/supabase/server";
import { isOverdue, today, type Task } from "@/lib/tasks";
import { StatusBadge } from "../contacts/status-badge";
import { TaskList } from "../tasks/task-list";

const statTones = {
  indigo: "from-indigo-500 to-violet-500 shadow-indigo-200",
  amber: "from-amber-500 to-orange-600 shadow-amber-200",
  rose: "from-rose-500 to-pink-500 shadow-rose-200",
};

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone: keyof typeof statTones;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg bg-linear-to-br p-3 text-white shadow-md transition-transform hover:-translate-y-0.5 sm:p-5 ${statTones[tone]}`}
    >
      <p className="text-xs text-white/85 sm:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();
  const [profile, contactCount, openTasks, recent] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
    supabase.from("contacts").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase
      .from("tasks")
      .select("*, contacts(first_name, last_name)")
      .is("completed_at", null)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, company, status, updated_at")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);
  if (openTasks.error || recent.error) throw new Error("Could not load your dashboard.");

  const now = today();
  const tasks = openTasks.data as Task[];
  const overdue = tasks.filter((t) => isOverdue(t, now));
  const upcoming = tasks.filter((t) => !isOverdue(t, now)).slice(0, 5);
  const name = profile.data?.display_name;

  return (
    <>
      <PageHeader title={name ? `Welcome, ${name}` : "Welcome"} />

      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Contacts" value={contactCount.count ?? 0} href="/contacts" tone="indigo" />
        <Stat label="Open follow-ups" value={tasks.length} href="/tasks" tone="amber" />
        <Stat label="Overdue" value={overdue.length} href="/tasks" tone="rose" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="dash-tasks">
          <h2 id="dash-tasks" className="mb-3 font-semibold">Follow-ups</h2>
          <Card className="py-1">
            {overdue.length + upcoming.length === 0 ? (
              <p className="py-3 text-sm text-zinc-500">You are all caught up.</p>
            ) : (
              <TaskList tasks={[...overdue, ...upcoming]} />
            )}
          </Card>
        </section>

        <section aria-labelledby="dash-recent">
          <h2 id="dash-recent" className="mb-3 font-semibold">Recently updated contacts</h2>
          {recent.data.length === 0 ? (
            <EmptyState title="No contacts yet">
              <ButtonLink href="/contacts/new" className="mt-2">Add your first contact</ButtonLink>
            </EmptyState>
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-zinc-200">
                {(recent.data as Contact[]).map((c) => (
                  <li key={c.id}>
                    <Link href={`/contacts/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                      <span>
                        <span className="font-medium">{fullName(c)}</span>
                        {c.company && <span className="block text-sm text-zinc-600">{c.company}</span>}
                      </span>
                      <StatusBadge status={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
