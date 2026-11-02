"use client";

import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { DefaultChatTransport } from "ai";
import { useMemo, useState, useTransition } from "react";
import { Button, Card, FormMessage, Input } from "@/components/ui";
import { fullName, type Contact } from "@/lib/contacts";
import { AI_FIELDS, expandShared, isSharedMode, MERGE_FIELDS, personalize, SHARED_CONTACT, usedMergeFields, type MergeField, type OutreachContext, type OutreachPlan, type OutreachUIMessage } from "@/lib/outreach";
import { planToSteps, type Template, type TemplateStep } from "@/lib/templates";
import { saveCampaign } from "../campaigns/actions";
import { saveTemplate, type SaveTemplateResult } from "./actions";
import { ContactPicker } from "./contact-picker";
import { DraftReviewForm } from "./draft-review-form";
import { BriefFields } from "./brief-fields";
import { PlanEditor } from "./plan-editor";
import { TemplateCard } from "./template-card";

export type PickerContact = Pick<Contact, "id" | "first_name" | "last_name" | "company" | "job_title" | "status" | "tags">;

type Settings = Omit<OutreachContext, "contactIds">;

const initialSettings: Settings = { goal: "", audience: "", valueProp: "", tone: "friendly", cta: "", avoid: "", mode: "single" };

/** Turns an API or stream error into a short message for the user. */
function errorMessage(error: Error) {
  try {
    return JSON.parse(error.message).error as string;
  } catch {
    return error.message || "Something went wrong. Please try again.";
  }
}

type WorkspaceProps = { contacts: PickerContact[]; initialSelected: string[]; senderName: string; template?: Template };

