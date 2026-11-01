import Link from "next/link";
import { Button, ButtonLink, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { contactStatuses, fullName, type Contact } from "@/lib/contacts";
import { requireUser } from "@/lib/supabase/server";
import { BulkTagForm } from "./bulk-tag-form";
import { StatusBadge } from "./status-badge";
import { TagList } from "./tag-list";

type Filters = { q: string; status: string; company: string; tag: string; archived: boolean };

function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const get = (k: string) => (typeof sp[k] === "string" ? sp[k].trim() : "");
  return { q: get("q"), status: get("status"), company: get("company"), tag: get("tag"), archived: get("archived") === "1" };
}

/** Removes characters that have meaning in PostgREST filter syntax. */
function safeTerm(q: string) {
  return q.replace(/[,()*%\\]/g, " ").trim();
}

export default async function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  const filters = readFilters(await searchParams);
  const { supabase } = await requireUser();

  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, email, company, job_title, status, tags, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  query = filters.archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.company) query = query.eq("company", filters.company);
  if (filters.tag) query = query.contains("tags", [filters.tag]);
  const term = safeTerm(filters.q);
  if (term) {
    query = query.or(
      ["first_name", "last_name", "email", "company"].map((c) => `${c}.ilike.*${term}*`).join(","),
    );
  }

  const [{ data: contacts, error }, { data: optionRows }] = await Promise.all([
    query,
    supabase.from("contacts").select("company, tags").is("archived_at", null),
  ]);
  if (error) throw new Error("Could not load contacts.");
  const companies = [...new Set(optionRows?.map((r) => r.company).filter(Boolean) as string[])].sort();
  const tags = [...new Set(optionRows?.flatMap((r) => r.tags as string[]))].sort();
  const hasFilters = !!(filters.q || filters.status || filters.company || filters.tag);

  return (
    <>
      <PageHeader
        title="Contacts"
        actions={
          <>
            <ButtonLink href="/contacts/tags" variant="secondary">Manage tags</ButtonLink>
            <ButtonLink href="/contacts/new">Add contact</ButtonLink>
          </>
        }
      />

      <form role="search" className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <label className="sr-only" htmlFor="q">Search contacts</label>
        <Input id="q" name="q" type="search" placeholder="Search name, email, or company" defaultValue={filters.q} />
        <label className="sr-only" htmlFor="status">Status</label>
        <Select id="status" name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          {contactStatuses.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="company">Company</label>
        <Select id="company" name="company" defaultValue={filters.company}>
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="tag">Tag</label>
        <Select id="tag" name="tag" defaultValue={filters.tag}>
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        {filters.archived && <input type="hidden" name="archived" value="1" />}
        <Button>
          Filter
        </Button>
      </form>

      <div className="mb-3 flex gap-4 text-sm">
        <Link href="/contacts" className={!filters.archived ? "font-medium" : "text-zinc-600 hover:underline"}>
          Active
        </Link>
        <Link href="/contacts?archived=1" className={filters.archived ? "font-medium" : "text-zinc-600 hover:underline"}>
          Archived
        </Link>
        {hasFilters && (
          <Link href={filters.archived ? "/contacts?archived=1" : "/contacts"} className="ml-auto text-accent hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      {contacts.length === 0 ? (
        <EmptyState title={hasFilters ? "No contacts match your filters" : filters.archived ? "No archived contacts" : "No contacts yet"}>
          {!hasFilters && !filters.archived && <p>Add your first contact to start tracking relationships.</p>}
        </EmptyState>
      ) : (
        <BulkTagForm>
          <Card className="p-0">
            <ul className="divide-y divide-zinc-200">
              {(contacts as Contact[]).map((c) => (
                <li key={c.id} className="flex items-center hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    name="ids"
                    value={c.id}
                    aria-label={`Select ${fullName(c)}`}
                    className="ml-5 size-4 shrink-0 accent-accent"
                  />
                  <Link href={`/contacts/${c.id}`} className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                    <span className="min-w-40 flex-1">
                      <span className="font-medium">{fullName(c)}</span>
                      <span className="mt-1 block empty:hidden"><TagList tags={c.tags} /></span>
                    </span>
                    <span className="min-w-40 flex-1 text-sm text-zinc-600">
                      {[c.job_title, c.company].filter(Boolean).join(" at ") || c.email || " "}
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </BulkTagForm>
      )}
    </>
  );
}
