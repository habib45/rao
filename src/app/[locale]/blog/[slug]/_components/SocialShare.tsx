"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface SocialShareProps {
  url: string;
  title: string;
  shareLabel: string;
  copyLabel: string;
  copiedLabel: string;
}

export function SocialShare({
  url,
  title,
  shareLabel,
  copyLabel,
  copiedLabel,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently no-op.
    }
  }

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(url)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url,
  )}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-foreground">
        {shareLabel}:
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            {copiedLabel}
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            {copyLabel}
          </>
        )}
      </button>
      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        aria-label="Share on Twitter"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X / Twitter
      </a>
      <a
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        aria-label="Share on Facebook"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook
      </a>
    </div>
  );
}
