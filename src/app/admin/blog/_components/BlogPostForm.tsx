"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ClassicEditor } from "ckeditor5";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Sparkles } from "lucide-react";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import type { BlogPost, BlogCategory } from "@/types/domain";
import { decodeWizard } from "@/lib/wizard";
import type { WizardStep } from "@/lib/wizard";
import { parseAIJSON } from "@/lib/json-parser";

// Dynamic imports only for components with browser dependencies
const RichTextEditor = dynamic(
  () => import("@/app/admin/_components/ui/RichTextEditor"),
  { ssr: false },
);

const GrammarlyEditor = dynamic(
  () => import("./GrammarlyEditor").then(mod => ({ default: mod.GrammarlyEditor })),
  { ssr: false }
);

// Regular imports for components that don't have browser dependencies
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/_components/ui/tabs";
import { WizardBuilder } from "./WizardBuilder";
import { WizardHelp } from "./WizardHelp";
import { AIContentAssistant } from "./AIContentAssistant";
import { AIContentOptimizer } from "./AIContentOptimizer";
import { ImprovedSEOOptimizer } from "./ImprovedSEOOptimizer";
import { URLContentExtractor } from "./URLContentExtractor";

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
  note: string;
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
    // Replace spaces and special characters with hyphens, but keep Unicode letters and numbers
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, "-");
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
  // Return MySQL-compatible datetime format (YYYY-MM-DD HH:MM:SS)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface BlogPostFormProps {
  post: BlogPost | null;
  categories: BlogCategory[];
}

