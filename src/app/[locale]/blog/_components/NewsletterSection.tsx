"use client";

import { useState, useRef, type FormEvent } from "react";

interface Props {
  title: string;
  subtitle: string;
  background: "indigo" | "gray" | "dark";
  locale: string;
}

const bgClasses: Record<Props["background"], string> = {
  indigo: "bg-indigo-600",
  gray: "bg-gray-100",
  dark: "bg-gray-900",
};

const textClasses: Record<Props["background"], { heading: string; body: string }> =
  {
    indigo: { heading: "text-white", body: "text-indigo-100" },
    gray: { heading: "text-gray-900", body: "text-gray-600" },
    dark: { heading: "text-white", body: "text-gray-300" },
  };

export function NewsletterSection({ title, subtitle, background, locale }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const colors = textClasses[background];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = emailRef.current?.value.trim() ?? "";
    const consent = consentRef.current?.checked ?? false;

    if (!email) {
      setErrorMsg("Please enter your email address.");
      setStatus("error");
      return;
    }
    if (!consent) {
      setErrorMsg("You must agree to the terms before subscribing.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, consent }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section
      className={`${bgClasses[background]} relative overflow-hidden rounded-2xl px-6 py-12 sm:px-12`}
    >
      {/* Decorative dots */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-6 grid grid-cols-5 gap-1.5 opacity-30"
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
          />
        ))}
      </span>

      <div className="relative max-w-xl">
        <h2 className={`text-2xl font-extrabold sm:text-3xl ${colors.heading}`}>
          {title}
        </h2>
        <p className={`mt-3 text-sm leading-relaxed sm:text-base ${colors.body}`}>
          {subtitle}
        </p>

        {status === "success" ? (
          <div className="mt-6 rounded-xl bg-white/20 px-6 py-4 text-center">
            <p className={`text-base font-semibold ${colors.heading}`}>
              You&apos;re subscribed! 🎉
            </p>
            <p className={`mt-1 text-sm ${colors.body}`}>
              Thank you — we&apos;ll keep you in the loop.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
            <div className="flex gap-3">
              <input
                ref={emailRef}
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="flex-1 rounded-lg border border-white/30 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {status === "loading" ? "…" : "Subscribe"}
              </button>
            </div>

            {status === "error" && errorMsg && (
              <p className="text-sm font-medium text-red-200">{errorMsg}</p>
            )}

            <label className="flex items-start gap-2.5 text-xs">
              <input
                ref={consentRef}
                type="checkbox"
                className="mt-0.5 shrink-0 accent-white"
              />
              <span className={colors.body}>
                I agree to my email being stored and used to receive the
                newsletter.
              </span>
            </label>
          </form>
        )}
      </div>
    </section>
  );
}
