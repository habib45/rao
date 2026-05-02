"use client";

import { useState, useRef } from "react";

interface Props {
  keys: string[];
  onChange: (keys: string[]) => void;
}

export function ComparisonKeysEditor({ keys, onChange }: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addKey() {
    const trimmed = input.trim();
    if (!trimmed || keys.includes(trimmed) || keys.length >= 20) return;
    onChange([...keys, trimmed]);
    setInput("");
    inputRef.current?.focus();
  }

  function removeKey(k: string) {
    onChange(keys.filter((x) => x !== k));
  }

  function moveKey(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= keys.length) return;
    const next = [...keys];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Existing keys */}
      {keys.length > 0 ? (
        <ul className="space-y-1">
          {keys.map((k, i) => (
            <li
              key={k}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5"
            >
              <span className="flex-1 text-sm font-medium text-foreground">{k}</span>
              <button
                type="button"
                onClick={() => moveKey(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${k} up`}
                className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveKey(i, 1)}
                disabled={i === keys.length - 1}
                aria-label={`Move ${k} down`}
                className="rounded p-0.5 text-muted hover:text-foreground disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeKey(k)}
                aria-label={`Remove ${k}`}
                className="rounded p-0.5 text-muted hover:text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No comparison keys defined yet.</p>
      )}

      {/* Add new key */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addKey();
            }
          }}
          placeholder="e.g. Battery Life"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          maxLength={60}
        />
        <button
          type="button"
          onClick={addKey}
          disabled={!input.trim() || keys.length >= 20}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
        >
          + Add
        </button>
      </div>
      <p className="text-xs text-muted">{keys.length}/20 keys · press Enter or click Add</p>
    </div>
  );
}
