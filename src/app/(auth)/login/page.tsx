import Link from "next/link";
import { Suspense } from "react";
import { LinkError } from "../link-error";
import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <Suspense>
        <LinkError />
      </Suspense>
      <AuthForm action={signIn} fields={["email", "password"]} submitLabel="Sign in" />
      <div className="mt-6 space-y-2 text-sm text-zinc-600">
        <p>
          <Link href="/reset-password" className="text-accent hover:underline">
            Forgot your password?
          </Link>
        </p>
        <p>
          No account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}
