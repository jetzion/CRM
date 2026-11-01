"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, Field, FormMessage, Input, Textarea } from "@/components/ui";
import { MERGE_FIELDS } from "@/lib/outreach";
import type { Template, TemplateStep } from "@/lib/templates";
import { saveTemplate } from "../actions";
import { BriefFields } from "../brief-fields";

/** Edits a saved outreach version. Saving always creates the next version; the one shown is kept. */
export function TemplateEditor({ template, nextVersion }: { template: Template; nextVersion: number }) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [brief, setBrief] = useState(template.brief);
  const [steps, setSteps] = useState(template.steps);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const updateStep = <K extends keyof TemplateStep>(i: number, key: K, value: TemplateStep[K]) =>
    setSteps(steps.map((s, j) => (j === i ? { ...s, [key]: value } : s)));

  function addStep() {
    const last = steps.at(-1);
    setSteps([...steps, { day_offset: (last?.day_offset ?? 0) + 3, purpose: "Follow-up", subject: last?.subject ?? "", body: "" }]);
  }

  function save() {
    startTransition(async () => {
      const result = await saveTemplate({ name, brief, steps }, template.family_id);
      if (result.id) router.push(`/outreach/saved/${result.id}?saved=1`);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <Field label="Name" htmlFor="template-name">
          <Input id="template-name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
        </Field>
        <BriefFields value={brief} onChange={setBrief} />
      </Card>

      <section aria-labelledby="emails-heading" className="space-y-3">
        <h2 id="emails-heading" className="text-lg font-semibold">Emails</h2>
        <p className="text-sm text-zinc-600">
          Placeholders: {MERGE_FIELDS.map((f) => `{{${f}}}`).join(", ")}. They are filled in for each contact when you use this outreach.
        </p>
        {steps.map((s, i) => (
          <Card key={i} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <h3 className="mr-auto font-medium">Step {i + 1}</h3>
              <Field label="Day" htmlFor={`s${i}-day`}>
                <Input id={`s${i}-day`} type="number" min={0} max={365} value={s.day_offset} onChange={(e) => updateStep(i, "day_offset", Number(e.target.value))} />
              </Field>
              <Field label="Purpose" htmlFor={`s${i}-purpose`}>
                <Input id={`s${i}-purpose`} value={s.purpose} maxLength={300} onChange={(e) => updateStep(i, "purpose", e.target.value)} />
              </Field>
              {steps.length > 1 && (
                <Button type="button" variant="danger" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>Remove</Button>
              )}
            </div>
            <Field label="Subject" htmlFor={`s${i}-subject`}>
              <Input id={`s${i}-subject`} value={s.subject} maxLength={300} onChange={(e) => updateStep(i, "subject", e.target.value)} />
            </Field>
            <Field label="Body" htmlFor={`s${i}-body`}>
              <Textarea id={`s${i}-body`} rows={8} value={s.body} maxLength={20000} onChange={(e) => updateStep(i, "body", e.target.value)} />
            </Field>
          </Card>
        ))}
        {steps.length < 10 && (
          <Button type="button" variant="secondary" onClick={addStep}>Add follow-up step</Button>
        )}
      </section>

      <FormMessage error={error} />
      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4">
        <Button type="button" disabled={pending} onClick={save}>
          {pending ? "Saving..." : `Save as version ${nextVersion}`}
        </Button>
        <p className="text-sm text-zinc-600">Earlier versions are kept.</p>
      </div>
    </div>
  );
}
