import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/supabase/server";
import { TagManager } from "./tag-manager";

export default async function TagsPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("contacts").select("tags").overrideTypes<{ tags: string[] }[], { merge: false }>();
  if (error) throw new Error("Could not load tags.");

  const counts = new Map<string, number>();
  for (const t of data.flatMap((r) => r.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader title="Tags" actions={<ButtonLink href="/contacts" variant="secondary">Back to contacts</ButtonLink>} />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-zinc-600">
        Renaming or deleting a tag changes it on every contact that has it, including archived contacts. Renaming to an
        existing tag merges the two.
      </p>
      {tags.length === 0 ? (
        <EmptyState title="No tags yet">
          <p>Add tags on a contact, or select contacts in the list and use Add tag.</p>
        </EmptyState>
      ) : (
        <TagManager tags={tags} />
      )}
    </>
  );
}
