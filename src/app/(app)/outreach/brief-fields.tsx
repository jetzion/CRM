"use client";

import { Field, Input, Select, Textarea } from "@/components/ui";
import { tones } from "@/lib/outreach";
import type { Brief } from "@/lib/templates";

/** Outreach settings form fields, shared by the assistant and the saved outreach editor. */
export function BriefFields({ value, onChange }: { value: Brief; onChange: (brief: Brief) => void }) {
  const set = <K extends keyof Brief>(key: K, v: Brief[K]) => onChange({ ...value, [key]: v });
  return (
    <>
      <Field label="Goal" htmlFor="goal">
        <Textarea id="goal" rows={2} value={value.goal} onChange={(e) => set("goal", e.target.value)} placeholder="e.g. Book intro calls about our new analytics product" />
      </Field>
      <Field label="Audience (optional)" htmlFor="audience">
        <Input id="audience" value={value.audience} onChange={(e) => set("audience", e.target.value)} placeholder="e.g. Ops leaders we met at the expo" />
      </Field>
      <Field label="Value proposition (optional)" htmlFor="valueProp">
        <Textarea id="valueProp" rows={2} value={value.valueProp} onChange={(e) => set("valueProp", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tone" htmlFor="tone">
          <Select id="tone" value={value.tone} onChange={(e) => set("tone", e.target.value as Brief["tone"])}>
            {tones.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Format" htmlFor="mode">
          <Select id="mode" value={value.mode} onChange={(e) => set("mode", e.target.value as Brief["mode"])}>
            <option value="single">One-off email</option>
            <option value="sequence">Multi-step sequence</option>
          </Select>
        </Field>
      </div>
      <Field label="Call to action (optional)" htmlFor="cta">
        <Input id="cta" value={value.cta} onChange={(e) => set("cta", e.target.value)} placeholder="e.g. 20-minute call next week" />
      </Field>
      <Field label="Claims or topics to avoid (optional)" htmlFor="avoid">
        <Textarea id="avoid" rows={2} value={value.avoid} onChange={(e) => set("avoid", e.target.value)} />
      </Field>
    </>
  );
}
