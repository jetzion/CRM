import { notFound } from "next/navigation";
import { Button, ButtonLink, Card, FormMessage, PageHeader } from "@/components/ui";
import { fullName, type Contact } from "@/lib/contacts";
import { requireUser } from "@/lib/supabase/server";
import type { Task } from "@/lib/tasks";
import { TaskForm } from "../../tasks/task-form";
import { TaskList } from "../../tasks/task-list";
import { setArchived } from "../actions";
import { StatusBadge } from "../status-badge";
import { TagList } from "../tag-list";

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-0.5 break-words">{value || <span className="text-zinc-400">Not set</span>}</dd>
    </div>
  );
}

export default async function ContactPage({ params, searchParams }: PageProps<"/contacts/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: contact }, { data: tasks }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).maybeSingle<Contact>(),
    supabase
      .from("tasks")
      .select("*")
      .eq("contact_id", id)
      .order("completed_at", { ascending: true, nullsFirst: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .overrideTypes<Task[]>(),
  ]);
  if (!contact) notFound();

  const archived = !!contact.archived_at;

  return (
    <>
      <PageHeader
        title={fullName(contact)}
        actions={
          <>
            {!archived && (
              <ButtonLink href={`/outreach?contact=${id}`} variant="secondary">Draft outreach</ButtonLink>
            )}
            <ButtonLink href={`/contacts/${id}/edit`} variant="secondary">Edit</ButtonLink>
            <form action={setArchived}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="archived" value={archived ? "0" : "1"} />
              <Button variant={archived ? "secondary" : "danger"}>{archived ? "Restore" : "Archive"}</Button>
            </form>
          </>
        }
      />
      <div className="mb-4 space-y-2">
        {saved && <FormMessage success="Contact saved." />}
        {archived && <FormMessage error="This contact is archived. Restore it to show it in your contact list." />}
      </div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={contact.status} />
          <TagList tags={contact.tags} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Email" value={contact.email} />
          <Detail label="Phone" value={contact.phone} />
          <Detail label="Company" value={contact.company} />
          <Detail label="Job title" value={contact.job_title} />
          <Detail label="Created" value={new Date(contact.created_at).toLocaleDateString()} />
          <Detail label="Updated" value={new Date(contact.updated_at).toLocaleDateString()} />
        </dl>
        <div className="mt-6">
          <h2 className="text-sm text-zinc-500">Notes</h2>
          <p className="mt-1 whitespace-pre-wrap">{contact.notes || <span className="text-zinc-400">No notes yet.</span>}</p>
        </div>
      </Card>

      <section aria-labelledby="followups-heading" className="mt-8">
        <h2 id="followups-heading" className="mb-3 text-lg font-semibold">Follow-ups</h2>
        <Card>
          {tasks?.length ? (
            <TaskList tasks={tasks} showContact={false} />
          ) : (
            <p className="text-sm text-zinc-500">No follow-ups for this contact yet.</p>
          )}
          {!archived && (
            <div className="mt-5 border-t border-zinc-200 pt-5">
              <TaskForm contactId={id} />
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
