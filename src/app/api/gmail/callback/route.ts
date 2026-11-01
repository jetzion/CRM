import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { exchangeCode, profileEmail, STATE_COOKIE } from "@/lib/gmail";
import { requireUser } from "@/lib/supabase/server";

/** Completes the Google consent flow and stores the refresh token for the signed-in user. */
export async function GET(req: Request) {
  const { supabase, userId } = await requireUser();
  const url = new URL(req.url);
  const cookieStore = await cookies();
  const expected = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete({ name: STATE_COOKIE, path: "/api/gmail" });

  const code = url.searchParams.get("code");
  if (!code || !expected || url.searchParams.get("state") !== expected) redirect("/settings?gmail=failed");

  const connected = await connect(code, `${url.origin}/api/gmail/callback`)
    .then(({ email, refreshToken }) =>
      supabase.from("gmail_connections").upsert({ owner_id: userId, email, refresh_token: refreshToken }),
    )
    .then(({ error }) => !error)
    .catch((e) => {
      console.error("gmail connect failed", e);
      return false;
    });
  redirect(connected ? "/settings?gmail=connected" : "/settings?gmail=failed");
}

/** Exchanges the code and looks up the connected address. Google errors (expired code, bad config) reject. */
async function connect(code: string, redirectUri: string) {
  const tokens = await exchangeCode(code, redirectUri);
  if (!tokens.refresh_token) throw new Error("Google returned no refresh token.");
  return { email: await profileEmail(tokens.access_token), refreshToken: tokens.refresh_token };
}
