"use client";

import { Button } from "@/components/ui";
import { deleteCampaign } from "./actions";

/** Deletes the campaign after the user confirms. */
export function DeleteCampaignButton({ campaignId, className }: { campaignId: string; className?: string }) {
  return (
    <form
      action={deleteCampaign}
      onSubmit={(e) => {
        if (!confirm("Delete this campaign and all its drafts? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={campaignId} />
      <Button variant="danger" className={className}>Delete</Button>
    </form>
  );
}
