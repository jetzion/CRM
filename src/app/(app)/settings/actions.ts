"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revoke } from "@/lib/gmail";
import { requireUser } from "@/lib/supabase/server";

export type ProfileState = { error?: string; success?: string };

const profileSchema = z.object({
  display_name: z.string().trim().max(100, "Name is too long."),
  signature: z.string().trim().max(1000, "Signature is too long."),
});

/** Updates the signed-in user's display name and email signature. */
export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error) return { error: "Could not save your profile." };
  revalidatePath("/", "layout");
  return { success: "Profile saved." };
}

/** Revokes the CRM's Gmail access and forgets the stored token. */
export async function disconnectGmail() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.from("gmail_connections").select("refresh_token").maybeSingle();
  if (data) await revoke(data.refresh_token);
  await supabase.from("gmail_connections").delete().eq("owner_id", userId);
  revalidatePath("/settings");
}
