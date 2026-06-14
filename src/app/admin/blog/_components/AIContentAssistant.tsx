"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Loader2, Sparkles, Copy, Check, Brain } from "lucide-react";
import { toast } from "sonner";
import { OptimizationRecommendations } from "./OptimizationRecommendations";
import { parseAIJSON } from "@/lib/json-parser";

interface AIContentAssistantProps {
  onContentGenerated: (content: string) => void;
  type: "title" | "excerpt" | "content" | "meta_title" | "meta_description" | "tags" | "seo_optimization" | "affiliate_content";
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

const AI_MODELS = [
  { id: "groq", name: "Groq (Llama 3.1)", description: "Fast and free - recommended", provider: "Groq" },
  { id: "gpt-4", name: "GPT-4", description: "Most capable model for complex content", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and cost-effective", provider: "OpenAI" },
  { id: "claude-3", name: "Claude 3", description: "Great for structured content", provider: "Anthropic" },
  { id: "gemini-pro", name: "Gemini Pro", description: "Google's model for SEO content", provider: "Google" }
];

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
  const [selectedAIModel, setSelectedAIModel] = useState("groq");
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [structuredRecommendations, setStructuredRecommendations] = useState<Record<string, any> | null>(null);

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
    seo_optimization: "SEO Optimization Analysis",
    affiliate_content: "Affiliate Content Strategy",
  };

