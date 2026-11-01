import { ButtonLink } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">SimpleCRM</h1>
      <p className="mt-4 text-lg text-zinc-600">
        Keep track of contacts, companies, and follow-ups, and draft personalized outreach
        with an AI assistant. Nothing is ever sent without you.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/signup">Create account</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          Sign in
        </ButtonLink>
      </div>
    </main>
  );
}
