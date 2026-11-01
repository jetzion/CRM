import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, FormMessage, PageHeader, Select } from "@/components/ui";
import { fullName } from "@/lib/contacts";
import { requireUser } from "@/lib/supabase/server";
import { TaskForm } from "../../tasks/task-form";
import { setContactStage, setDraftApproved } from "../actions";
import { CampaignForm } from "../campaign-form";
import { DraftEditor } from "../draft-editor";
import { DeleteCampaignButton } from "../delete-campaign-button";
import { GmailDraftsButton } from "../gmail-drafts-button";

type Person = { first_name: string; last_name: string; company: string | null };

type Campaign = {
  id: string;
  name: string;
  goal: string;
  audience_notes: string | null;
  status: string;
  campaign_contacts: { contact_id: string; stage: string; contacts: Person }[];
};

type Draft = {
  id: string;
  contact_id: string | null;
  step: number | null;
  day_offset: number | null;
  subject: string;
  body: string;
  status: "draft" | "approved";
  gmail_draft_id: string | null;
  contacts: Person | null;
};

const stages = ["planned", "contacted", "replied", "done"];

export default async function CampaignPage({ params, searchParams }: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: campaign }, { data: drafts }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, goal, audience_notes, status, campaign_contacts(contact_id, stage, contacts(first_name, last_name, company))")
      .eq("id", id)
      .maybeSingle<Campaign>(),
    supabase
      .from("outreach_drafts")
      .select("id, contact_id, step, day_offset, subject, body, status, gmail_draft_id, contacts(first_name, last_name, company)")
      .eq("campaign_id", id)
      .order("step")
      .overrideTypes<Draft[]>(),
  ]);
  if (!campaign) notFound();

  const steps = [...new Set((drafts ?? []).map((d) => d.step ?? 1))].sort((a, b) => a - b);
  const members = campaign.campaign_contacts;

  return (
    <>
      <PageHeader title={campaign.name} actions={<DeleteCampaignButton campaignId={campaign.id} />} />
      <div className="mb-6 space-y-2">
        {saved && <FormMessage success="Campaign saved. Review each draft and approve it when it is ready." />}
        <p className="text-sm text-zinc-600">
          Approving a draft marks it as reviewed. SimpleCRM never sends email. Create Gmail drafts to copy approved drafts to Gmail, then finish and send them there.
          Edits made here after a draft is in Gmail are not copied over.
        </p>
        {(drafts ?? []).length > 0 && <GmailDraftsButton campaignId={campaign.id} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Sequence</h2>
          {steps.length === 0 && <p className="text-sm text-zinc-500">No drafts in this campaign.</p>}
          {steps.map((step) => {
            const stepDrafts = (drafts ?? []).filter((d) => (d.step ?? 1) === step);
            return (
              <section key={step} aria-labelledby={`step-${step}`} className="space-y-3">
                <h3 id={`step-${step}`} className="font-medium">
                  Step {step} <span className="font-normal text-zinc-500">· day {stepDrafts[0]?.day_offset ?? 0}</span>
                </h3>
                {stepDrafts.map((d) => (
                  <Card key={d.id} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        To:{" "}
                        {d.contacts && d.contact_id ? (
                          <Link href={`/contacts/${d.contact_id}`} className="text-accent hover:underline">{fullName(d.contacts)}</Link>
                        ) : (
                          "General"
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        {d.gmail_draft_id && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">In Gmail</span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            d.status === "approved" ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {d.status === "approved" ? "Approved" : "Needs review"}
                        </span>
                        <form action={setDraftApproved}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="approved" value={d.status === "approved" ? "0" : "1"} />
                          <Button variant={d.status === "approved" ? "secondary" : "primary"} className="py-1 text-xs">
                            {d.status === "approved" ? "Unapprove" : "Approve"}
                          </Button>
                        </form>
                      </div>
                    </div>
                    <DraftEditor draft={d} />
                  </Card>
                ))}
              </section>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold">Details</h2>
            <CampaignForm campaign={campaign} />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Contacts</h2>
            <ul className="divide-y divide-zinc-200">
              {members.map((m) => (
                <li key={m.contact_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/contacts/${m.contact_id}`} className="text-sm font-medium hover:underline">
                    {fullName(m.contacts)}
                  </Link>
                  <form action={setContactStage} className="flex items-center gap-2">
                    <input type="hidden" name="campaign_id" value={campaign.id} />
                    <input type="hidden" name="contact_id" value={m.contact_id} />
                    <label htmlFor={`stage-${m.contact_id}`} className="sr-only">Stage for {fullName(m.contacts)}</label>
                    <div className="w-32">
                      <Select id={`stage-${m.contact_id}`} name="stage" defaultValue={m.stage}>
                        {stages.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                    </div>
                    <Button variant="secondary" className="py-1.5 text-xs">Update</Button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>

          {members.length > 0 && (
            <Card>
              <h2 className="mb-3 font-semibold">Add a follow-up task</h2>
              <TaskForm contacts={members.map((m) => ({ id: m.contact_id, name: fullName(m.contacts) }))} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
