import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { AuthForm } from "../auth-form";

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-sm text-zinc-600">We will email you a link to choose a new one.</p>
      <AuthForm action={requestPasswordReset} fields={["email"]} submitLabel="Send reset link" />
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
