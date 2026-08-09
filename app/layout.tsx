import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Resumly — Build a resume that gets noticed", template: "%s · Resumly" },
  description: "Create polished, ATS-friendly resumes with smart guidance, live preview, and beautiful templates.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
