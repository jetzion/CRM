import Link from "next/link";
import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <AuthForm
        action={signUp}
        fields={["display_name", "email", "password"]}
        submitLabel="Create account"
        newPassword
      />
      <p className="mt-6 text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
