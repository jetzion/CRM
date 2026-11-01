import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, FormMessage, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/supabase/server";
import type { Template } from "@/lib/templates";
import { DeleteTemplateButton } from "../delete-template-button";
import { TemplateEditor } from "../template-editor";

type Version = { id: string; version: number; created_at: string };

export default async function SavedOutreachVersionPage({ params, searchParams }: PageProps<"/outreach/saved/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { supabase } = await requireUser();
  const { data: template } = await supabase.from("outreach_templates").select("*").eq("id", id).maybeSingle<Template>();
  if (!template) notFound();
  const { data: versions } = await supabase
    .from("outreach_templates")
    .select("id, version, created_at")
    .eq("family_id", template.family_id)
    .order("version", { ascending: false })
    .overrideTypes<Version[], { merge: false }>();
  const latest = versions?.[0]?.version ?? template.version;

  return (
    <>
      <PageHeader
        title={template.name}
        actions={
          <>
            <ButtonLink href={`/outreach?template=${template.id}`}>Use for new campaign</ButtonLink>
            <DeleteTemplateButton familyId={template.family_id} name={template.name} />
          </>
        }
      />
      <div className="mb-6 space-y-2">
        {saved && <FormMessage success={`Saved as version ${template.version}.`} />}
        <p className="text-sm text-zinc-600">
          Viewing version {template.version} of {latest}. Editing below saves a new version; this one stays as it is.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <TemplateEditor key={template.id} template={template} nextVersion={latest + 1} />
        <Card className="self-start">
          <h2 className="mb-2 font-semibold">Versions</h2>
          <ol className="space-y-1 text-sm">
            {versions?.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/outreach/saved/${v.id}`}
                  aria-current={v.id === template.id ? "page" : undefined}
                  className={`flex justify-between gap-2 rounded-md px-2 py-1 ${
                    v.id === template.id ? "bg-violet-100 font-medium text-violet-900" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>Version {v.version}</span>
                  <span className="text-zinc-500">{new Date(v.created_at).toLocaleDateString()}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
