"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface AIContentAssistantProps {
  onContentGenerated: (content: string) => void;
  type: "title" | "excerpt" | "content" | "meta_title" | "meta_description" | "tags";
  existingContent?: string;
  locale?: string;
  extractedContent?: {
    title: string;
    description: string;
    content: string;
    keywords: string[];
    headings: string[];
  };
}

export function AIContentAssistant({ 
  onContentGenerated, 
  type, 
  existingContent = "",
  locale = "en",
  extractedContent 
}: AIContentAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-populate topic with existing content when available
  useEffect(() => {
    if (extractedContent) {
      let defaultTopic = "";
      let defaultKeywords = "";
      
      switch (type) {
        case "title":
          defaultTopic = extractedContent.title || "";
          defaultKeywords = extractedContent.keywords.join(", ");
          break;
        case "excerpt":
          defaultTopic = extractedContent.description || extractedContent.title || "";
          defaultKeywords = extractedContent.keywords.join(", ");
          break;
        case "content":
          defaultTopic = extractedContent.title || extractedContent.description || "";
          defaultKeywords = extractedContent.keywords.join(", ");
          break;
        case "meta_title":
          defaultTopic = extractedContent.title || "";
          defaultKeywords = extractedContent.keywords.join(", ");
          break;
        case "meta_description":
          defaultTopic = extractedContent.description || extractedContent.title || "";
          defaultKeywords = extractedContent.keywords.join(", ");
          break;
        case "tags":
          defaultTopic = extractedContent.title || extractedContent.description || "";
          defaultKeywords = extractedContent.keywords.join(", ");
          break;
      }
      
      setTopic(defaultTopic);
      setKeywords(defaultKeywords);
    } else if (existingContent && existingContent.trim()) {
      // Use existing form content as topic if no extracted content (remove HTML tags and truncate)
      const plainText = existingContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
      const truncatedContent = plainText.substring(0, 200);
      setTopic(truncatedContent);
    }
  }, [extractedContent, existingContent, type]);

  const typeLabels = {
    title: "Blog Post Titles",
    excerpt: "Blog Post Excerpt",
    content: "Blog Post Content",
    meta_title: "SEO Meta Title",
    meta_description: "SEO Meta Description",
    tags: "Content Tags",
  };

  const lengthOptions = {
    title: { show: false },
    excerpt: { show: false },
    content: { show: true },
    meta_title: { show: false },
    meta_description: { show: false },
    tags: { show: false },
  };

  async function generateContent() {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const keywordArray = keywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const response = await fetch("/admin/api/blog/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          topic: topic.trim(),
          keywords: keywordArray,
          tone,
          length,
          locale,
          existingContent: existingContent.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to generate content");
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      toast.success(`Content generated using ${data.provider}`);
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  }

  function useContent() {
    if (generatedContent.trim()) {
      onContentGenerated(generatedContent.trim());
      toast.success("Content added to form");
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      toast.success("Content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  function regenerateContent() {
    generateContent();
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        AI Generate
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg p-6 space-y-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            AI {typeLabels[type]}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>

      <div className="grid gap-3">
        <Input
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Best wireless headphones for 2024"
          required
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="headphones, wireless, audio, reviews"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="technical">Technical</option>
            <option value="creative">Creative</option>
          </Select>

          {lengthOptions[type].show && (
            <Select
              label="Length"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </Select>
          )}
        </div>

        {existingContent && type !== "title" && (
          <div className="text-xs text-muted">
            <strong>Context:</strong> Using existing content as reference
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={generateContent}
            disabled={isGenerating || !topic.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>

          {generatedContent && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={regenerateContent}
                disabled={isGenerating}
              >
                Regenerate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {generatedContent && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Generated Content
            </label>
            <Button
              type="button"
              onClick={useContent}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Use This Content
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {type === "content" ? (
              <div 
                className="rounded-lg border border-border bg-surface p-3 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedContent }}
              />
            ) : (
              <textarea
                value={generatedContent}
                readOnly
                rows={type === "excerpt" || type === "meta_description" ? 3 : 4}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono"
              />
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
