"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fullName } from "@/lib/contacts";
import { accessToken, createDraft, GmailAuthError, rawMessage } from "@/lib/gmail";
import { requireUser } from "@/lib/supabase/server";
import type { FormState } from "./actions";

type PendingDraft = {
  id: string;
  subject: string;
  body: string;
  contacts: { first_name: string; last_name: string; email: string | null } | null;
};

/** Creates a Gmail draft for every approved draft in the campaign that is not in Gmail yet. Never sends. */
export async function createGmailDrafts(_: FormState, formData: FormData): Promise<FormState> {
  const campaignId = z.uuid().parse(formData.get("campaign_id"));
  const { supabase, userId } = await requireUser();

  const [{ data: connection }, { data: drafts, error }] = await Promise.all([
    supabase.from("gmail_connections").select("refresh_token").maybeSingle(),
    supabase
      .from("outreach_drafts")
      .select("id, subject, body, contacts(first_name, last_name, email)")
      .eq("campaign_id", campaignId)
      .eq("status", "approved")
      .is("gmail_draft_id", null)
      .order("step")
      .overrideTypes<PendingDraft[]>(),
  ]);
  if (!connection) return { error: "Connect Gmail in Settings first." };
  if (error) return { error: "Could not load the drafts." };
  if (drafts.length === 0) return { success: "No approved drafts waiting. Approve drafts to send them to Gmail." };

  let created = 0;
  const skipped: string[] = [];
  let failure: string | undefined;
  try {
    const token = await accessToken(connection.refresh_token);
    for (const d of drafts) {
      if (!d.contacts?.email) {
        skipped.push(d.contacts ? fullName(d.contacts) : "General draft");
        continue;
      }
      const raw = rawMessage({ name: fullName(d.contacts), email: d.contacts.email }, d.subject, d.body);
      const gmailId = await createDraft(token, raw);
      const { error } = await supabase.from("outreach_drafts").update({ gmail_draft_id: gmailId }).eq("id", d.id);
      if (error) throw error;
      created++;
    }
  } catch (e) {
    console.error("gmail draft creation failed", e);
    if (e instanceof GmailAuthError) await supabase.from("gmail_connections").delete().eq("owner_id", userId);
    failure =
      e instanceof GmailAuthError
        ? "Your Gmail connection expired. Reconnect Gmail in Settings and try again."
        : "Something went wrong partway through. Try again to create the rest.";
  }

  revalidatePath(`/campaigns/${campaignId}`);
  const parts = [`Created ${created} Gmail draft${created === 1 ? "" : "s"}.`];
  if (skipped.length) parts.push(`Skipped (no email address): ${[...new Set(skipped)].join(", ")}.`);
  if (failure) parts.push(failure);
  const message = parts.join(" ");
  return failure || !created ? { error: message } : { success: message };
}