export function BlogPostForm({ post, categories }: BlogPostFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [extractedContent, setExtractedContent] = useState<{
    title: string;
    description: string;
    content: string;
    url: string;
    keywords: string[];
    headings: string[];
  } | null>(null);

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
    author_name: post?.author_name ?? "RaoFinds",
    author_avatar_url: post?.author_avatar_url ?? "/uploads/Profile/profile-male.png",
    meta_title: readTranslation(post?.meta_title),
    meta_description: readTranslation(post?.meta_description),
    status: post?.status ?? "draft",
    is_featured: post?.is_featured ?? false,
    read_time_minutes: post?.read_time_minutes ?? 0,
    published_at: toDatetimeLocal(post?.published_at),
    tag_names: initialTags,
    note: post?.note ?? "",
  });

  // Set domain-based default avatar URL after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && !post?.author_avatar_url) {
      const domainBasedAvatar = `${window.location.origin}/uploads/Profile/profile-male.png`;
      setForm(prev => ({ 
        ...prev, 
        author_avatar_url: domainBasedAvatar 
      }));
    }
  }, [post?.author_avatar_url]);

  const isEditing = post !== null;
  const editorRef = useRef<ClassicEditor | null>(null);

  // Ensure content is properly set when editor is ready (for edit mode)
  useEffect(() => {
    if (editorRef.current && isEditing && post?.content) {
      // Only set if the editor is empty to avoid overwriting user changes
      const currentData = editorRef.current.getData();
      if (!currentData || currentData.trim() === '') {
        editorRef.current.setData(post.content);
      }
    }
  }, [isEditing, post?.content]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingWizard, setEditingWizard] = useState<{
    encoded: string;
    steps: WizardStep[];
    borderColor: string;
    borderSize: number;
    showFooter: boolean;
    shadow: string;
    showBorder: boolean;
    showPanelBorder: boolean;
    panelBorderColor: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!form.title.en || form.title.en.trim() === '') {
        throw new Error("English title is required");
      }
      if (!form.slug.en || form.slug.en.trim() === '') {
        throw new Error("English slug is required");
      }
      if (!form.content || form.content.trim() === '') {
        throw new Error("Content is required");
      }

      // Clean up locale fields - remove empty strings, keep only filled values
      const cleanLocaleField = (field: Record<LocaleCode, string>) => {
        const cleaned: Record<string, string> = {};
        Object.entries(field).forEach(([locale, value]) => {
          if (value && value.trim()) {
            cleaned[locale] = value.trim();
          }
        });
        return cleaned;
      };

      // Validate datetime format
      let publishedAt = null;
      if (form.published_at) {
        publishedAt = fromDatetimeLocal(form.published_at);
        if (!publishedAt) {
          throw new Error("Invalid publish date format");
        }
      }

      const payload = {
        blog_category_id: form.blog_category_id,
        title: cleanLocaleField(form.title),
        slug: {
          en: form.slug.en || slugify(form.title.en),
          ...(form.slug["bn-BD"] && { "bn-BD": form.slug["bn-BD"] }),
          ...(form.slug.sv && { sv: form.slug.sv }),
        },
        excerpt: cleanLocaleField(form.excerpt),
        content: form.content || "",
        cover_image_url: form.cover_image_url || null,
        author_name: form.author_name || "RaoFinds",
        author_avatar_url: form.author_avatar_url || null,
        meta_title: cleanLocaleField(form.meta_title),
        meta_description: cleanLocaleField(form.meta_description),
        status: form.status,
        is_featured: Boolean(form.is_featured),
        read_time_minutes: form.read_time_minutes || 0,
        published_at: publishedAt,
        tag_names: form.tag_names
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        note: form.note || null,
      };

      // Log payload for debugging
      console.log("Submitting blog post:", {
        isEditing,
        title: payload.title,
        slug: payload.slug,
        contentLength: payload.content.length
      });

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
        // Provide more specific error messages
        if (err.error && err.error.includes('datetime')) {
          throw new Error("Invalid date format. Please check the publish date.");
        } else if (err.error && err.error.includes('Duplicate')) {
          throw new Error("A post with this slug already exists. Please use a different slug.");
        } else {
          throw new Error(err.error ?? "Failed to save post");
        }
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      
      // Show detailed success message
      const successMessage = isEditing 
        ? `Post updated successfully! Title: "${form.title.en}", Slug: "${form.slug.en}"`
        : `Post created successfully! Title: "${form.title.en}"`;
      
      toast.success(successMessage);
      console.log("Blog post saved successfully:", data);
      
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

  // Handle title change without auto-generating slug
  function onTitleChange(locale: LocaleCode, value: string) {
    setForm((prev) => ({
      ...prev,
      title: { ...prev.title, [locale]: value },
    }));
  }

  // Auto-generate slug on title blur (when user clicks out)
  function onTitleBlur(locale: LocaleCode, value: string) {
    // Only generate slug if it's empty, auto-generated, or if title was changed significantly
    const currentSlug = form.slug[locale];
    const isEmpty = !currentSlug || currentSlug.trim() === '';
    const currentTitle = form.title[locale];
    const isAutoGenerated = currentSlug === slugify(currentTitle);
    const isNewSlug = slugify(value) !== currentSlug;
    
    if (isEmpty || isAutoGenerated || isNewSlug) {
      setForm((prev) => ({
        ...prev,
        slug: { ...prev.slug, [locale]: slugify(value) },
      }));
    }
  }

  // Handle manual slug editing
  function onSlugChange(locale: LocaleCode, value: string) {
    setForm((prev) => ({
      ...prev,
      slug: { ...prev.slug, [locale]: value },
    }));
  }

  // Format content function to create proper human-like formatting
  function formatContent() {
    const editor = editorRef.current;
    if (!editor || !form.content.trim()) return;

    // Get current content from CKEditor
    let content = editor.getData();
    
    // Extract and preserve images
    const images: string[] = [];
    const imagePlaceholders: string[] = [];
    let imageIndex = 0;
    
    // Replace images with placeholders and store them
    content = content.replace(/<img[^>]*>/gi, (match: string) => {
      const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`;
      images.push(match);
      imagePlaceholders.push(placeholder);
      imageIndex++;
      return placeholder;
    });
    
    // Convert to plain text for better processing (excluding image placeholders)
    const plainText = content
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags, replace with spaces
      .replace(/__IMAGE_PLACEHOLDER_\d+__/g, ' ') // Replace image placeholders with spaces
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, ' ') // Clean up multiple spaces
      .trim();

    // Split content into sentences and process
    const sentences = plainText.split(/([.!?]+)\s*/);
    let formattedContent = '';
    let currentParagraph = '';
    let inList = false;
    let listItems = [];
    let _inSpecs = false;
    let _inPros = false;
    let _inCons = false;

    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i].trim();
      
      if (!sentence) continue;
      
      // Handle section headers and special content
      if (sentence.match(/^(Quick Picks|Best Overall|Best Bang for Your Buck|Best Lightweight|Best for Heavy Duty|SPECIFICATIONS|PROS|CONS|List Price|Weight|Material|Outsole|Upper Material|Midsole|Features|Dimensions|Size|Color|Credit:|By |Related:|READ MORE|Show|Deal Alert|Check price)/i)) {
        
        // End current content
        if (currentParagraph.trim()) {
          formattedContent += `<p>${currentParagraph.trim()}</p>\n\n`;
          currentParagraph = '';
        }
        
        // End list if active
        if (inList && listItems.length > 0) {
          formattedContent += '<ul>' + listItems.join('') + '</ul>\n\n';
          listItems = [];
          inList = false;
        }
        
        // Handle special sections
        if (sentence.match(/^(Quick Picks|Best Overall|Best Bang for Your Buck|Best Lightweight|Best for Heavy Duty)/i)) {
          formattedContent += `<h2>${sentence}</h2>\n\n`;
          inList = true;
        } else if (sentence.match(/^SPECIFICATIONS/i)) {
          formattedContent += `<h3>${sentence}</h3>\n\n`;
          _inSpecs = true;
          inList = false;
        } else if (sentence.match(/^PROS/i)) {
          formattedContent += `<h3>${sentence}</h3>\n\n`;
          _inPros = true;
          inList = true;
        } else if (sentence.match(/^CONS/i)) {
          formattedContent += `<h3>${sentence}</h3>\n\n`;
          _inCons = true;
          inList = true;
        } else if (sentence.match(/^(List Price|Weight|Material|Outsole|Upper Material|Midsole|Features|Dimensions|Size|Color)/i)) {
          formattedContent += `<h4>${sentence}</h4>\n\n`;
        } else if (sentence.match(/^Credit:/i)) {
          formattedContent += `<p><em>${sentence}</em></p>\n\n`;
        } else if (sentence.match(/^By /i)) {
          formattedContent += `<p><strong>${sentence}</strong></p>\n\n`;
        } else if (sentence.match(/^(Related:|READ MORE|Show|Deal Alert|Check price)/i)) {
          formattedContent += `<p><strong>${sentence}</strong></p>\n\n`;
        } else {
          formattedContent += `<h3>${sentence}</h3>\n\n`;
        }
        continue;
      }
      
      // Handle bullet points and list items
      if (sentence.match(/^[\*\-\•]\s+/) || sentence.match(/^\d+\.\s+/)) {
        let listItem = sentence.replace(/^[\*\-\•]\s+/, '').replace(/^\d+\.\s+/, '');
        
        // Apply highlighting to list items
        listItem = listItem
          .replace(/\b(IMPORTANT|NOTE|WARNING|TIP|KEY|BEST|TOP|PROS|CONS|GREAT|GOOD|EXCELLENT|LIGHTWEIGHT|DURABLE|SUPPORTIVE|COMFORTABLE|AFFORDABLE)\b/gi, '<strong>$1</strong>')
          .replace(/\b(quickly|easily|effectively|efficiently|highly|significantly|dramatically)\b/gi, '<em>$1</em>')
          .replace(/\$\d+(?:\.\d{2})?/g, '<strong>$&</strong>');
        
        listItems.push(`<li>${listItem}</li>`);
        continue;
      }
      
      // Handle scores and ratings
      if (sentence.match(/\d+\.\d+\/\d+\.?\d*|\d+\/\d+|\d+%|\d+\.\d+\s+POINTS?|\d+\.\d+\s+SCORE/i)) {
        sentence = sentence.replace(/(\d+\.\d+\/\d+\.?\d*|\d+\/\d+|\d+%|\d+\.\d+\s+POINTS?|\d+\.\d+\s+SCORE)/gi, '<strong>$1</strong>');
      }
      
      // Apply highlighting to important terms
      sentence = sentence
        .replace(/\b(best|worst|top|premium|budget|cheap|expensive|affordable|quality|durable|lightweight|heavy|comfortable|supportive|breathable|waterproof|excellent|outstanding|amazing|perfect|good|decent|average|poor|terrible|awful)\b/gi, '<strong>$1</strong>')
        .replace(/\b(recommended|suggested|preferred|ideal|perfect for|best for|suitable for|however|therefore|moreover|furthermore|additionally|in conclusion|in summary)\b/gi, '<em>$1</em>')
        .replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Shoes|Boots|Gear|Equipment|Device|Tool))/g, '<strong>$1</strong>')
        .replace(/\$\d+(?:\.\d{2})?/g, '<strong>$&</strong>')
        .replace(/\b(FREE\s+SHIPPING|SALE|DEAL|DISCOUNT|OFF|SAVE)\b/gi, '<strong>$1</strong>');
      
      // Add to current paragraph
      currentParagraph += sentence + ' ';
      
      // End paragraph if it's getting long or we hit a natural break
      if (currentParagraph.length > 300 || sentence.match(/[.!?]$/)) {
        if (currentParagraph.trim()) {
          formattedContent += `<p>${currentParagraph.trim()}</p>\n\n`;
          currentParagraph = '';
        }
      }
    }
    
    // End any remaining content
    if (currentParagraph.trim()) {
      formattedContent += `<p>${currentParagraph.trim()}</p>\n\n`;
    }
    
    if (inList && listItems.length > 0) {
      formattedContent += '<ul>' + listItems.join('') + '</ul>\n\n';
    }
    
    // Clean up formatting
    formattedContent = formattedContent
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/<\/p>\s*<p>/g, '</p>\n<p>') // Clean up paragraph spacing
      .replace(/<\/h[2-6]>\s*<p>/g, '</h2>\n\n<p>') // Add spacing after headings
      .replace(/<\/p>\s*<h[2-6]>/g, '</p>\n\n<h2>') // Add spacing before headings
      .trim();

    // Restore images back into the formatted content
    let finalContent = formattedContent;
    images.forEach((image, index) => {
      // Insert images after paragraphs or at strategic locations
      const paragraphIndex = Math.floor(index / 2); // Distribute images evenly
      const paragraphs = finalContent.match(/<p>.*?<\/p>/g) || [];
      
      if (paragraphs.length > paragraphIndex) {
        const targetParagraph = paragraphs[paragraphIndex];
        const insertionPoint = finalContent.indexOf(targetParagraph) + targetParagraph.length;
        finalContent = finalContent.slice(0, insertionPoint) + 
                        '\n\n' + image + '\n\n' + 
                        finalContent.slice(insertionPoint);
      } else {
        // If not enough paragraphs, append at the end
        finalContent += '\n\n' + image;
      }
    });

    // Update editor with formatted content (with images preserved)
    editor.setData(finalContent);
    setForm((prev) => ({ ...prev, content: finalContent }));
    
    toast.success("Content formatted successfully!");
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

  async function fillFormWithExtractedContent(extractedContent: {
    title: string;
    description: string;
    content: string;
    url: string;
    keywords: string[];
    headings: string[];
    images: Array<{
      src: string;
      alt: string;
      title: string;
    }>;
    author: string;
    publishDate: string;
    wordCount: number;
    readTime: number;
  }) {
    try {
      // Log the data being sent for debugging
      console.log("Sending to AI API:", {
        title: extractedContent.title?.substring(0, 50) + "...",
        contentLength: extractedContent.content?.length,
        imagesCount: extractedContent.images?.length,
        keywordsCount: extractedContent.keywords?.length,
        headingsCount: extractedContent.headings?.length
      });

      // Generate AI content based on extracted data
      const response = await fetch("/admin/api/blog/ai/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedContent,
          locale: "en" // Default to English, can be extended for multi-locale
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error("AI API Error:", errorMessage, errorData);
        throw new Error(`Failed to generate AI content: ${errorMessage}`);
      }

      const aiContent = await response.json();

      // Validate AI response has required fields
      if (!aiContent.title || !aiContent.content) {
        throw new Error("Incomplete AI response");
      }

      // Fill form with AI-generated content (only English for now)
      const generatedTitle = aiContent.title || extractedContent.title;
      const generatedSlug = aiContent.slug || slugify(generatedTitle);
      const generatedExcerpt = aiContent.excerpt || extractedContent.description;
      
      // Ensure images are included in the generated content
      let generatedContent = aiContent.content || extractedContent.content;
      if (extractedContent.images && extractedContent.images.length > 0) {
        // Check if content already has images
        const hasImages = generatedContent.includes('<img');
        
        if (!hasImages) {
          // Add images to the content using relative paths to avoid localhost issues
          const paragraphs = generatedContent.split('</p>');
          const imageInsertions: string[] = [];
          
          extractedContent.images.forEach((img, _index) => {
            // Convert absolute URLs to relative paths to avoid localhost/domain issues
            let imageUrl = img.src;
            if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('http://127.0.0.1')) {
              // If it's a localhost URL, we can't use it in production
              // Skip this image or use a placeholder
              console.warn('Skipping localhost image in production:', imageUrl);
              return;
            }
            
            // Keep original external URLs, but warn about external dependencies
            if (!imageUrl.startsWith('http')) {
              // It's already a relative path, keep it as is
              imageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
            }
            
            const imageHtml = `<figure><img src="${imageUrl}" alt="${img.alt}" title="${img.title || img.alt}" style="max-width: 100%; height: auto;" /></figure>`;
            imageInsertions.push(imageHtml);
          });
          
          // Insert images at strategic points
          if (paragraphs.length > 3 && imageInsertions.length > 0) {
            // Insert first image after first paragraph
            if (imageInsertions[0]) {
              paragraphs.splice(1, 0, imageInsertions[0]);
            }
            // Insert second image in the middle
            if (imageInsertions[1] && paragraphs.length > 5) {
              paragraphs.splice(Math.floor(paragraphs.length / 2), 0, imageInsertions[1]);
            }
            // Add remaining images at the end
            if (imageInsertions.length > 2) {
              paragraphs.push(...imageInsertions.slice(2));
            }
            generatedContent = paragraphs.join('</p>');
          } else if (imageInsertions.length > 0) {
            // Just append all images at the end
            generatedContent = generatedContent + '\n\n' + imageInsertions.join('\n\n');
          }
        }
      }
      
      const generatedMetaTitle = aiContent.metaTitle || generatedTitle;
      const generatedMetaDesc = aiContent.metaDescription || extractedContent.description;
      const generatedTags = Array.isArray(aiContent.tags) 
        ? aiContent.tags.join(", ") 
        : extractedContent.keywords.join(", ");

      setForm(prev => ({
        ...prev,
        title: {
          ...prev.title,
          en: generatedTitle,
        },
        slug: {
          ...prev.slug,
          en: generatedSlug,
        },
        excerpt: {
          ...prev.excerpt,
          en: generatedExcerpt,
        },
        content: generatedContent,
        meta_title: {
          ...prev.meta_title,
          en: generatedMetaTitle,
        },
        meta_description: {
          ...prev.meta_description,
          en: generatedMetaDesc,
        },
        tag_names: generatedTags
      }));

      // Update editor content
      const editor = editorRef.current;
      if (editor && generatedContent) {
        editor.setData(generatedContent);
      }

      toast.success(`Form filled with AI-generated content (${aiContent.provider || 'AI'})!`);

    } catch (error) {
      console.error("Error filling form:", error);
      
      // Fallback: fill with basic extracted content including images
      const fallbackTitle = extractedContent.title || "Untitled";
      const fallbackSlug = slugify(fallbackTitle);
      const fallbackExcerpt = extractedContent.description || "";
      
      // Include images in the fallback content
      let fallbackContent = extractedContent.content || "";
      if (extractedContent.images && extractedContent.images.length > 0) {
        const imageHtml = extractedContent.images.map(img => 
          `<figure><img src="${img.src}" alt="${img.alt}" title="${img.title || img.alt}" /><figcaption>${img.alt}</figcaption></figure>`
        ).join('\n\n');
        
        // Insert images at the beginning or distribute them
        const paragraphs = fallbackContent.split('\n\n');
        if (paragraphs.length > 2) {
          // Insert first image after first paragraph
          paragraphs.splice(1, 0, extractedContent.images[0] ? 
            `<figure><img src="${extractedContent.images[0].src}" alt="${extractedContent.images[0].alt}" title="${extractedContent.images[0].title || extractedContent.images[0].alt}" /></figure>` : '');
          
          // Add remaining images at the end
          if (extractedContent.images.length > 1) {
            paragraphs.push(...extractedContent.images.slice(1).map(img =>
              `<figure><img src="${img.src}" alt="${img.alt}" title="${img.title || img.alt}" /></figure>`
            ));
          }
          fallbackContent = paragraphs.join('\n\n');
        } else {
          // Just append all images at the end
          fallbackContent = fallbackContent + '\n\n' + imageHtml;
        }
      }
      
      const fallbackTags = extractedContent.keywords.join(", ");

      setForm(prev => ({
        ...prev,
        title: {
          ...prev.title,
          en: fallbackTitle,
        },
        slug: {
          ...prev.slug,
          en: fallbackSlug,
        },
        excerpt: {
          ...prev.excerpt,
          en: fallbackExcerpt,
        },
        content: fallbackContent,
        meta_title: {
          ...prev.meta_title,
          en: fallbackTitle,
        },
        meta_description: {
          ...prev.meta_description,
          en: fallbackExcerpt,
        },
        tag_names: fallbackTags
      }));

      const editor = editorRef.current;
      if (editor && fallbackContent) {
        editor.setData(fallbackContent);
      }

      toast.warning("Form filled with extracted content (AI generation unavailable)");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-6"
    >
      {/* URL Content Extractor */}
      <URLContentExtractor
        onContentExtracted={(content) => {
          console.log("Content extracted:", content);
          setExtractedContent(content);
        }}
        onFormFill={async (content) => {
          await fillFormWithExtractedContent(content);
        }}
      />

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
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-foreground">
                  Title ({l.label})
                </label>
                <AIContentAssistant
                  type="title"
                  existingContent={form.title[l.code]}
                  locale={l.code}
                  extractedContent={extractedContent || undefined}
                  onContentGenerated={(content) => {
                    const titles = content.split('\n').filter(t => t.trim()).map(t => t.trim());
                    if (titles.length > 0) {
                      const selectedTitle = titles[0]; // Use first generated title
                      onTitleChange(l.code, selectedTitle);
                      // Auto-generate slug for AI-generated titles
                      onTitleBlur(l.code, selectedTitle);
                    }
                  }}
                />
              </div>
              <input
                type="text"
                value={form.title[l.code] || ''}
                onChange={(e) => onTitleChange(l.code, e.target.value)}
                onBlur={(e) => onTitleBlur(l.code, e.target.value)}
                required={l.code === "en"}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="Enter blog post title..."
              />
            </div>
            <Input
              label={`Slug (${l.label})`}
              value={form.slug[l.code] || ''}
              onChange={(e) => onSlugChange(l.code, e.target.value)}
              required={l.code === "en"}
              placeholder="auto-generated-from-title"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Excerpt ({l.label})
                </label>
                <AIContentAssistant
                  type="excerpt"
                  existingContent={form.excerpt[l.code]}
                  locale={l.code}
                  extractedContent={extractedContent || undefined}
                  onContentGenerated={(content) => {
                    setTrans("excerpt", l.code, content);
                  }}
                />
              </div>
              <textarea
                value={form.excerpt[l.code]}
                onChange={(e) => setTrans("excerpt", l.code, e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  Meta title ({l.label})
                </label>
                <AIContentAssistant
                  type="meta_title"
                  existingContent={form.meta_title[l.code]}
                  locale={l.code}
                  extractedContent={extractedContent || undefined}
                  onContentGenerated={(content) => {
                    const titles = content.split('\n').filter(t => t.trim()).map(t => t.trim());
                    if (titles.length > 0) {
                      setTrans("meta_title", l.code, titles[0]);
                    }
                  }}
                />
              </div>
              <Input
                value={form.meta_title[l.code]}
                onChange={(e) => setTrans("meta_title", l.code, e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Meta description ({l.label})
                </label>
                <AIContentAssistant
                  type="meta_description"
                  existingContent={form.meta_description[l.code]}
                  locale={l.code}
                  extractedContent={extractedContent || undefined}
                  onContentGenerated={(content) => {
                    setTrans("meta_description", l.code, content);
                  }}
                />
              </div>
              <textarea
                value={form.meta_description[l.code]}
                onChange={(e) =>
                  setTrans("meta_description", l.code, e.target.value)
                }
                rows={6}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={formatContent}
              disabled={!form.content.trim()}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Format Content
            </Button>
            <AIContentAssistant
              type="content"
              existingContent={form.content}
              locale="en"
              extractedContent={extractedContent || undefined}
              onContentGenerated={(content) => {
                const editor = editorRef.current;
                if (editor) {
                  editor.setData(content);
                }
                setForm((prev) => ({ ...prev, content }));
              }}
            />
            <AIContentOptimizer
              content={form.content}
              contentType="content"
              onOptimized={(optimized) => {
                const editor = editorRef.current;
                if (editor) {
                  editor.setData(optimized);
                }
                setForm((prev) => ({ ...prev, content: optimized }));
              }}
            />
            <AIContentAssistant
              type="seo_optimization"
              existingContent={form.content}
              locale="en"
              extractedContent={extractedContent || undefined}
              onContentGenerated={(content) => {
                // Handle both bulk SEO suggestions and individual recommendation resolutions
                try {
                  const parsed = parseAIJSON(content);
                  
                  // Check if this is an individual recommendation resolution
                  if (parsed.type && parsed.suggestion) {
                    // Handle individual recommendation
                    const { type: recommendationType, suggestion } = parsed;
                    
                    switch (recommendationType) {
                      case "meta_description":
                        setForm(prev => ({
                          ...prev,
                          meta_description: {
                            ...prev.meta_description,
                            en: typeof suggestion === 'string' ? suggestion : String(suggestion || '')
                          }
                        }));
                        toast.success("Meta description updated");
                        break;
                      case "title":
                        setForm(prev => ({
                          ...prev,
                          meta_title: {
                            ...prev.meta_title,
                            en: typeof suggestion === 'string' ? suggestion : String(suggestion || '')
                          }
                        }));
                        toast.success("Meta title updated");
                        break;
                      case "headings":
                        // Apply heading structure suggestions to content
                        const editor = editorRef.current;
                        if (editor && suggestion) {
                          // For now, just show the suggestion in a toast
                          toast.info("Heading structure suggestion: " + suggestion);
                        }
                        break;
                      case "keywords":
                        // Update tags based on keyword suggestions
                        if (Array.isArray(suggestion)) {
                          setForm(prev => ({
                            ...prev,
                            tag_names: suggestion.join(", ")
                          }));
                          toast.success("Keywords updated");
                        }
                        break;
                      case "internal_links":
                        // Show internal linking suggestions
                        toast.info("Internal linking suggestion: " + suggestion);
                        break;
                      case "readability":
                        // Show readability suggestions
                        toast.info("Readability suggestion: " + suggestion);
                        break;
                      case "images":
                        // Show image optimization suggestions
                        toast.info("Image SEO suggestion: " + suggestion);
                        break;
                      case "url":
                        // Update slug based on URL suggestions
                        if (suggestion && typeof suggestion === 'string') {
                          const slug = suggestion.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                          setForm(prev => ({
                            ...prev,
                            slug: {
                              ...prev.slug,
                              en: slug
                            }
                          }));
                          toast.success("URL slug updated");
                        }
                        break;
                      default:
                        toast.info(`${recommendationType} suggestion: ${suggestion}`);
                    }
                  } else {
                    // Handle bulk SEO suggestions (legacy behavior)
                    if (parsed.meta_description) {
                      setForm(prev => ({
                        ...prev,
                        meta_description: {
                          ...prev.meta_description,
                          en: typeof parsed.meta_description === 'string' ? parsed.meta_description : String(parsed.meta_description || '')
                        }
                      }));
                    }
                    if (parsed.title) {
                      setForm(prev => ({
                        ...prev,
                        meta_title: {
                          ...prev.meta_title,
                          en: typeof parsed.title === 'string' ? parsed.title : String(parsed.title || '')
                        }
                      }));
                    }
                    toast.success("SEO optimization applied to form fields");
                  }
                } catch (error) {
                  console.error("Failed to parse SEO suggestions:", error);
                  console.error("Content that failed to parse:", content);
                  
                  // Return a more helpful error message
                  if (content.includes('```json')) {
                    toast.error("AI Response Error: The AI returned JSON that couldn't be parsed. Please try again.");
                  } else {
                    toast.error("AI Response Error: The AI response couldn't be processed. Please try again.");
                  }
                }
              }}
            />
            <AIContentAssistant
              type="affiliate_content"
              existingContent={form.content}
              locale="en"
              extractedContent={extractedContent || undefined}
              onContentGenerated={(content) => {
                // Handle both bulk affiliate suggestions and individual recommendation resolutions
                try {
                  const parsed = parseAIJSON(content);
                  
                  // Check if this is an individual recommendation resolution
                  if (parsed.type && parsed.suggestion) {
                    // Handle individual recommendation
                    const { type: recommendationType, suggestion } = parsed;
                    
                    switch (recommendationType) {
                      case "product_placements":
                        // Add product placement suggestions to content
                        const placementContent = `
<!-- Product Placement -->
<div class="product-placement">
  <p>${suggestion}</p>
</div>`;
                        const editor1 = editorRef.current;
                        if (editor1) {
                          const currentContent1 = editor1.getData();
                          editor1.setData(currentContent1 + placementContent);
                          setForm(prev => ({ ...prev, content: currentContent1 + placementContent }));
                        }
                        toast.success("Product placement added");
                        break;
                      case "reviews":
                        // Add product review section
                        const reviewContent = `
<!-- Product Review -->
<div class="product-review">
  <h3>Product Review</h3>
  ${suggestion}
</div>`;
                        const editor2 = editorRef.current;
                        if (editor2) {
                          const currentContent2 = editor2.getData();
                          editor2.setData(currentContent2 + reviewContent);
                          setForm(prev => ({ ...prev, content: currentContent2 + reviewContent }));
                        }
                        toast.success("Product review section added");
                        break;
                      case "comparisons":
                        // Add comparison table
                        const comparisonContent = `
<!-- Product Comparison -->
<div class="product-comparison">
  <h3>Product Comparison</h3>
  ${suggestion}
</div>`;
                        const editor3 = editorRef.current;
                        if (editor3) {
                          const currentContent3 = editor3.getData();
                          editor3.setData(currentContent3 + comparisonContent);
                          setForm(prev => ({ ...prev, content: currentContent3 + comparisonContent }));
                        }
                        toast.success("Comparison table added");
                        break;
                      case "recommendations":
                        // Add recommendation list
                        const recommendationContent = `
<!-- Recommendations -->
<div class="recommendations">
  <h3>Top Recommendations</h3>
  ${suggestion}
</div>`;
                        const editor4 = editorRef.current;
                        if (editor4) {
                          const currentContent4 = editor4.getData();
                          editor4.setData(currentContent4 + recommendationContent);
                          setForm(prev => ({ ...prev, content: currentContent4 + recommendationContent }));
                        }
                        toast.success("Recommendations added");
                        break;
                      case "ctas":
                        // Add call-to-action phrases
                        const ctaContent = `
<!-- Call to Action -->
<div class="cta-section">
  <p><strong>${suggestion}</strong></p>
</div>`;
                        const editor5 = editorRef.current;
                        if (editor5) {
                          const currentContent5 = editor5.getData();
                          editor5.setData(currentContent5 + ctaContent);
                          setForm(prev => ({ ...prev, content: currentContent5 + ctaContent }));
                        }
                        toast.success("Call-to-action added");
                        break;
                      case "disclosures":
                        // Add disclosure statement
                        const disclosureContent = `
<!-- Affiliate Disclosure -->
<div class="affiliate-disclosure">
  <p><em>${suggestion}</em></p>
</div>`;
                        const editor6 = editorRef.current;
                        if (editor6) {
                          const currentContent6 = editor6.getData();
                          editor6.setData(currentContent6 + disclosureContent);
                          setForm(prev => ({ ...prev, content: currentContent6 + disclosureContent }));
                        }
                        toast.success("Disclosure statement added");
                        break;
                      case "benefits":
                        // Add product benefits
                        const benefitsContent = `
<!-- Product Benefits -->
<div class="product-benefits">
  <h3>Key Benefits</h3>
  ${suggestion}
</div>`;
                        const editor7 = editorRef.current;
                        if (editor7) {
                          const currentContent7 = editor7.getData();
                          editor7.setData(currentContent7 + benefitsContent);
                          setForm(prev => ({ ...prev, content: currentContent7 + benefitsContent }));
                        }
                        toast.success("Product benefits added");
                        break;
                      case "buying_guide":
                        // Add buying guide section
                        const guideContent = `
<!-- Buying Guide -->
<div class="buying-guide">
  <h3>Buying Guide</h3>
  ${suggestion}
</div>`;
                        const editor8 = editorRef.current;
                        if (editor8) {
                          const currentContent8 = editor8.getData();
                          editor8.setData(currentContent8 + guideContent);
                          setForm(prev => ({ ...prev, content: currentContent8 + guideContent }));
                        }
                        toast.success("Buying guide added");
                        break;
                      default:
                        toast.info(`${recommendationType} suggestion: ${suggestion}`);
                    }
                  } else {
                    // Handle bulk affiliate suggestions (legacy behavior)
                    const affiliateContent = `
<!-- Affiliate Content Suggestions -->
<div class="affiliate-section">
  <h3>Recommended Products</h3>
  ${parsed.recommendations || ''}
  <p><em>Disclosure: This post contains affiliate links. We may earn a commission if you purchase through our links.</em></p>
</div>`;
                    
                    const editor = editorRef.current;
                    if (editor) {
                      const currentContent = editor.getData();
                      editor.setData(currentContent + affiliateContent);
                    }
                    setForm((prev) => ({ ...prev, content: form.content + affiliateContent }));
                    toast.success("Affiliate content suggestions added");
                  }
                } catch (error) {
                  console.error("Failed to parse affiliate suggestions:", error);
                  toast.error("Failed to add affiliate suggestions");
                }
              }}
            />
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
        
        {/* Grammarly Editor - positioned at top */}
        <div className="mb-4">
          <GrammarlyEditor
            content={form.content}
            onContentChange={(content) => setForm((prev) => ({ ...prev, content }))}
            placeholder="Write the body of your blog post with grammar checking..."
            isRichText={true}
          />
        </div>
        
        <RichTextEditor
          value={form.content}
          onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
          onReady={(editor) => { 
            editorRef.current = editor;
            // Ensure initial content is set when editor is ready (for edit mode)
            if (isEditing && post?.content && form.content) {
              editor.setData(form.content);
            }
          }}
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
                  setEditingWizard({ encoded, steps: data.steps, borderColor, borderSize, showFooter: data.showFooter ?? true, shadow: data.shadow ?? "shadow-sm", showBorder: data.showBorder ?? true, showPanelBorder: data.showPanelBorder ?? true, panelBorderColor: data.panelBorderColor ?? "#e2e8f0" });
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
            initialShowFooter={editingWizard.showFooter}
            initialShadow={editingWizard.shadow}
            initialShowBorder={editingWizard.showBorder}
            initialShowPanelBorder={editingWizard.showPanelBorder}
            initialPanelBorderColor={editingWizard.panelBorderColor}
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
          placeholder="/uploads/Profile/profile-male.png"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground">
              Tags (comma-separated)
            </label>
            <AIContentAssistant
              type="tags"
              existingContent={form.content}
              locale="en"
              extractedContent={extractedContent || undefined}
              onContentGenerated={(content) => {
                // Parse generated tags and set them
                const tags = content.split('\n')
                  .filter(t => t.trim())
                  .map(t => t.trim().replace(/^[-•*]\s*/, ''))
                  .join(', ');
                setForm((prev) => ({ ...prev, tag_names: tags }));
              }}
            />
          </div>
          <Input
            value={form.tag_names}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tag_names: e.target.value }))
            }
            placeholder="reviews, gadgets, top-picks"
          />
        </div>

        <Input
          label="Publish at (schedule)"
          type="datetime-local"
          value={form.published_at}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, published_at: e.target.value }))
          }
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Admin Note (Private)
          </label>
          <textarea
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            placeholder="Add personal notes for admin reference only (not shown in frontend)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand min-h-[100px] resize-y"
          />
          <p className="text-xs text-muted">
            This note is only visible to admins and will not be displayed on the frontend.
          </p>
        </div>
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

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO & Optimization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-6">
          <ImprovedSEOOptimizer
            title={form.title.en || ""}
            content={form.content}
            metaTitle={form.meta_title.en || ""}
            metaDescription={form.meta_description.en || ""}
            tags={form.tag_names.split(",").map(tag => tag.trim()).filter(Boolean)}
            category={(categories.find(cat => cat.id === form.blog_category_id)?.name.en || "")}
            onOptimizationApplied={(optimizations: Record<string, unknown>) => {
              // Apply optimizations to form
              if (typeof optimizations.title === 'string') {
                setForm(prev => ({
                  ...prev,
                  title: { ...prev.title, en: optimizations.title as string }
                }));
              }
              if (typeof optimizations.meta_title === 'string') {
                setForm(prev => ({
                  ...prev,
                  meta_title: { ...prev.meta_title, en: optimizations.meta_title as string }
                }));
              }
              if (typeof optimizations.meta_description === 'string') {
                setForm(prev => ({
                  ...prev,
                  meta_description: { ...prev.meta_description, en: optimizations.meta_description as string }
                }));
              }
              if (typeof optimizations.content === 'string') {
                setForm(prev => ({ ...prev, content: optimizations.content as string }));
              }
              if (typeof optimizations.tags === 'string') {
                const tagArray = (optimizations.tags as string).split(',').map((tag: string) => tag.trim());
                setForm(prev => ({ ...prev, tag_names: tagArray.join(', ') }));
              }
            }}
          />
          
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
        </TabsContent>
      </Tabs>
    </form>
  );
}
