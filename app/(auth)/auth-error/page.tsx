import Link from "next/link";

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const detail = message === "expired" ? "This authentication link has expired. Request a new one and try again."
    : message === "expired-or-used" ? "This one-time link has expired or was already opened. Request a fresh email, use only the newest message, and open it in the same browser where you requested it."
    : message === "session" ? "The link was verified, but a secure recovery session could not be created. Request a new password-reset email."
    : message === "maintenance" ? "The application is undergoing scheduled maintenance. Administrator access remains available."
    : message === "account-restricted" ? "This account is suspended, deleted, or its sessions were revoked. Contact support if you believe this is an error."
    : "The authentication link is invalid or has already been used.";
  return <><h1 className="text-3xl font-semibold tracking-tight">We couldn’t complete that request</h1><p className="mb-8 mt-2 text-sm leading-6 text-muted-foreground">{detail}</p><Link href="/login" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary font-semibold text-white">Return to sign in</Link></>;
}