  const lengthOptions = {
    title: { show: false },
    excerpt: { show: false },
    content: { show: true },
    meta_title: { show: false },
    meta_description: { show: false },
    tags: { show: false },
    seo_optimization: { show: false },
    affiliate_content: { show: false },
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
          aiModel: selectedAIModel,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // Extract field-specific validation errors
        if (error.issues?.fieldErrors) {
          const fieldErrors = Object.entries(error.issues.fieldErrors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          throw new Error(fieldErrors || error.error || "Failed to generate content");
        }
        throw new Error(error.error || "Failed to generate content");
      }

      const data = await response.json();
      
      // Clean up content - remove markdown code blocks if AI returns them
      let cleanedContent = data.content;
      
      // Remove markdown code blocks (```html ... ``` or ```...```)
      cleanedContent = cleanedContent.replace(/^```(?:html)?\s*\n/gm, '');
      cleanedContent = cleanedContent.replace(/\n```\s*$/gm, '');
      cleanedContent = cleanedContent.replace(/^```\s*$/gm, '');
      
      // Trim any leading/trailing whitespace
      cleanedContent = cleanedContent.trim();
      
      // Handle structured recommendations for SEO and affiliate content
      if (type === "seo_optimization" || type === "affiliate_content") {
        try {
          const parsed = JSON.parse(cleanedContent);
          setStructuredRecommendations(parsed);
          setGeneratedContent(cleanedContent);
        } catch (error) {
          // If parsing fails, treat as regular content
          setStructuredRecommendations(null);
          setGeneratedContent(cleanedContent);
        }
      } else {
        setGeneratedContent(cleanedContent);
        setStructuredRecommendations(null);
      }
      
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

  async function handleResolveRecommendation(recommendationType: string, suggestion: string) {
    try {
      // Call the parent callback with the resolved recommendation
      onContentGenerated(JSON.stringify({ type: recommendationType, suggestion }));
    } catch (error) {
      console.error("Failed to resolve recommendation:", error);
      throw error;
    }
  }

  function formatAffiliateContent(content: string): string {
    try {
      const parsed = parseAIJSON(content);
      let formatted = "";

      // Product Placements
      if (parsed.product_placements && Array.isArray(parsed.product_placements)) {
        formatted += "## 🛍️ Product Placement Opportunities\n\n";
        parsed.product_placements.forEach((item: any, index: number) => {
          formatted += `**${index + 1}. ${item.product}**\n`;
          formatted += `> ${item.placement}\n\n`;
        });
      }

      // Product Reviews
      if (parsed.reviews && Array.isArray(parsed.reviews)) {
        formatted += "## ⭐ Product Reviews\n\n";
        parsed.reviews.forEach((item: any) => {
          formatted += `### ${item.product} (${item.rating}/5 ⭐)\n`;
          formatted += `> ${item.review}\n\n`;
        });
      }

      // Comparisons
      if (parsed.comparisons && Array.isArray(parsed.comparisons)) {
        formatted += "## ⚖️ Product Comparisons\n\n";
        parsed.comparisons.forEach((item: any) => {
          formatted += `### ${item.products.join(' vs ')}\n`;
          formatted += `**Features:** ${item.features.join(', ')}\n`;
          formatted += `**Comparison:** ${item.comparison}\n\n`;
        });
      }

      // Recommendations
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        formatted += "## 🏆 Top Recommendations\n\n";
        parsed.recommendations.forEach((item: any, index: number) => {
          formatted += `**${index + 1}. ${item.product}**\n`;
          formatted += `> ${item.reason}\n\n`;
        });
      }

      // Call-to-Actions
      if (parsed.ctas && Array.isArray(parsed.ctas)) {
        formatted += "## 🎯 Call-to-Action Phrases\n\n";
        parsed.ctas.forEach((item: any) => {
          formatted += `• "${item.text}"\n`;
          formatted += `  → ${item.link}\n\n`;
        });
      }

      // Disclosures
      if (parsed.disclosures && Array.isArray(parsed.disclosures)) {
        formatted += "## ⚖️ Disclosure Statements\n\n";
        parsed.disclosures.forEach((item: any) => {
          formatted += `> ${item}\n\n`;
        });
      }

      // Benefits
      if (parsed.benefits && Array.isArray(parsed.benefits)) {
        formatted += "## 💎 Product Benefits\n\n";
        parsed.benefits.forEach((item: any) => {
          formatted += `**${item.product}**: ${item.benefit}\n\n`;
        });
      }

      // Buying Guide
      if (parsed.buying_guide && Array.isArray(parsed.buying_guide)) {
        formatted += "## 📚 Buying Guide\n\n";
        parsed.buying_guide.forEach((item: any) => {
          formatted += `### ${item.title}\n`;
          formatted += `${item.text}\n\n`;
        });
      }

      return formatted || content;
    } catch (error) {
      console.error("Failed to format affiliate content:", error);
      console.error("Content that failed to parse:", content);
      
      // Return a more helpful error message
      if (content.includes('```json')) {
        return "⚠️ **AI Response Error**: The AI returned content with JSON formatting that couldn't be parsed. Please try again or contact support.\n\n**Raw content:**\n" + content;
      } else {
        return "⚠️ **AI Response Error**: The AI response couldn't be processed. Please try again.\n\n**Error details:** " + (error instanceof Error ? error.message : String(error)) + "\n\n**Raw content:**\n" + content;
      }
    }
  }

  if (!isOpen) {
    const getButtonText = () => {
      switch (type) {
        case "content":
          return "AI Generate";
        case "seo_optimization":
          return "AI SEO Analysis";
        case "affiliate_content":
          return "AI Affiliate Strategy";
        case "title":
          return "AI Title Ideas";
        case "excerpt":
          return "AI Excerpt";
        case "meta_title":
          return "AI Meta Title";
        case "meta_description":
          return "AI Meta Description";
        case "tags":
          return "AI Tags";
        default:
          return "AI Generate";
      }
    };

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {getButtonText()}
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

        <div className="grid grid-cols-3 gap-3">
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

          {/* AI Model Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI Model
            </label>
            <select
              value={selectedAIModel}
              onChange={(e) => setSelectedAIModel(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {AI_MODELS.find(m => m.id === selectedAIModel)?.provider}
            </p>
          </div>

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

        {/* AI Model Description */}
        <div className="text-xs text-gray-500">
          <strong>AI Model:</strong> {AI_MODELS.find(m => m.id === selectedAIModel)?.description}
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
          {(type === "seo_optimization" || type === "affiliate_content") ? (
            <>
              {structuredRecommendations ? (
                <OptimizationRecommendations
                  recommendations={structuredRecommendations}
                  type={type}
                  onResolveRecommendation={handleResolveRecommendation}
                />
              ) : (
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
                  
                  <div className="max-h-96 overflow-y-auto">
                    {type === "affiliate_content" ? (
                      <div 
                        className="rounded-lg border border-border bg-surface p-3 text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatAffiliateContent(generatedContent).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/### (.*?)\n/g, '<h4>$1</h4>').replace(/## (.*?)\n/g, '<h3>$1</h3>') }}
                      />
                    ) : (
                      <textarea
                        value={generatedContent}
                        readOnly
                        rows={12}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
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
              
              <div className="max-h-96 overflow-y-auto">
                {type === "content" ? (
                  <>
                    <style>{`
                      .ai-content-preview h2 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-top: 1.5rem;
                        margin-bottom: 0.75rem;
                        color: #1a202c;
                      }
                      .ai-content-preview h3 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        margin-top: 1.25rem;
                        margin-bottom: 0.5rem;
                        color: #2d3748;
                      }
                      .ai-content-preview p {
                        margin-bottom: 1rem;
                        color: #4a5568;
                      }
                      .ai-content-preview ul, .ai-content-preview ol {
                        margin-left: 1.5rem;
                        margin-bottom: 1rem;
                      }
                      .ai-content-preview li {
                        margin-bottom: 0.5rem;
                      }
                      .ai-content-preview table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1rem 0;
                      }
                      .ai-content-preview th, .ai-content-preview td {
                        border: 1px solid #e2e8f0;
                        padding: 0.5rem;
                        text-align: left;
                      }
                      .ai-content-preview th {
                        background-color: #f7fafc;
                        font-weight: 600;
                      }
                      .ai-content-preview strong {
                        font-weight: 600;
                        color: #2d3748;
                      }
                    `}</style>
                    <div 
                      className="ai-content-preview rounded-lg border border-border bg-white p-6 text-base"
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.7'
                      }}
                      dangerouslySetInnerHTML={{ __html: generatedContent }}
                    />
                  </>
                ) : (
                  <textarea
                    value={generatedContent}
                    readOnly
                    rows={type === "excerpt" || type === "meta_description" ? 6 : 12}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
