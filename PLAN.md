# SimpleCRM — Build Plan

## Product goal

Build a small, responsive CRM web app that helps a solo user or small team keep track of contacts, companies, and follow-up tasks. Keep the first release focused on everyday relationship management rather than sales forecasting or complex administration.

## MVP scope

### Included
- Sign up, sign in, sign out, and password reset.
- A dashboard with contact count, open follow-ups, and recently updated contacts.
- Contacts: create, view, edit, archive, search, and filter by company or status.
- Contact fields: first and last name, email, phone, company, job title, status, notes, and created/updated timestamps.
- Follow-up tasks associated with a contact, with title, due date, completion state, and optional notes.
- An AI outreach chat that helps users draft personalized outreach emails and plan campaigns using selected CRM contacts and user-provided goals.
- Save chat outputs as editable email drafts, campaign plans, and follow-up tasks.
- Responsive layout for desktop and mobile, accessible forms, loading states, empty states, and useful error messages.
- Per-user data access so users can only see and change their own CRM records.
- Require the user to review and explicitly approve each AI draft; the app does not send email. (Emails the user writes themselves with "Skip AI Assists Review" are saved approved.)

### Out of scope for the first release
- Email sending, calendar synchronization, imports/exports, team roles, pipelines, advanced reporting, and native mobile apps.
- Public marketing site beyond a simple product and sign-in entry point.

## Recommended stack

- **Next.js (App Router) + TypeScript** for the web app and server-side functionality.
- **Tailwind CSS** for responsive styling and a small, consistent component system.
- **Supabase** for Postgres, authentication, and row-level security.
- **Vercel** for hosting and preview deployments.

This stack keeps the app straightforward to build and deploy while providing managed authentication and a durable database. Keep secrets in environment variables; never expose the Supabase service-role key in browser code.

## Core data model

- `profiles`: `id` (matches the authenticated user), `display_name`, `signature`, `created_at`.
- `contacts`: `id`, `owner_id`, `first_name`, `last_name`, `email`, `phone`, `company`, `job_title`, `status`, `notes`, `created_at`, `updated_at`, `archived_at`.
- `tasks`: `id`, `owner_id`, `contact_id`, `title`, `due_at`, `completed_at`, `notes`, `created_at`.
- `campaigns`: `id`, `owner_id`, `name`, `goal`, `audience_notes`, `status`, `created_at`, `updated_at`.
- `campaign_contacts`: `campaign_id`, `contact_id`, `owner_id`, `stage`, `notes`, `created_at` (tracks which contacts are included and their outreach progress).
- `outreach_drafts`: `id`, `owner_id`, `contact_id` (nullable), `campaign_id` (nullable), `step`, `day_offset`, `subject`, `body`, `status` (`draft` or `approved`), `gmail_draft_id` (nullable), `created_at`, `updated_at`.
- `gmail_connections`: `owner_id` (one per user), `email`, `refresh_token`, `created_at`.

Use UUID primary keys, foreign keys, sensible indexes (including owner and due date), and database constraints for required fields. Enable row-level security and policies that restrict reads and writes to rows whose `owner_id` equals the authenticated user. Ensure task, campaign-contact, and draft policies also verify access to related records. Store only the CRM context needed for a generation request, and do not expose model provider keys in browser code.

## Main screens and flows

1. **Authentication** — sign in, create account, and reset password.
2. **Dashboard** — summary cards, overdue/upcoming tasks, and recent contacts.
3. **Contacts** — searchable list with status filters and a clear add-contact action.
4. **Contact detail** — contact information, notes, and associated follow-ups in one view.
5. **Add/edit contact** — validated form with clear save and cancel behavior.
6. **Tasks** — upcoming, overdue, and completed follow-ups; mark tasks complete or create one from a contact.
7. **Outreach chat** — conversational interface to define an outreach goal, choose a target audience from contacts, set tone and constraints, and generate or refine email drafts and a campaign sequence.
8. **Campaign workspace** — review the target contact list, campaign goal, suggested sequence/timing, and associated drafts; edit content and create follow-up tasks.
9. **Settings** — basic profile details, AI provider configuration if needed, and sign out.

### Outreach assistant behavior

- Let the user start from a contact or select a filtered group of contacts. Show which CRM fields will be used before generating content.
- Ask for or confirm the campaign goal, audience, value proposition, tone, desired call to action, and any claims or topics to avoid. Support a one-off email as well as a multi-step plan.
- Generate editable subject/body drafts and a proposed sequence with timing and suggested follow-up tasks. Personalize from available CRM fields and clearly flag missing details instead of inventing facts.
- Keep generated content as a draft. The user must review and save it; sending, automated scheduling, and contact enrollment are not part of the MVP.
- Provide regenerate/refine controls and preserve the user's edits. Handle model errors and rate limits with a clear retry path.
- Use a server-side API route or server action for model calls, validate inputs, enforce the signed-in user's ownership of contacts, and keep provider credentials in Vercel environment variables.

