import "server-only";

const SCOPE = "https://www.googleapis.com/auth/gmail.compose";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

/** Short-lived cookie holding the OAuth state while the user is on Google's consent screen. */
export const STATE_COOKIE = "gmail_oauth_state";

/** Raised when Google rejects the stored refresh token; the user must reconnect. */
export class GmailAuthError extends Error {}

export function gmailConfigured() {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

/** Google consent URL asking only for permission to create drafts. */
export function authUrl(state: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...params,
    }),
  });
  const data = await res.json();
  if (data.error === "invalid_grant") throw new GmailAuthError(data.error_description);
  if (!res.ok) throw new Error(`Google token request failed: ${data.error}`);
  return data as { access_token: string; refresh_token?: string };
}

/** Exchanges an OAuth code for tokens. */
export function exchangeCode(code: string, redirectUri: string) {
  return tokenRequest({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });
}

/** Returns a fresh access token for a stored refresh token. */
export async function accessToken(refreshToken: string) {
  return (await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" })).access_token;
}

async function gmail<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GMAIL_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (res.status === 401) throw new GmailAuthError("Gmail access was revoked.");
  if (!res.ok) throw new Error(`Gmail request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Email address of the connected Gmail account. */
export async function profileEmail(token: string) {
  return (await gmail<{ emailAddress: string }>(token, "/profile")).emailAddress;
}

/** RFC 2047 encoded-word, so non-ASCII names and subjects survive. */
function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=`;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Web addresses (http(s):// or www.) and email addresses, without trailing punctuation. */
const LINK = /\b(?:https?:\/\/|www\.)[^\s<]*[^\s<.,;:!?)\]'"]|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;

/** HTML version of a plain-text body: escaped, line breaks kept, web and email addresses clickable. */
export function bodyHtml(text: string) {
  const linked = escapeHtml(text).replace(LINK, (m) => {
    const href = m.includes("@") && !m.includes("/") ? `mailto:${m}` : m.startsWith("www.") ? `https://${m}` : m;
    return `<a href="${href}">${m}</a>`;
  });
  return `<div>${linked.replace(/\r?\n/g, "<br>")}</div>`;
}

/** One base64-encoded MIME part. */
function mimePart(contentType: string, content: string) {
  return [
    `Content-Type: ${contentType}; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    ...(Buffer.from(content).toString("base64").match(/.{1,76}/g) ?? []),
  ];
}

/** Builds a base64url RFC 2822 message for the Gmail API, with plain-text and linked HTML versions of the body. */
export function rawMessage(to: { name: string; email: string }, subject: string, body: string) {
  const boundary = `crm-${crypto.randomUUID()}`;
  const message = [
    `To: ${encodeHeader(to.name)} <${to.email}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    ...mimePart("text/plain", body),
    `--${boundary}`,
    ...mimePart("text/html", bodyHtml(body)),
    `--${boundary}--`,
  ].join("\r\n");
  return Buffer.from(message).toString("base64url");
}

/** Creates a Gmail draft and returns its id. */
export async function createDraft(token: string, raw: string) {
  return (await gmail<{ id: string }>(token, "/drafts", { method: "POST", body: JSON.stringify({ message: { raw } }) })).id;
}

/** Revokes a refresh token so the CRM loses access. */
export async function revoke(refreshToken: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: "POST" });
}
