"use client";

import { useState } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { Loader2, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AIContentOptimizerProps {
  content: string;
  contentType: "title" | "excerpt" | "content" | "meta_title" | "meta_description";
  onOptimized: (optimized: string) => void;
}

interface OptimizationSuggestion {
  type: "seo" | "readability" | "engagement" | "length";
  severity: "low" | "medium" | "high";
  message: string;
  suggestion: string;
  optimizedText?: string;
}

export function AIContentOptimizer({ content, contentType, onOptimized }: AIContentOptimizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

  async function analyzeContent() {
    if (!content.trim()) {
      toast.error("Please enter some content to analyze");
      return;
    }

    setIsAnalyzing(true);
    setSuggestions([]);

    try {
      const response = await fetch("/admin/api/blog/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          type: contentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to analyze content");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast.success("Content analysis complete");
    } catch (error) {
      console.error("Content analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze content");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function applyOptimization(suggestion: OptimizationSuggestion) {
    if (suggestion.optimizedText) {
      onOptimized(suggestion.optimizedText);
      toast.success("Optimization applied");
    }
  }

  function getSeverityIcon(severity: "low" | "medium" | "high") {
    switch (severity) {
      case "low": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "medium": return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "high": return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "seo": return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "readability": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "engagement": return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case "length": return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
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
        <TrendingUp className="h-4 w-4" />
        AI Optimize
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-surface/50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand" />
          AI Content Optimizer
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

      <div className="space-y-3">
        <Button
          type="button"
          onClick={analyzeContent}
          disabled={isAnalyzing || !content.trim()}
          className="gap-2 w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing Content...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Analyze for Optimization
            </>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">
              Optimization Suggestions ({suggestions.length})
            </h4>
            
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3 space-y-2 bg-surface"
                >
                  <div className="flex items-start gap-2">
                    {getTypeIcon(suggestion.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(suggestion.severity)}
                        <span className="font-medium text-sm capitalize">
                          {suggestion.type} ({suggestion.severity})
                        </span>
                      </div>
                      <p className="text-sm text-muted">
                        {suggestion.message}
                      </p>
                      {suggestion.suggestion && (
                        <p className="text-sm text-foreground">
                          <strong>Suggestion:</strong> {suggestion.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {suggestion.optimizedText && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => applyOptimization(suggestion)}
                        className="gap-2"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestions.length === 0 && !isAnalyzing && content.trim() && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted">
              Your content looks good! No major optimization suggestions at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
