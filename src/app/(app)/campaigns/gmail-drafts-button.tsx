"use client";

import { useActionState } from "react";
import { Button, FormMessage } from "@/components/ui";
import type { FormState } from "./actions";
import { createGmailDrafts } from "./gmail-actions";

/** Turns the campaign's approved drafts into Gmail drafts. Nothing is sent. */
export function GmailDraftsButton({ campaignId }: { campaignId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createGmailDrafts, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating drafts..." : "Create Gmail drafts"}
      </Button>
      <FormMessage error={state.error} success={state.success} />
    </form>
  );
}
