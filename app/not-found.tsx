import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="grid min-h-screen place-items-center p-5"><div className="text-center"><p className="text-sm font-semibold text-primary">404</p><h1 className="mt-2 text-4xl font-semibold">That page has moved on.</h1><p className="mt-3 text-sm text-muted-foreground">The resume or page may be private, archived, or no longer available.</p><Link href="/dashboard" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">Back to dashboard</Link></div></main>;
}
