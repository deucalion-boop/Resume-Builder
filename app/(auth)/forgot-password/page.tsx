import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/password-form";

export default function ForgotPasswordPage() {
  return <><h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1><p className="mb-8 mt-2 text-sm text-muted-foreground">We’ll send a secure recovery link to your inbox.</p><ForgotPasswordForm /><Link href="/login" className="mt-6 block text-center text-sm font-semibold text-primary">Back to sign in</Link></>;
}
