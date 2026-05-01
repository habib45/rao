"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { ClassicEditor } from "ckeditor5";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/admin/_components/ui/tabs";
import type { BlogPost, BlogCategory } from "@/types/domain";
import { WizardBuilder } from "./WizardBuilder";
import { WizardHelp } from "./WizardHelp";
import { decodeWizard } from "@/lib/wizard";
import type { WizardStep } from "@/lib/wizard";

const RichTextEditor = dynamic(
  () => import("@/app/admin/_components/ui/RichTextEditor"),
  { ssr: false },
);

const LOCALES = [
  { code: "en", label: "English" },
  { code: "bn-BD", label: "বাংলা" },
  { code: "sv", label: "Swedish" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

interface FormState {
  blog_category_id: string | null;
  title: Record<LocaleCode, string>;
  slug: Record<LocaleCode, string>;
  excerpt: Record<LocaleCode, string>;
  content: string;
  cover_image_url: string;
  author_name: string;
  author_avatar_url: string;
  meta_title: Record<LocaleCode, string>;
  meta_description: Record<LocaleCode, string>;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  read_time_minutes: number;
  published_at: string;
  tag_names: string;
}

function readTranslation(
  source: Partial<Record<string, string | undefined>> | undefined,
): Record<LocaleCode, string> {
  return {
    en: source?.en ?? "",
    "bn-BD": source?.["bn-BD"] ?? "",
    sv: source?.sv ?? "",
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // To local datetime-local format (YYYY-MM-DDTHH:MM).
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

interface BlogPostFormProps {
  post: BlogPost | null;
  categories: BlogCategory[];
}

export function BlogPostForm({ post, categories }: BlogPostFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialTags =
    post?.blog_post_tags
      ?.map((row) => row.blog_tags?.name?.en)
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .join(", ") ?? "";

  const [form, setForm] = useState<FormState>({
    blog_category_id: post?.blog_category_id ?? null,
    title: readTranslation(post?.title),
    slug: readTranslation(post?.slug),
    excerpt: readTranslation(post?.excerpt),
    content: post?.content ?? "",
    cover_image_url: post?.cover_image_url ?? "",
    author_name: post?.author_name ?? "BestFinds",
    author_avatar_url: post?.author_avatar_url ?? "",
    meta_title: readTranslation(post?.meta_title),
    meta_description: readTranslation(post?.meta_description),
    status: post?.status ?? "draft",
    is_featured: post?.is_featured ?? false,
    read_time_minutes: post?.read_time_minutes ?? 0,
    published_at: toDatetimeLocal(post?.published_at),
    tag_names: initialTags,
  });

  const isEditing = post !== null;
  const editorRef = useRef<ClassicEditor | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingWizard, setEditingWizard] = useState<{
    encoded: string;
    steps: WizardStep[];
    borderColor: string;
    borderSize: number;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        blog_category_id: form.blog_category_id,
        title: form.title,
        slug: {
          en: form.slug.en || slugify(form.title.en),
          "bn-BD": form.slug["bn-BD"],
          sv: form.slug.sv,
        },
        excerpt: form.excerpt,
        content: form.content,
        cover_image_url: form.cover_image_url || null,
        author_name: form.author_name,
        author_avatar_url: form.author_avatar_url || null,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        status: form.status,
        is_featured: form.is_featured,
        read_time_minutes: form.read_time_minutes,
        published_at: fromDatetimeLocal(form.published_at),
        tag_names: form.tag_names
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await fetch(
        isEditing ? `/admin/api/blog/${post!.id}` : "/admin/api/blog",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save post");
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(isEditing ? "Post updated" : "Post created");
      if (!isEditing) {
        router.push(`/admin/blog/${data.id}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function setTrans(
    field: "title" | "slug" | "excerpt" | "meta_title" | "meta_description",
    locale: LocaleCode,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [locale]: value },
    }));
  }

  // Auto-fill English slug from English title only when slug.en is empty.
  function onTitleEnChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: { ...prev.title, en: value },
      slug: prev.slug.en
        ? prev.slug
        : { ...prev.slug, en: slugify(value) },
    }));
  }

  function extractWizardBlocks(
    content: string,
  ): Array<{ encoded: string; label: string }> {
    const re = /data-wizard="([^"]+)"/g;
    const results: Array<{ encoded: string; label: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      try {
        const data = decodeWizard(m[1]);
        results.push({
          encoded: m[1],
          label: data.steps.map((s) => s.title).filter(Boolean).join(" | "),
        });
      } catch {
        // skip malformed blocks
      }
    }
    return results;
  }

  function replaceWizardBlock(
    content: string,
    oldEncoded: string,
    newHtml: string,
  ): string {
    // Locate by data-wizard value only — CKEditor may reorder attributes
    const marker = `data-wizard="${oldEncoded}"`;
    const markerIdx = content.indexOf(marker);
    if (markerIdx === -1) return newHtml ? content + newHtml : content;
    const divStart = content.lastIndexOf("<div", markerIdx);
    if (divStart === -1) return newHtml ? content + newHtml : content;
    const endIdx = content.indexOf("</div>", markerIdx);
    if (endIdx === -1) return newHtml ? content + newHtml : content;
    return content.slice(0, divStart) + newHtml + content.slice(endIdx + "</div>".length);
  }

  function parseWizardBorderStyle(content: string, encoded: string): { borderColor: string; borderSize: number } {
    const markerIdx = content.indexOf(`data-wizard="${encoded}"`);
    if (markerIdx === -1) return { borderColor: "#94a3b8", borderSize: 2 };
    const divStart = content.lastIndexOf("<div", markerIdx);
    if (divStart === -1) return { borderColor: "#94a3b8", borderSize: 2 };
    const tagEnd = content.indexOf(">", divStart);
    const tag = content.slice(divStart, tagEnd);
    const styleMatch = tag.match(/style="([^"]*)"/);
    if (!styleMatch) return { borderColor: "#94a3b8", borderSize: 2 };
    const borderMatch = styleMatch[1].match(/border:(\d+)px\s+dashed\s+(#[0-9a-fA-F]{3,8})/);
    return {
      borderSize: borderMatch ? parseInt(borderMatch[1]) : 2,
      borderColor: borderMatch ? borderMatch[2] : "#94a3b8",
    };
  }

  function deleteWizardBlock(encoded: string) {
    const newContent = replaceWizardBlock(form.content, encoded, "");
    const editor = editorRef.current;
    if (editor) editor.setData(newContent);
    setForm((prev) => ({ ...prev, content: newContent }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-6"
    >
      {/* Translated fields */}
      <Tabs defaultValue="en" className="space-y-4">
        <TabsList>
          {LOCALES.map((l) => (
            <TabsTrigger key={l.code} value={l.code}>
              {l.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LOCALES.map((l) => (
          <TabsContent key={l.code} value={l.code} className="space-y-4">
            <Input
              label={`Title (${l.label})`}
              value={form.title[l.code]}
              onChange={(e) =>
                l.code === "en"
                  ? onTitleEnChange(e.target.value)
                  : setTrans("title", l.code, e.target.value)
              }
              required={l.code === "en"}
            />
            <Input
              label={`Slug (${l.label})`}
              value={form.slug[l.code]}
              onChange={(e) => setTrans("slug", l.code, e.target.value)}
              required={l.code === "en"}
              placeholder="auto-generated-from-title"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Excerpt ({l.label})
              </label>
              <textarea
                value={form.excerpt[l.code]}
                onChange={(e) => setTrans("excerpt", l.code, e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <Input
              label={`Meta title (${l.label})`}
              value={form.meta_title[l.code]}
              onChange={(e) => setTrans("meta_title", l.code, e.target.value)}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Meta description ({l.label})
              </label>
              <textarea
                value={form.meta_description[l.code]}
                onChange={(e) =>
                  setTrans("meta_description", l.code, e.target.value)
                }
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Content editor */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Content</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowWizard((v) => !v)}
              className="rounded-lg border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors"
            >
              Add Wizard
            </button>
            <WizardHelp />
          </div>
        </div>
        <RichTextEditor
          value={form.content}
          onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
          onReady={(editor) => { editorRef.current = editor; }}
          placeholder="Write the body of your blog post..."
        />
        {/* Existing wizard blocks — edit buttons */}
        {extractWizardBlocks(form.content).map(({ encoded, label }, i) => (
          <div
            key={encoded}
            className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs"
          >
            <span className="flex-1 truncate text-muted">
              Wizard {i + 1}{label ? `: ${label}` : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                try {
                  const data = decodeWizard(encoded);
                  const { borderColor, borderSize } = parseWizardBorderStyle(form.content, encoded);
                  setEditingWizard({ encoded, steps: data.steps, borderColor, borderSize });
                } catch {
                  // ignore malformed
                }
              }}
              className="font-medium text-brand hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteWizardBlock(encoded)}
              className="font-medium text-red-500 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}

        {/* New wizard modal */}
        {showWizard && (
          <WizardBuilder
            onInsert={(html) => {
              const editor = editorRef.current;
              if (editor) {
                const current = editor.getData();
                editor.setData(current + html);
                setForm((prev) => ({ ...prev, content: current + html }));
              } else {
                setForm((prev) => ({ ...prev, content: prev.content + html }));
              }
              setShowWizard(false);
            }}
            onClose={() => setShowWizard(false)}
          />
        )}

        {/* Edit existing wizard modal */}
        {editingWizard && (
          <WizardBuilder
            initialSteps={editingWizard.steps}
            initialBorderColor={editingWizard.borderColor}
            initialBorderSize={editingWizard.borderSize}
            isEditing
            onInsert={(newHtml) => {
              const newContent = replaceWizardBlock(
                form.content,
                editingWizard.encoded,
                newHtml,
              );
              const editor = editorRef.current;
              if (editor) editor.setData(newContent);
              setForm((prev) => ({ ...prev, content: newContent }));
              setEditingWizard(null);
            }}
            onClose={() => setEditingWizard(null)}
          />
        )}
      </div>

      {/* Side fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Category"
          value={form.blog_category_id ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              blog_category_id: e.target.value || null,
            }))
          }
        >
          <option value="">— None —</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name?.en ?? "Untitled"}
            </option>
          ))}
        </Select>

        <Select
          label="Status"
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              status: e.target.value as FormState["status"],
            }))
          }
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>

        <Input
          label="Cover image URL"
          type="url"
          value={form.cover_image_url}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, cover_image_url: e.target.value }))
          }
        />

        <Input
          label="Author name"
          value={form.author_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, author_name: e.target.value }))
          }
        />

        <Input
          label="Author avatar URL"
          type="url"
          value={form.author_avatar_url}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              author_avatar_url: e.target.value,
            }))
          }
        />

        <Input
          label="Read time (minutes)"
          type="number"
          min={0}
          value={form.read_time_minutes}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              read_time_minutes: Number(e.target.value) || 0,
            }))
          }
        />

        <Input
          label="Tags (comma-separated)"
          value={form.tag_names}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, tag_names: e.target.value }))
          }
          placeholder="reviews, gadgets, top-picks"
        />

        <Input
          label="Publish at (schedule)"
          type="datetime-local"
          value={form.published_at}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, published_at: e.target.value }))
          }
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={form.is_featured}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
          }
          className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
        />
        Featured post
      </label>

      <div className="flex justify-end gap-2 border-t border-border pt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/blog")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving..."
            : isEditing
              ? "Update post"
              : "Create post"}
        </Button>
      </div>
    </form>
  );
}
