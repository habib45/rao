"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Badge } from "@/app/admin/_components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/_components/ui/tabs";
import { LocaleFieldGroup } from "./LocaleFieldGroup";
import { ForceSyncButton } from "./ForceSyncButton";
import { PublishScheduler } from "./PublishScheduler";
import { WorkflowActions } from "./WorkflowActions";
import type { Product, ProductStatus } from "@/types/domain";

const RichTextEditor = dynamic(
  () => import("@/app/admin/_components/ui/RichTextEditor"),
  { ssr: false }
);

interface Category {
  id: string;
  name: Record<string, string>;
}

const LOCALES = [
  { code: "en", label: "English" },
  { code: "bn-BD", label: "Bangla (bn-BD)" },
  { code: "sv", label: "Swedish (sv)" },
] as const;

export function ProductEditForm({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: { en: product.name?.en ?? "", "bn-BD": product.name?.["bn-BD"] ?? "", sv: product.name?.sv ?? "" },
    slug: { en: product.slug?.en ?? "", "bn-BD": product.slug?.["bn-BD"] ?? "", sv: product.slug?.sv ?? "" },
    description: { en: product.description?.en ?? "", "bn-BD": product.description?.["bn-BD"] ?? "", sv: product.description?.sv ?? "" },
    meta_title: { en: product.meta_title?.en ?? "", "bn-BD": product.meta_title?.["bn-BD"] ?? "", sv: product.meta_title?.sv ?? "" },
    meta_description: { en: product.meta_description?.en ?? "", "bn-BD": product.meta_description?.["bn-BD"] ?? "", sv: product.meta_description?.sv ?? "" },
    features: product.features ?? [],
    price_cents: product.price_cents,
    original_price_cents: product.original_price_cents,
    currency: product.currency ?? "USD",
    discount_pct: product.discount_pct ?? 0,
    category_id: product.category_id,
    brand: product.brand ?? "",
    availability: product.availability,
    is_featured: product.is_featured,
    is_active: product.is_active,
    images: (product.product_images ?? []).map((img) => ({
      url: img.url,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    })),
  });

  const [addImageUrl, setAddImageUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`/admin/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product saved");
    },
    onError: () => toast.error("Failed to save product"),
  });

  function updateLocaleField(locale: string, field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...(prev[field as keyof typeof prev] as Record<string, string>), [locale]: value },
    }));
  }

  function updateFeature(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  }

  function addFeature() {
    setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  }

  function removeFeature(index: number) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{product.name?.en ?? "Edit Product"}</h1>
          <p className="text-sm text-muted">ASIN: {product.asin}</p>
        </div>
        <div className="flex items-center gap-3">
          <ForceSyncButton productId={product.id} />
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="locales">Locales</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="brand"
              label="Brand"
              value={form.brand}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
            />
            <Select
              id="category"
              label="Category"
              value={form.category_id ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value || null }))}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name?.en ?? c.id}
                </option>
              ))}
            </Select>
            <Select
              id="availability"
              label="Availability"
              value={form.availability}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  availability: e.target.value as "in_stock" | "out_of_stock" | "unknown",
                }))
              }
            >
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="rounded border-border"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                className="rounded border-border"
              />
              Featured
            </label>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-medium text-muted">Amazon Data</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Last synced: {new Date(product.updated_at).toLocaleString("en")}</span>
              <Badge variant={product.is_active ? "success" : "error"}>
                {product.availability.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <WorkflowActions
            productId={product.id}
            status={(product.product_status ?? "draft") as ProductStatus}
            rejectionReason={product.rejection_reason ?? null}
          />

          {product.product_status === "approved" && (
            <PublishScheduler
              productId={product.id}
              currentPublishAt={product.publish_at ?? null}
            />
          )}
        </TabsContent>

        <TabsContent value="locales" className="mt-4 space-y-4">
          {LOCALES.map(({ code, label }) => (
            <LocaleFieldGroup
              key={code}
              locale={code}
              localeLabel={label}
              name={(form.name as Record<string, string>)[code] ?? ""}
              slug={(form.slug as Record<string, string>)[code] ?? ""}
              description={(form.description as Record<string, string>)[code] ?? ""}
              metaTitle={(form.meta_title as Record<string, string>)[code] ?? ""}
              metaDescription={(form.meta_description as Record<string, string>)[code] ?? ""}
              onChange={(field, value) => updateLocaleField(code, field, value)}
            />
          ))}
        </TabsContent>

        <TabsContent value="description" className="mt-4 space-y-4">
          <DescriptionEditor
            description={form.description as Record<string, string>}
            onChange={(locale, html) => updateLocaleField(locale, "description", html)}
          />
        </TabsContent>

        <TabsContent value="features" className="mt-4 space-y-3">
          {form.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={feature}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i + 1}`}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeFeature(i)}>
                Remove
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addFeature}>
            Add Feature
          </Button>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="price"
              label="Price (cents)"
              type="number"
              value={form.price_cents ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  price_cents: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
            />
            <Input
              id="original_price"
              label="Original Price (cents)"
              type="number"
              value={form.original_price_cents ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  original_price_cents: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
            />
            <Input
              id="discount_pct"
              label="Discount %"
              type="number"
              min={0}
              max={100}
              value={form.discount_pct}
              onChange={(e) =>
                setForm((p) => ({ ...p, discount_pct: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
          <Select
            id="currency"
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
          >
            <option value="USD">USD</option>
            <option value="BDT">BDT</option>
            <option value="SEK">SEK</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          {form.images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {form.images
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((img, index) => (
                  <div
                    key={`${img.url}-${index}`}
                    className="relative rounded-lg border border-border p-2"
                  >
                    <Image
                      src={img.url}
                      alt="Product image"
                      width={200}
                      height={200}
                      className="aspect-square w-full rounded-lg object-cover"
                      unoptimized
                    />
                    {img.is_primary && (
                      <Badge variant="info" className="absolute right-3 top-3">
                        Primary
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          images: p.images.filter((_, idx) => idx !== index),
                        }))
                      }
                      className="absolute right-3 bottom-3 rounded bg-black/70 px-2 py-1 text-xs text-white hover:bg-black"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              No images yet. Add a URL below to attach images to this product.
            </p>
          )}

          <div className="flex gap-2">
            <Input
              id="add-image-url"
              value={addImageUrl}
              onChange={(e) => setAddImageUrl(e.target.value)}
              placeholder="https://m.media-amazon.com/images/..."
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const url = addImageUrl.trim();
                if (!url) return;
                setForm((p) => ({
                  ...p,
                  images: [
                    ...p.images,
                    {
                      url,
                      width: undefined,
                      height: undefined,
                      is_primary: p.images.length === 0,
                      sort_order: p.images.length,
                    },
                  ],
                }));
                setAddImageUrl("");
              }}
            >
              Add URL
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DescriptionEditor({
  description,
  onChange,
}: {
  description: Record<string, string>;
  onChange: (locale: string, html: string) => void;
}) {
  const [activeLocale, setActiveLocale] = useState<string>("en");
  return (
    <div className="space-y-3">
      <div
        role="tablist"
        className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {LOCALES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={activeLocale === code}
            onClick={() => setActiveLocale(code)}
            className={
              activeLocale === code
                ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>
      {LOCALES.map(({ code, label }) =>
        activeLocale === code ? (
          <div key={code} className="space-y-1">
            <label className="block text-sm font-medium">
              Description ({label})
            </label>
            <RichTextEditor
              value={description[code] ?? ""}
              onChange={(html) => onChange(code, html)}
              placeholder={`Description (${label})`}
            />
          </div>
        ) : null
      )}
    </div>
  );
}
