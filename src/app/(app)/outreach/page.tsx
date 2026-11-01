import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import type { Contact } from "@/lib/contacts";
import { latestVersions, type Template } from "@/lib/templates";
import { requireUser } from "@/lib/supabase/server";
import { TemplatePicker } from "./template-picker";
import { OutreachWorkspace, type PickerContact } from "./workspace";

export default async function OutreachPage({ searchParams }: PageProps<"/outreach">) {
  const { contact, template: templateId } = await searchParams;
  const { supabase, userId } = await requireUser();
  const [{ data, error }, { data: profile }, { data: template }, { data: templateRows }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name, company, job_title, status, tags")
      .is("archived_at", null)
      .order("first_name")
      .overrideTypes<Pick<Contact, "id" | "first_name" | "last_name" | "company" | "job_title" | "status" | "tags">[], { merge: false }>(),
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
    typeof templateId === "string"
      ? supabase.from("outreach_templates").select("*").eq("id", templateId).maybeSingle<Template>()
      : { data: null },
    supabase.from("outreach_templates").select("id, family_id, version, name, created_at"),
  ]);
  if (error) throw new Error("Could not load contacts.");

  const contacts: PickerContact[] = data;
  const preselected = typeof contact === "string" && contacts.some((c) => c.id === contact) ? [contact] : [];
  const options = latestVersions(templateRows ?? []);
  if (template && !options.some((t) => t.id === template.id)) options.unshift(template);

  return (
    <>
      <PageHeader title="Outreach assistant" actions={<ButtonLink href="/outreach/saved" variant="secondary">Templates</ButtonLink>} />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-zinc-600">
        Plan an email or a short campaign with AI. Everything it writes is an editable draft. SimpleCRM never
        sends or schedules email.
      </p>
      {contacts.length === 0 ? (
        <EmptyState title="Add contacts first">
          <p className="mb-4">The assistant personalizes drafts from your contacts.</p>
          <ButtonLink href="/contacts/new">Add contact</ButtonLink>
        </EmptyState>
      ) : (
        <>
          {options.length > 0 && <TemplatePicker templates={options} selectedId={template?.id} />}
          <OutreachWorkspace
            key={template?.id ?? "scratch"}
            contacts={contacts}
            initialSelected={preselected}
            senderName={profile?.display_name ?? ""}
            template={template ?? undefined}
          />
        </>
      )}
    </>
  );
}
