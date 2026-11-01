import { Button, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/supabase/server";
import { signOut } from "../../(auth)/actions";
import { GmailCard } from "./gmail-card";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { gmail } = await searchParams;
  const { supabase, userId } = await requireUser();
  const [{ data: profile }, { data: claims }, { data: gmailConnection }] = await Promise.all([
    supabase.from("profiles").select("display_name, signature").eq("id", userId).single(),
    supabase.auth.getClaims(),
    supabase.from("gmail_connections").select("email").maybeSingle(),
  ]);
  const aiConfigured = !!process.env.OPENROUTER_API_KEY;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-xl space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold">Profile</h2>
          <ProfileForm displayName={profile?.display_name ?? ""} signature={profile?.signature ?? ""} />
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Account</h2>
          <p className="mb-4 text-sm text-zinc-600">Signed in as {String(claims?.claims.email ?? "")}</p>
          <form action={signOut}>
            <Button variant="secondary">Sign out</Button>
          </form>
        </Card>

        <GmailCard email={gmailConnection?.email} status={typeof gmail === "string" ? gmail : undefined} />

        <Card>
          <h2 className="mb-2 font-semibold">AI assistant</h2>
          <p className="text-sm text-zinc-600">
            {aiConfigured
              ? "Connected through OpenRouter. Only the contact fields you see on the outreach page, plus your name and signature, are shared."
              : "Not configured. Set OPENROUTER_API_KEY on the server to enable outreach drafting."}
          </p>
        </Card>
      </div>
    </>
  );
}
