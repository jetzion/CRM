import { Button, Card, FormMessage } from "@/components/ui";
import { gmailConfigured } from "@/lib/gmail";
import { disconnectGmail } from "./actions";

const statusMessages: Record<string, { error?: string; success?: string }> = {
  connected: { success: "Gmail connected." },
  failed: { error: "Could not connect Gmail. Please try again." },
  unconfigured: { error: "Gmail is not configured on the server." },
};

/** Connect or disconnect the Gmail account used to create outreach drafts. */
export function GmailCard({ email, status }: { email?: string; status?: string }) {
  const message = status ? statusMessages[status] : undefined;
  return (
    <Card>
      <h2 className="mb-2 font-semibold">Gmail</h2>
      <p className="mb-4 text-sm text-zinc-600">
        {email
          ? `Connected as ${email}. Campaigns can create drafts in this account. SimpleCRM can only create drafts; it cannot read or send your email.`
          : gmailConfigured()
            ? "Connect Gmail to turn campaign emails into Gmail drafts. SimpleCRM only asks for permission to create drafts; it cannot read or send your email."
            : "Not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server to enable Gmail drafts."}
      </p>
      {message && <div className="mb-4"><FormMessage {...message} /></div>}
      {email ? (
        <form action={disconnectGmail}>
          <Button variant="secondary">Disconnect Gmail</Button>
        </form>
      ) : (
        gmailConfigured() && (
          <form action="/api/gmail/connect">
            <Button>Connect Gmail</Button>
          </form>
        )
      )}
    </Card>
  );
}
