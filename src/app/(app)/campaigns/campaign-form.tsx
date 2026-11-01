"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import { updateCampaign, type FormState } from "./actions";

type Campaign = { id: string; name: string; goal: string; audience_notes: string | null; status: string };

/** Edits a campaign's name, goal, audience notes, and status. */
export function CampaignForm({ campaign }: { campaign: Campaign }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateCampaign, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={campaign.id} />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" required maxLength={200} defaultValue={campaign.name} />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={campaign.status}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>
        </Field>
      </div>
      <Field label="Goal" htmlFor="goal">
        <Textarea id="goal" name="goal" rows={2} maxLength={2000} defaultValue={campaign.goal} />
      </Field>
      <Field label="Audience notes" htmlFor="audience_notes">
        <Textarea id="audience_notes" name="audience_notes" rows={2} maxLength={2000} defaultValue={campaign.audience_notes ?? ""} />
      </Field>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving..." : "Save details"}
      </Button>
    </form>
  );
}
