"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { toast } from "sonner";

type LocaleCode = "en" | "bn-BD" | "sv";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (description: string) => void;
  productName: string;
  currentDescription: string;
  locale: LocaleCode;
}

const MODELS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq - Free)" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Groq - Free)" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Groq - Free)" },
  { value: "gemma2-9b-it", label: "Gemma 2 9B (Groq - Free)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (OpenAI)" },
  { value: "gpt-4o", label: "GPT-4o (OpenAI)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo (OpenAI)" },
  { value: "gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (Google)" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "persuasive", label: "Persuasive" },
  { value: "friendly", label: "Friendly" },
  { value: "technical", label: "Technical" },
];

const ACTIONS = [
  { value: "generate", label: "Generate description" },
  { value: "improve", label: "Improve existing description" },
  { value: "seo", label: "Add SEO keywords" },
  { value: "persuasive", label: "Make it more persuasive" },
];

export function AIAssistantModal({
  isOpen,
  onClose,
  onGenerate,
  productName,
  currentDescription,
  locale,
}: AIAssistantModalProps) {
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [tone, setTone] = useState("professional");
  const [action, setAction] = useState("generate");
  const [features, setFeatures] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/admin/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          productName,
          features,
          targetAudience,
          tone,
          action,
          existingDescription: currentDescription,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate description");
      }

      onGenerate(data.description);
      toast.success("Description generated successfully");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate description");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>
        </div>

        <div className="space-y-4">
          {/* Model Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium">Model</label>
            <Select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Action Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium">Action</label>
            <Select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              disabled={loading}
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Product Name (read-only) */}
          <div>
            <label className="mb-1 block text-sm font-medium">Product Name</label>
            <Input
              value={productName}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Features */}
          <div>
            <label className="mb-1 block text-sm font-medium">Key Features</label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="e.g. Waterproof, 10-hour battery, Bluetooth 5.0"
              rows={3}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="mb-1 block text-sm font-medium">Target Audience</label>
            <Input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Young professionals, outdoor enthusiasts"
              disabled={loading}
            />
          </div>

          {/* Tone */}
          <div>
            <label className="mb-1 block text-sm font-medium">Tone</label>
            <Select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={loading}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || !productName.trim()}
              className="flex-1"
            >
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
