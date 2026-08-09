import { PasswordUpdateForm } from "@/components/auth/password-form";

export default function ResetPasswordPage() {
  return <><h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1><p className="mb-8 mt-2 text-sm text-muted-foreground">Use at least 12 characters with upper and lowercase letters and a number.</p><PasswordUpdateForm /></>;
}
