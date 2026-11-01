"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import type { Template } from "@/lib/templates";

type Props = {
  template: Template;
  busy: boolean;
  saving: boolean;
  onPersonalize: () => void;
  onCreate: () => void;
};

/** The saved outreach being reused, with the two ways to turn it into a campaign for the selected contacts. */
export function TemplateCard({ template, busy, saving, onPersonalize, onCreate }: Props) {
  return (
    <Card className="space-y-3 ring-violet-300">
      <p className="text-sm text-zinc-600">
        Using template{" "}
        <Link href={`/outreach/saved/${template.id}`} className="font-medium text-accent hover:underline">
          {template.name}
        </Link>{" "}
        (version {template.version})
      </p>
      <ol className="space-y-1 text-sm">
        {template.steps.map((s, i) => (
          <li key={i}>
            <span className="text-zinc-500">Step {i + 1} · day {s.day_offset}:</span> {s.subject}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={onPersonalize}>Personalize with AI</Button>
        <Button variant="secondary" disabled={saving} onClick={onCreate}>
          {saving ? "Saving..." : "Create campaign now"}
        </Button>
      </div>
      <p className="text-sm text-zinc-600">
        Personalize with AI adapts each email to every selected contact. Create campaign now fills in the placeholders for
        each contact and saves the emails as written. Either way, review and approve the drafts in the campaign.
      </p>
    </Card>
  );
}
