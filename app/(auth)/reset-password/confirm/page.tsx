import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

type SearchParams = Promise<{
  token_hash?: string | string[];
  type?: string | string[];
}>;

export default async function ConfirmPasswordResetPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const isRecovery = params.type === "recovery";

  if (!tokenHash || !isRecovery) {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">Invalid reset link</h1>
        <p className="mb-8 mt-2 text-sm leading-6 text-muted-foreground">
          This password-reset link is incomplete. Request a new email and use the newest message.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary font-semibold text-white transition hover:brightness-105"
        >
          Request a new link
        </Link>
      </>
    );
  }

  const callbackParams = new URLSearchParams({
    token_hash: tokenHash,
    type: "recovery",
    next: "/reset-password",
  });

  return (
    <>
      <span className="mb-5 grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">Continue securely</h1>
      <p className="mb-8 mt-2 text-sm leading-6 text-muted-foreground">
        Confirm that you want to reset your password. This extra step protects your one-time link from email security scanners.
      </p>
      <a
        href={`/auth/callback?${callbackParams.toString()}`}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        Continue password reset
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
        The link is single-use. If you did not request this change, you can safely close this page.
      </p>
    </>
  );
}