## Implementation sequence

### 1. Set up the app
- Create the Next.js TypeScript app and establish a simple visual foundation (navigation, typography, spacing, buttons, forms, and responsive shell).
- Add environment variable validation and document local setup.

### 2. Configure authentication and storage
- Create the Supabase project and database migrations.
- Implement authentication, protected routes, profile setup, and row-level security policies.
- Confirm unauthenticated users cannot access CRM pages or data.

### 3. Build contact management
- Implement contact list, search/filter, create/edit forms, detail page, and archive behavior.
- Add server-side input validation and clear success/error feedback.

### 4. Build follow-ups and dashboard
- Implement task creation, due dates, completion, and contact association.
- Populate dashboard summaries from the signed-in user's records.

### 5. Build outreach chat and campaigns
- Add campaign and draft database migrations with user-scoped row-level security.
- Build chat context controls for campaign goal, audience selection, tone, and constraints; show the selected contacts and data fields used.
- Add a server-side generation endpoint connected to the chosen model provider, with input validation, safe error handling, and rate limiting.
- Render generated email drafts and campaign steps in editable forms; allow saving drafts and turning proposed follow-ups into CRM tasks.
- Verify generated content never sends automatically and users cannot generate from another user's contact data.

### 6. Polish and verify
- Check responsive layouts, keyboard navigation, labels, validation, empty/loading/error states, and data isolation.
- Add a small set of realistic demo records only if a development seed is useful; do not seed production accounts with shared sample data.

### 7. Deploy to Vercel
- Push the app to a Git provider and import the repository into Vercel.
- Set production and preview environment variables for the Supabase URL and public anon key, plus the server-only model provider key.
- Configure the production domain/URL in Supabase authentication settings and set allowed redirect URLs for production and previews.
- Apply database migrations to the production Supabase project, deploy, and verify sign-in, contact CRUD, tasks, and row-level security on the live site.

### 8. Post-MVP additions (done)
- **Email signature** in Settings. The AI ends every draft with the signature, or the display name if there is none. The sign-off is chosen in code and given to the model verbatim, because free models skipped the conditional rule about 1 time in 8.
- **Gmail drafts.** Connect Gmail in Settings (OAuth, `gmail.compose` scope only; the app cannot read or send mail). "Create Gmail drafts" on a campaign copies its approved drafts that are not in Gmail yet. Failures partway through report how many were created; an expired connection is removed and the user is asked to reconnect. Edits made after a draft is in Gmail are not copied over.
- **Write your own email without AI.** In the Outreach assistant, "Skip AI Assists Review" saves the user's subject and body exactly as written as a campaign for the selected contacts, with drafts already approved. Only placeholders are replaced: `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{job_title}}`, `{{your_name}}`. Unknown placeholders and missing contact values block the save. The campaign name is the subject filled in for the first contact, plus "+ N more".
- **Human-sounding AI drafts.** The prompt asks for plain, short emails and bans common AI phrasing, em dashes, bullet lists, and Title Case subjects.
- **Delete campaigns** (with confirmation). Drafts and contact stages are deleted; tasks and Gmail drafts are kept.
- **Clear chat** in the Outreach assistant resets the conversation and unsaved plans and keeps selected contacts and settings.

### Ideas not yet built
- Remove a Gmail draft when its CRM draft is unapproved or deleted, or sync later edits.
- Placeholders in AI-generated drafts and in the campaign name field.

## Definition of done

- A user can create an account, sign in, and manage contacts and follow-up tasks on desktop and mobile.
- A user can chat through an outreach goal, select CRM contacts, generate and refine personalized email drafts, and save a campaign plan with suggested follow-ups.
- The user can edit drafts before saving, and no email is sent or scheduled without an explicit send workflow (which is outside the MVP).
- Search and status filters work, and the dashboard reflects the user's own data.
- AI generation uses only authorized CRM context, handles missing information without inventing facts, and keeps provider credentials server-side.
- One user's records are inaccessible to another user, including through direct requests.
- Forms validate input and provide useful loading, empty, success, and error states.
- The production app is deployed on Vercel with required environment variables configured and authentication redirects working.
- A README explains local setup, required environment variables, database migrations, and deployment steps.

## Key decisions to confirm during implementation

- Whether the initial release is single-user per account or needs shared team workspaces. The MVP assumes each account has private data.
- Whether contacts need company records as a separate entity. The MVP stores company as text to keep setup simple; normalize it later if company-level views become important.
- Whether the app should be public sign-up or invite-only. The MVP assumes public sign-up unless the product owner chooses otherwise.
- Which model provider to use for outreach generation and whether to support user-provided API keys. Default to a server-configured provider key stored in Vercel, with usage limits and no user key management in the MVP.
