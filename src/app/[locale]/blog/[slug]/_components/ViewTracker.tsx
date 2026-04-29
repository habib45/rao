"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  postId: string;
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    fetch("/api/blog/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {
      // Fire-and-forget; ignore network errors.
    });
  }, [postId]);

  return null;
}
