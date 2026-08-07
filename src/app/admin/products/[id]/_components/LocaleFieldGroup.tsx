"use client";

import { Input } from "@/app/admin/_components/ui/input";

interface LocaleFieldGroupProps {
  locale: string;
  localeLabel: string;
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  onChange: (field: string, value: string) => void;
}

export function LocaleFieldGroup({
  locale,
  localeLabel,
  name,
  slug,
  description,
  metaTitle,
  metaDescription,
  onChange,
}: LocaleFieldGroupProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <h4 className="text-sm font-medium">{localeLabel}</h4>

      <Input
        id={`name-${locale}`}
        label="Name"
        value={name}
        onChange={(e) => onChange("name", e.target.value)}
      />

      <Input
        id={`slug-${locale}`}
        label="Slug"
        value={slug}
        onChange={(e) => onChange("slug", e.target.value)}
      />

      <div className="space-y-1.5">
        <label
          htmlFor={`description-${locale}`}
          className="block text-xs font-medium text-muted"
        >
          Description
        </label>
        <textarea
          id={`description-${locale}`}
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        />
      </div>

      <Input
        id={`meta-title-${locale}`}
        label="Meta Title"
        value={metaTitle}
        onChange={(e) => onChange("meta_title", e.target.value)}
      />

      <Input
        id={`meta-desc-${locale}`}
        label="Meta Description"
        value={metaDescription}
        onChange={(e) => onChange("meta_description", e.target.value)}
      />
    </div>
  );
}
