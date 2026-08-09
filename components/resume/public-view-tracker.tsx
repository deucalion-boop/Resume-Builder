"use client";

import { useEffect } from "react";

export function PublicViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/public/resumes/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      credentials: "same-origin",
      signal: controller.signal,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [slug]);
  return null;
}
