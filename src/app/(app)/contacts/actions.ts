"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { contactSchema, parseTags } from "@/lib/contacts";
import { requireUser } from "@/lib/supabase/server";

export type ContactFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof contactSchema>, string[]>>;
  values?: Record<string, string>;
};

const optionalId = z.union([z.literal(""), z.uuid()]).optional();

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

/** Reuses the spelling of tags already on the user's contacts, so "vip" joins an existing "VIP". */
async function matchExistingTags(supabase: Supabase, tags: string[]) {
  const { data } = await supabase.from("contacts").select("tags");
  const known = new Map(data?.flatMap((r) => r.tags as string[]).map((t) => [t.toLowerCase(), t]));
  return tags.map((t) => known.get(t.toLowerCase()) ?? t);
}

/** Creates a contact, or updates it when the form includes an `id`. */
export async function saveContact(_: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const id = optionalId.parse(values.id);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const { supabase } = await requireUser();
  const contact = { ...parsed.data, tags: await matchExistingTags(supabase, parsed.data.tags) };
  const query = id
    ? supabase.from("contacts").update(contact).eq("id", id)
    : supabase.from("contacts").insert(contact);
  const { data, error } = await query.select("id").single();
  if (error) return { error: "Could not save the contact. Please try again.", values };

  revalidatePath("/contacts");
  redirect(`/contacts/${data.id}?saved=1`);
}

/** Archives or restores the contact named by the form's `id`. */
export async function setArchived(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const archived = formData.get("archived") === "1";
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("contacts")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error("Could not update the contact.");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}

export type TagFormState = { error?: string; success?: string };

/** Adds or removes the entered tags on every checked contact (`ids`). */
export async function tagContacts(_: TagFormState, formData: FormData): Promise<TagFormState> {
  const ids = z.array(z.uuid()).parse(formData.getAll("ids"));
  const entered = parseTags(String(formData.get("tag") ?? ""));
  const remove = formData.get("mode") === "remove";
  if (ids.length === 0) return { error: "Select at least one contact." };
  if (entered.length === 0) return { error: "Enter a tag." };

  const { supabase } = await requireUser();
  const tags = await matchExistingTags(supabase, entered);
  const { error } = remove
    ? await supabase.rpc("remove_contact_tags", { contact_ids: ids, old_tags: tags })
    : await supabase.rpc("add_contact_tags", { contact_ids: ids, new_tags: tags });
  if (error) return { error: "Could not update tags. Please try again." };

  revalidatePath("/contacts");
  const n = `${ids.length} contact${ids.length === 1 ? "" : "s"}`;
  return { success: remove ? `Removed from ${n}.` : `Tagged ${n}.` };
}

/** Renames (`intent=rename`, new `name`) or deletes (`intent=delete`) a tag on all of the user's contacts. */
export async function manageTag(_: TagFormState, formData: FormData): Promise<TagFormState> {
  const tag = z.string().min(1).parse(formData.get("tag"));
  const { supabase } = await requireUser();

  if (formData.get("intent") === "delete") {
    const { error } = await supabase.rpc("delete_contact_tag", { old_tag: tag });
    if (error) return { error: "Could not delete the tag. Please try again." };
    revalidatePath("/contacts", "layout");
    return { success: `Deleted "${tag}" from all contacts.` };
  }

  const [entered] = parseTags(String(formData.get("name") ?? ""));
  if (!entered) return { error: "Enter a new name for the tag." };
  const caseChangeOnly = entered.toLowerCase() === tag.toLowerCase();
  const [name] = caseChangeOnly ? [entered] : await matchExistingTags(supabase, [entered]);
  if (name === tag) return {};
  const { error } = await supabase.rpc("rename_contact_tag", { old_tag: tag, new_tag: name });
  if (error) return { error: "Could not rename the tag. Please try again." };
  revalidatePath("/contacts", "layout");
  return { success: `Renamed "${tag}" to "${name}".` };
}
