"use client";

import { useState } from "react";
import { Button, Field, FormMessage, Input, Textarea } from "@/components/ui";
import { fullName } from "@/lib/contacts";
import { SHARED_CONTACT, type OutreachPlan } from "@/lib/outreach";
import type { PickerContact } from "./workspace";

type Props = {
  plan: OutreachPlan;
  contacts: Map<string, PickerContact>;
  selectedCount: number;
  saving: boolean;
  saveError?: string;
  onChange: (plan: OutreachPlan) => void;
  onSave: (plan: OutreachPlan, taskIndexes: number[]) => void;
  onSaveTemplate: (plan: OutreachPlan) => void;
};

/** Editable view of a generated plan. Nothing is stored until the user clicks save. */
export function PlanEditor({ plan, contacts, selectedCount, saving, saveError, onChange, onSave, onSaveTemplate }: Props) {
  const [taskChecked, setTaskChecked] = useState(() => plan.follow_up_tasks.map(() => true));
  const nameOf = (id: string) => {
    if (id === SHARED_CONTACT) return `All ${selectedCount} selected contacts (placeholders filled in for each)`;
    const c = contacts.get(id);
    return c ? fullName(c) : "Unknown contact (will not be saved)";
  };

  function updateDraft(stepIndex: number, draftIndex: number, field: "subject" | "body", value: string) {
    onChange({
      ...plan,
      steps: plan.steps.map((s, i) =>
        i !== stepIndex ? s : { ...s, drafts: s.drafts.map((d, j) => (j === draftIndex ? { ...d, [field]: value } : d)) },
      ),
    });
  }

  function updateTask(index: number, title: string) {
    onChange({ ...plan, follow_up_tasks: plan.follow_up_tasks.map((t, i) => (i === index ? { ...t, title } : t)) });
  }

  return (
    <div className="space-y-5 rounded-lg bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
      <Field label="Campaign name" htmlFor="campaign_name">
        <Input id="campaign_name" value={plan.campaign_name} onChange={(e) => onChange({ ...plan, campaign_name: e.target.value })} />
      </Field>
      {plan.summary && <p className="text-sm text-zinc-700">{plan.summary}</p>}

      {plan.missing_info.length > 0 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Missing details. Fill these in or remove the placeholders:</p>
          <ul className="mt-1 list-disc pl-5">
            {plan.missing_info.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.steps.map((step, si) => (
        <section key={si} className="space-y-3">
          <h3 className="font-semibold">
            Step {step.step} <span className="font-normal text-zinc-500">· day {step.day_offset} · {step.purpose}</span>
          </h3>
          {step.drafts.map((draft, di) => {
            const id = `s${si}d${di}`;
            return (
              <div key={di} className="space-y-2 rounded-md border border-zinc-200 p-3">
                <p className="text-sm font-medium text-zinc-700">To: {nameOf(draft.contact_id)}</p>
                <Field label="Subject" htmlFor={`${id}-subject`}>
                  <Input id={`${id}-subject`} value={draft.subject} onChange={(e) => updateDraft(si, di, "subject", e.target.value)} />
                </Field>
                <Field label="Body" htmlFor={`${id}-body`}>
                  <Textarea id={`${id}-body`} rows={8} value={draft.body} onChange={(e) => updateDraft(si, di, "body", e.target.value)} />
                </Field>
              </div>
            );
          })}
        </section>
      ))}

      {plan.follow_up_tasks.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-1 font-semibold">Suggested follow-up tasks</legend>
          {plan.follow_up_tasks.map((t, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                aria-label={`Create task "${t.title}"`}
                checked={taskChecked[i] ?? true}
                onChange={(e) => setTaskChecked(taskChecked.map((v, j) => (j === i ? e.target.checked : v)))}
                className="size-4 accent-accent"
              />
              <div className="min-w-48 flex-1">
                <Input aria-label="Task title" value={t.title} onChange={(e) => updateTask(i, e.target.value)} />
              </div>
              <span className="text-sm text-zinc-600">
                {nameOf(t.contact_id)} · day {t.day_offset}
              </span>
            </div>
          ))}
        </fieldset>
      )}

      <FormMessage error={saveError} />
      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4">
        <Button
          type="button"
          disabled={saving}
          onClick={() => onSave(plan, plan.follow_up_tasks.flatMap((_, i) => ((taskChecked[i] ?? true) ? [i] : [])))}
        >
          {saving ? "Saving..." : "Save as campaign"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => onSaveTemplate(plan)}>
          Save as template
        </Button>
        <p className="text-sm text-zinc-600">Saves drafts for review. Nothing is sent.</p>
      </div>
    </div>
  );
}
