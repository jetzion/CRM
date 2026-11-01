"use client";

import { Button } from "@/components/ui";
import { deleteTemplate } from "../actions";

/** Deletes a template and all its versions after the user confirms. */
export function DeleteTemplateButton({ familyId, name, className }: { familyId: string; name: string; className?: string }) {
  return (
    <form
      action={deleteTemplate}
      onSubmit={(e) => {
        if (!confirm(`Delete the template "${name}" and all its versions? Campaigns made from it are kept.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="family_id" value={familyId} />
      <Button variant="danger" className={className}>Delete</Button>
    </form>
  );
}
