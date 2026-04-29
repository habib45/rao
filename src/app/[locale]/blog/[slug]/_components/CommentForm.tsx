"use client";

import { useState, type FormEvent } from "react";

interface CommentFormProps {
  postId: string;
  labels: {
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    submitLabel: string;
    submittingLabel: string;
    successLabel: string;
    errorLabel: string;
  };
}

export function CommentForm({ postId, labels }: CommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName,
          authorEmail,
          body,
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setAuthorName("");
      setAuthorEmail("");
      setBody("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="comment-name"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.nameLabel}
          </label>
          <input
            id="comment-name"
            type="text"
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label
            htmlFor="comment-email"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.emailLabel}
          </label>
          <input
            id="comment-email"
            type="email"
            required
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="comment-body"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          {labels.messageLabel}
        </label>
        <textarea
          id="comment-body"
          required
          minLength={1}
          maxLength={5000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? labels.submittingLabel : labels.submitLabel}
      </button>
      {status === "success" && (
        <p className="text-sm text-green-600">{labels.successLabel}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{labels.errorLabel}</p>
      )}
    </form>
  );
}
