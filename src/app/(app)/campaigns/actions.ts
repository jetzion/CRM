"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { outreachPlanSchema } from "@/lib/outreach";
import { requireUser } from "@/lib/supabase/server";

const saveSchema = z.object({
  name: z.string().trim().min(1, "Give the campaign a name.").max(200),
  goal: z.string().trim().max(2000),
  audienceNotes: z.string().trim().max(2000),
  contactIds: z.array(z.uuid()).min(1),
  plan: outreachPlanSchema,
  taskIndexes: z.array(z.int().min(0)),
  approved: z.boolean().default(false),
});

export type SaveCampaignInput = z.input<typeof saveSchema>;

function dueAt(dayOffset: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return `${d.toISOString().slice(0, 10)}T12:00:00Z`;
}

/**
 * Saves an edited outreach plan as a campaign with drafts and the chosen follow-up tasks.
 * Drafts start approved only when the user wrote them and chose to skip review.
 */
export async function saveCampaign(input: SaveCampaignInput): Promise<{ error: string }> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid campaign." };
  const { name, goal, audienceNotes, contactIds, plan, taskIndexes, approved } = parsed.data;
  const selected = new Set(contactIds);

  const { supabase } = await requireUser();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({ name, goal, audience_notes: audienceNotes || null })
    .select("id")
    .single();
  if (error) return { error: "Could not save the campaign. Please try again." };

  const drafts = plan.steps.flatMap((s) =>
    s.drafts
      .filter((d) => selected.has(d.contact_id))
      .map((d) => ({
        campaign_id: campaign.id,
        contact_id: d.contact_id,
        step: s.step,
        day_offset: s.day_offset,
        subject: d.subject,
        body: d.body,
        status: approved ? "approved" : "draft",
      })),
  );
  const tasks = taskIndexes
    .map((i) => plan.follow_up_tasks[i])
    .filter((t) => t && selected.has(t.contact_id) && t.title.trim())
    .map((t) => ({ contact_id: t.contact_id, title: t.title.trim(), due_at: dueAt(t.day_offset) }));

  const results = await Promise.all([
    supabase.from("campaign_contacts").insert(contactIds.map((contact_id) => ({ campaign_id: campaign.id, contact_id }))),
    drafts.length ? supabase.from("outreach_drafts").insert(drafts) : { error: null },
    tasks.length ? supabase.from("tasks").insert(tasks) : { error: null },
  ]);
  if (results.some((r) => r.error)) {
    await supabase.from("campaigns").delete().eq("id", campaign.id);
    return { error: "Could not save the campaign contents. Please try again." };
  }

  revalidatePath("/campaigns");
  revalidatePath("/tasks");
  redirect(`/campaigns/${campaign.id}?saved=1`);
}

const campaignSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Name is required.").max(200),
  goal: z.string().trim().max(2000),
  audience_notes: z.string().trim().max(2000).transform((v) => v || null),
  status: z.enum(["draft", "active", "completed"]),
});

export type FormState = { error?: string; success?: string };

/** Updates campaign details from the workspace form. */
export async function updateCampaign(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, ...fields } = parsed.data;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("campaigns").update(fields).eq("id", id).select("id").single();
  if (error) return { error: "Could not save the campaign." };
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  return { success: "Campaign saved." };
}

const draftSchema = z.object({
  id: z.uuid(),
  subject: z.string().trim().min(1, "Subject is required.").max(300),
  body: z.string().trim().min(1, "Body is required.").max(20000),
});

/** Saves edits to a draft. Editing an approved draft returns it to draft status for re-review. */
export async function updateDraft(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = draftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, ...fields } = parsed.data;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .update({ ...fields, status: "draft" })
    .eq("id", id)
    .select("campaign_id")
    .single();
  if (error) return { error: "Could not save the draft." };
  revalidatePath(`/campaigns/${data.campaign_id}`);
  return { success: "Draft saved. Review it again before approving." };
}

/** Approves a draft after review, or moves it back to draft. Approval never sends anything. */
export async function setDraftApproved(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const approved = formData.get("approved") === "1";
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .update({ status: approved ? "approved" : "draft" })
    .eq("id", id)
    .select("campaign_id")
    .single();
  if (error) throw new Error("Could not update the draft.");
  revalidatePath(`/campaigns/${data.campaign_id}`);
}

/** Permanently deletes a campaign with its drafts and contact stages. Tasks and Gmail drafts are kept. */
export async function deleteCampaign(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await requireUser();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw new Error("Could not delete the campaign.");
  revalidatePath("/campaigns");
  redirect("/campaigns");
}

const stageSchema = z.object({
  campaign_id: z.uuid(),
  contact_id: z.uuid(),
  stage: z.enum(["planned", "contacted", "replied", "done"]),
});

/** Records a contact's outreach progress within a campaign. */
export async function setContactStage(formData: FormData) {
  const { campaign_id, contact_id, stage } = stageSchema.parse(Object.fromEntries(formData));
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("campaign_contacts")
    .update({ stage })
    .eq("campaign_id", campaign_id)
    .eq("contact_id", contact_id);
  if (error) throw new Error("Could not update the stage.");
  revalidatePath(`/campaigns/${campaign_id}`);
}

/** Approves every draft in the campaign that still needs review. Approval never sends anything. */
export async function approveAllDrafts(formData: FormData) {
  const campaignId = z.uuid().parse(formData.get("campaign_id"));
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("outreach_drafts")
    .update({ status: "approved" })
    .eq("campaign_id", campaignId)
    .eq("status", "draft");
  if (error) throw new Error("Could not approve the drafts.");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
}
