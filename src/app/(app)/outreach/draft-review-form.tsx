"use client";

import { useState } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { MERGE_FIELDS } from "@/lib/outreach";

type Props = {
  disabled: boolean;
  saving: boolean;
  onReview: (text: string) => void;
  onUse: (subject: string, body: string) => void;
  onSaveTemplate: (subject: string, body: string) => void;
  initialSubject?: string;
  initialBody?: string;
};

/** Lets the user write their own email and either send it to the assistant for review or save it as is. */
export function DraftReviewForm({ disabled, saving, onReview, onUse, onSaveTemplate, initialSubject = "", initialBody = "" }: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [skipReview, setSkipReview] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (skipReview) onUse(subject.trim(), body.trim());
        else onReview(`Please review my draft and suggest improvements.\n\nSubject: ${subject.trim()}\n\n${body.trim()}`);
      }}
    >
      <Field label="Subject" htmlFor="own-subject">
        <Input id="own-subject" value={subject} maxLength={300} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Body" htmlFor="own-body">
        <Textarea id="own-body" rows={8} value={body} maxLength={20000} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={skipReview}
          onChange={(e) => setSkipReview(e.target.checked)}
          className="size-4 accent-accent"
        />
        Skip AI Assists Review
      </label>
      {skipReview && (
        <p className="text-sm text-zinc-600">
          Personalize with {MERGE_FIELDS.map((f) => `{{${f}}}`).join(", ")}. They are filled in for each contact, and {"{{your_name}}"} with your name from Settings. Nothing else is changed.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="secondary"
          disabled={saving || !body.trim() || (skipReview ? !subject.trim() : disabled)}
        >
          {skipReview ? (saving ? "Saving..." : "Save as campaign") : "Review my draft"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!subject.trim() || !body.trim()}
          onClick={() => onSaveTemplate(subject.trim(), body.trim())}
        >
          Save as template
        </Button>
      </div>
    </form>
  );
}
