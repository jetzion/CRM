"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { templateSchema, type TemplateInput } from "@/lib/templates";

export type SaveTemplateResult = { error?: string; id?: string; version?: number };

/** Saves outreach as version 1 of a new template, or as the next version of `familyId`. Versions are never overwritten. */
export async function saveTemplate(input: TemplateInput, familyId?: string): Promise<SaveTemplateResult> {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid outreach." };

  const { supabase } = await requireUser();
  let family = crypto.randomUUID();
  let version = 1;
  if (familyId) {
    const { data: latest } = await supabase
      .from("outreach_templates")
      .select("version")
      .eq("family_id", z.uuid().parse(familyId))
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return { error: "That template no longer exists." };
    family = familyId;
    version = latest.version + 1;
  }

  const { data, error } = await supabase
    .from("outreach_templates")
    .insert({ family_id: family, version, ...parsed.data })
    .select("id")
    .single();
  if (error) return { error: "Could not save the outreach. Please try again." };

  revalidatePath("/outreach", "layout");
  return { id: data.id, version };
}

/** Deletes a template with all its versions (`family_id`). Campaigns made from it are kept. */
export async function deleteTemplate(formData: FormData) {
  const familyId = z.uuid().parse(formData.get("family_id"));
  const { supabase } = await requireUser();
  const { error } = await supabase.from("outreach_templates").delete().eq("family_id", familyId);
  if (error) throw new Error("Could not delete the template.");
  revalidatePath("/outreach", "layout");
  redirect("/outreach/saved");
}
