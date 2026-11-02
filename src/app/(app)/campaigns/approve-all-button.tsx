"use client";

import { Button } from "@/components/ui";
import { approveAllDrafts } from "./actions";

/** Approves all of the campaign's drafts that need review, after the user confirms. */
export function ApproveAllButton({ campaignId, count }: { campaignId: string; count: number }) {
  return (
    <form
      action={approveAllDrafts}
      onSubmit={(e) => {
        if (!confirm(`Approve all ${count} draft${count === 1 ? "" : "s"} that need review? Approving never sends email.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="campaign_id" value={campaignId} />
      <Button variant="secondary">Approve all ({count})</Button>
    </form>
  );
}