export function OutreachWorkspace({ contacts, initialSelected, senderName, template }: WorkspaceProps) {
  const [selected, setSelected] = useState(initialSelected);
  const [settings, setSettings] = useState<Settings>(() =>
    template ? { ...template.brief, mode: template.steps.length > 1 ? "sequence" : "single" } : initialSettings,
  );
  const [input, setInput] = useState("");
  const [formError, setFormError] = useState<string>();
  const [edits, setEdits] = useState<Record<string, OutreachPlan>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string | undefined>>({});
  const [savingId, setSavingId] = useState<string>();
  const [templateResult, setTemplateResult] = useState<SaveTemplateResult>();
  const [, startTransition] = useTransition();
  const byId = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  const { messages, setMessages, sendMessage, regenerate, status, error, stop, clearError } = useChat<OutreachUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/outreach" }),
  });
  const busy = status === "submitted" || status === "streaming";

  const planParts = messages.flatMap((m) =>
    m.parts.flatMap((p) => (p.type === "tool-proposeOutreach" && p.state !== "input-streaming" && p.input ? [p] : [])),
  );
  const latestPart = planParts.at(-1);
  const latestPlan = latestPart ? (edits[latestPart.toolCallId] ?? (latestPart.input as OutreachPlan)) : undefined;

  function requestBody() {
    return { context: { ...settings, contactIds: selected }, currentPlan: latestPlan };
  }

  function validate() {
    if (selected.length === 0) return "Select at least one contact.";
    if (!settings.goal.trim()) return "Describe the outreach goal.";
  }

  function send(text: string) {
    const problem = validate();
    setFormError(problem);
    if (problem || !text.trim()) return;
    sendMessage({ text }, { body: requestBody() });
    setInput("");
  }

  /** Discards the conversation and unsaved plans. Contacts and settings are kept. */
  function clearChat() {
    if (!confirm("Clear the conversation? Unsaved drafts will be lost.")) return;
    stop();
    clearError();
    setMessages([]);
    setEdits({});
    setSaveErrors({});
    setFormError(undefined);
    setInput("");
  }

  const mergeValues = (c: PickerContact) => ({ ...c, your_name: senderName });
  const valuesFor = (id: string) => {
    const c = byId.get(id);
    return c ? mergeValues(c) : {};
  };

  /** Why placeholders in this text cannot be filled in for every selected contact, if anything. */
  function placeholderProblem(text: string) {
    if (selected.length === 0) return "Select at least one contact.";
    const fields = usedMergeFields(text);
    const unknown = fields.filter((f) => !(MERGE_FIELDS as readonly string[]).includes(f));
    if (unknown.length) return `Unknown placeholder ${unknown.map((f) => `{{${f}}}`).join(", ")}. Use ${MERGE_FIELDS.map((f) => `{{${f}}}`).join(", ")}.`;
    if (fields.includes("your_name") && !senderName) return "Set your name in Settings to use {{your_name}}.";
    const gaps = selectedContacts.flatMap((c) => {
      const missing = (fields as MergeField[]).filter((f) => !mergeValues(c)[f]);
      return missing.length ? [`${fullName(c)} (no ${missing.join(", ")})`] : [];
    });
    const shown = gaps.length > 5 ? [...gaps.slice(0, 5), `${gaps.length - 5} more`] : gaps;
    if (gaps.length) return `Missing details: ${shown.join("; ")}. Fill them in on the contact or remove the placeholder.`;
  }

  /** Saves emails personalized per contact but otherwise exactly as written. No AI involved. `approved` skips review. */
  function saveOwnSteps(steps: TemplateStep[], { approved, campaignName }: { approved: boolean; campaignName?: string }) {
    const problem = placeholderProblem(steps.map((s) => `${s.subject}\n${s.body}`).join("\n"));
    setFormError(problem);
    if (problem) return;
    const [first] = selectedContacts;
    const others = selectedContacts.length - 1;
    const name = (campaignName ?? `${personalize(steps[0].subject, mergeValues(first))}${others ? ` + ${others} more` : ""}`).slice(0, 200);
    setSavingId("own");
    startTransition(async () => {
      const result = await saveCampaign({
        name,
        goal: settings.goal,
        audienceNotes: settings.audience,
        contactIds: selected,
        plan: {
          campaign_name: name,
          summary: "",
          missing_info: [],
          steps: steps.map((s, i) => ({
            step: i + 1,
            day_offset: s.day_offset,
            purpose: s.purpose || "Your email",
            drafts: selectedContacts.map((c) => ({ contact_id: c.id, subject: personalize(s.subject, mergeValues(c)), body: personalize(s.body, mergeValues(c)) })),
          })),
          follow_up_tasks: [],
        },
        taskIndexes: [],
        approved,
      });
      setFormError(result.error);
      setSavingId(undefined);
    });
  }

  /** Asks the assistant to adapt a saved outreach to each selected contact. */
  function personalizeTemplate(t: Template) {
    const emails = t.steps
      .map((s, i) => `Step ${i + 1} (day ${s.day_offset}${s.purpose ? `, ${s.purpose}` : ""})\nSubject: ${s.subject}\n\n${s.body}`)
      .join("\n\n---\n\n");
    send(`Please personalize this saved outreach for each selected contact. Keep its steps, structure and meaning.\n\n${emails}`);
  }

  /** Asks for a name and saves the settings and email steps as a reusable template. */
  function saveAsTemplate(defaultName: string, steps: TemplateStep[]) {
    const name = prompt("Name this outreach so you can reuse it later:", defaultName);
    if (!name?.trim()) return;
    startTransition(async () => setTemplateResult(await saveTemplate({ name, brief: settings, steps })));
  }

  /** Saves a plan as a campaign. Shared drafts and tasks become one per selected contact, with placeholders filled in. */
  function save(toolCallId: string, plan: OutreachPlan, taskIndexes: number[]) {
    const chosen = { ...plan, follow_up_tasks: taskIndexes.map((i) => plan.follow_up_tasks[i]) };
    const sharedText = [
      ...chosen.steps.flatMap((s) => s.drafts.filter((d) => d.contact_id === SHARED_CONTACT).map((d) => `${d.subject}\n${d.body}`)),
      ...chosen.follow_up_tasks.filter((t) => t.contact_id === SHARED_CONTACT).map((t) => t.title),
    ].join("\n");
    const problem = sharedText ? placeholderProblem(sharedText) : undefined;
    setSaveErrors((e) => ({ ...e, [toolCallId]: problem }));
    if (problem) return;
    const full = expandShared(chosen, selectedContacts.map((c) => ({ id: c.id, values: mergeValues(c) })));
    setSavingId(toolCallId);
    startTransition(async () => {
      const result = await saveCampaign({
        name: plan.campaign_name,
        goal: settings.goal,
        audienceNotes: settings.audience,
        contactIds: selected,
        plan: full,
        taskIndexes: full.follow_up_tasks.map((_, i) => i),
      });
      setSaveErrors((e) => ({ ...e, [toolCallId]: result.error }));
      setSavingId(undefined);
    });
  }

  const selectedContacts = selected.map((id) => byId.get(id)).filter((c): c is PickerContact => !!c);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="space-y-4 self-start">
        <h2 className="font-semibold">Campaign settings</h2>
        <ContactPicker contacts={contacts} selected={selected} onChange={setSelected} />
        <BriefFields value={settings} onChange={setSettings} />

        <div className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-700">
          <p className="font-medium">Shared with the AI</p>
          {isSharedMode(selected.length) ? (
            <p className="mt-1">
              Only the number of selected contacts ({selected.length}) and the settings above. Contact details are not shared;
              placeholders are filled in for each contact when you save.
            </p>
          ) : (
            <p className="mt-1">
              {AI_FIELDS.map((f) => f.label).join(", ")} for {selected.length} selected contact{selected.length === 1 ? "" : "s"}, plus
              the settings above. Email addresses and phone numbers are never shared.
            </p>
          )}
          {selectedContacts.length > 0 && !isSharedMode(selected.length) && (
            <ul className="mt-2 space-y-0.5">
              {selectedContacts.map((c) => {
                const missing = [!c.company && "company", !c.job_title && "job title"].filter(Boolean);
                return (
                  <li key={c.id}>
                    {fullName(c)}
                    {missing.length > 0 && <span className="text-amber-800"> (no {missing.join(" or ")})</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        {template && messages.length === 0 && (
          <TemplateCard
            template={template}
            busy={busy}
            saving={savingId === "own"}
            onPersonalize={() => personalizeTemplate(template)}
            onCreate={() => saveOwnSteps(template.steps, { approved: false, campaignName: template.name })}
          />
        )}
        {messages.length === 0 && (
          <Card className="text-sm text-zinc-700">
            <p>Choose your audience and goal, then ask the assistant to draft. You can refine the result in chat or edit it directly.</p>
            <Button className="mt-4" disabled={busy} onClick={() => send("Please draft the outreach based on these settings.")}>
              Generate drafts
            </Button>
            <h3 className="mt-6 mb-1 font-medium text-zinc-900">Or write your own</h3>
            <p className="mb-3">
              The assistant reviews it and suggests an improved version for each selected contact. Check Skip AI Assists
              Review to save it exactly as written, approved, as a campaign for every selected contact.
            </p>
            <DraftReviewForm
              disabled={busy}
              initialSubject={template?.steps[0]?.subject}
              initialBody={template?.steps[0]?.body}
              saving={savingId === "own"}
              onReview={send}
              onUse={(subject, body) => saveOwnSteps([{ day_offset: 0, purpose: "", subject, body }], { approved: true })}
              onSaveTemplate={(subject, body) => saveAsTemplate(subject, [{ day_offset: 0, purpose: "", subject, body }])}
            />
          </Card>
        )}

        <ol className="space-y-4" aria-live="polite">
          {messages.map((m) => (
            <li key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={m.role === "user" ? "max-w-[85%] rounded-lg bg-accent px-4 py-2 text-sm text-white" : "w-full space-y-3"}>
                {m.parts.map((p, i) => {
                  if (p.type === "text") return <p key={i} className="whitespace-pre-wrap text-sm">{p.text}</p>;
                  if (p.type !== "tool-proposeOutreach") return null;
                  if (p.state === "input-streaming" || !p.input) return <p key={i} className="text-sm text-zinc-500">Drafting...</p>;
                  if (p.state === "output-error") return <FormMessage key={i} error="The draft could not be generated. Try again." />;
                  return (
                    <PlanEditor
                      key={p.toolCallId}
                      plan={edits[p.toolCallId] ?? (p.input as OutreachPlan)}
                      contacts={byId}
                      selectedCount={selected.length}
                      saving={savingId === p.toolCallId}
                      saveError={saveErrors[p.toolCallId]}
                      onChange={(plan) => setEdits((e) => ({ ...e, [p.toolCallId]: plan }))}
                      onSave={(plan, taskIndexes) => save(p.toolCallId, plan, taskIndexes)}
                      onSaveTemplate={(plan) =>
                        saveAsTemplate(plan.campaign_name, planToSteps(plan, valuesFor))
                      }
                    />
                  );
                })}
              </div>
            </li>
          ))}
        </ol>

        {busy && (
          <div className="flex items-center gap-3 text-sm text-zinc-600" role="status">
            Working on it...
            <button type="button" onClick={stop} className="text-accent hover:underline">Stop</button>
          </div>
        )}
        {error && (
          <div className="flex flex-wrap items-center gap-3">
            <FormMessage error={errorMessage(error)} />
            <Button variant="secondary" onClick={() => regenerate({ body: requestBody() })}>Retry</Button>
          </div>
        )}
        <FormMessage error={formError ?? templateResult?.error} />
        {templateResult?.id && (
          <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Saved as version {templateResult.version}.{" "}
            <Link href={`/outreach/saved/${templateResult.id}`} className="font-medium underline">View template</Link>
          </p>
        )}

        {messages.length > 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <label htmlFor="chat-input" className="sr-only">Message the assistant</label>
            <Input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for changes, e.g. shorter, mention the webinar"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !input.trim()}>Send</Button>
            <Button type="button" variant="secondary" onClick={clearChat}>Clear chat</Button>
          </form>
        )}
      </div>
    </div>
  );
}
