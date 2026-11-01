import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authUrl, gmailConfigured, STATE_COOKIE } from "@/lib/gmail";
import { requireUser } from "@/lib/supabase/server";

/** Starts the Google consent flow for creating Gmail drafts. */
export async function GET(req: Request) {
  await requireUser();
  if (!gmailConfigured()) redirect("/settings?gmail=unconfigured");

  const state = crypto.randomUUID();
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/gmail",
  });
  redirect(authUrl(state, `${new URL(req.url).origin}/api/gmail/callback`));
}
