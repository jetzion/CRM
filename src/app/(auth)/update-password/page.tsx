import { updatePassword } from "../actions";
import { AuthForm } from "../auth-form";

export default function UpdatePasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Choose a new password</h1>
      <AuthForm action={updatePassword} fields={["password"]} submitLabel="Update password" newPassword />
    </>
  );
}
