import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/supabase/server";
import { DeleteCampaignButton } from "./delete-campaign-button";

type Row = {
  id: string;
  name: string;
  status: string;
  updated_at: string;
  campaign_contacts: { count: number }[];
  outreach_drafts: { status: string }[];
};

export default async function CampaignsPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, status, updated_at, campaign_contacts(count), outreach_drafts(status)")
    .order("updated_at", { ascending: false })
    .overrideTypes<Row[]>();
  if (error) throw new Error("Could not load campaigns.");

  return (
    <>
      <PageHeader title="Campaigns" actions={<ButtonLink href="/outreach">New with assistant</ButtonLink>} />
      {data.length === 0 ? (
        <EmptyState title="No campaigns yet">
          <p>Use the outreach assistant to draft emails, then save them as a campaign.</p>
        </EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-200">
            {data.map((c) => {
              const count = c.campaign_contacts[0]?.count ?? 0;
              const approved = c.outreach_drafts.filter((d) => d.status === "approved").length;
              return (
                <li key={c.id} className="flex items-center gap-3 pr-5 hover:bg-zinc-50">
                  <Link href={`/campaigns/${c.id}`} className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 py-3 pl-5">
                    <span className="min-w-40 flex-1 font-medium">{c.name}</span>
                    <span className="text-sm text-zinc-600">
                      {count} contact{count === 1 ? "" : "s"} · {approved}/{c.outreach_drafts.length} drafts approved
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700">{c.status}</span>
                  </Link>
                  <DeleteCampaignButton campaignId={c.id} className="py-1 text-xs" />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
