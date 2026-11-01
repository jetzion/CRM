import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/supabase/server";
import { latestVersions } from "@/lib/templates";
import { DeleteTemplateButton } from "./delete-template-button";

type Row = { id: string; family_id: string; version: number; name: string; created_at: string };

export default async function SavedOutreachPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("outreach_templates")
    .select("id, family_id, version, name, created_at")
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error("Could not load templates.");

  const items = latestVersions(data);

  return (
    <>
      <PageHeader title="Templates" actions={<ButtonLink href="/outreach">New outreach</ButtonLink>} />
      {items.length === 0 ? (
        <EmptyState title="No templates yet">
          <p>In the outreach assistant, use Save as template on your own email or on AI drafts.</p>
        </EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-200">
            {items.map((t) => (
              <li key={t.family_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 hover:bg-zinc-50">
                <Link href={`/outreach/saved/${t.id}`} className="min-w-40 flex-1 font-medium hover:underline">{t.name}</Link>
                <span className="text-sm text-zinc-600">
                  Version {t.version} · {new Date(t.created_at).toLocaleDateString()}
                </span>
                <ButtonLink href={`/outreach?template=${t.id}`} variant="secondary" className="py-1 text-xs">
                  Use for new campaign
                </ButtonLink>
                <DeleteTemplateButton familyId={t.family_id} name={t.name} className="py-1 text-xs" />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
