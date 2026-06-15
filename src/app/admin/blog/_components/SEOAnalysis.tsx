"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Eye, MousePointer, Brain } from "lucide-react";
import { Badge } from "@/app/admin/_components/ui/badge";
import { Button } from "@/app/admin/_components/ui/button";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

import type { BlogPost } from "@/types/domain";

interface SEOAnalysisProps {
  post: BlogPost;
}

interface SEOMetrics {
  titleLength: number;
  descriptionLength: number;
  keywordDensity: number;
  readabilityScore: number;
  estimatedCTR: number;
  pageSpeed: number;
  mobileFriendly: boolean;
  hasSchema: boolean;
}

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", description: "Most capable model for SEO analysis", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and cost-effective", provider: "OpenAI" },
  { id: "claude-3", name: "Claude 3", description: "Great for content analysis", provider: "Anthropic" },
  { id: "gemini-pro", name: "Gemini Pro", description: "Google's model for SEO insights", provider: "Google" }
];

export function SEOAnalysis({ post }: SEOAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [selectedAIModel, setSelectedAIModel] = useState("gpt-4");

  const titleEn = post.title?.en ?? "";
  const description = post.meta_description?.en ?? "";
  const keywords = post.blog_post_tags?.map(tag => tag.blog_tags.name?.en).filter(Boolean).join(', ') ?? "";

  const analyzeSEO = async () => {
    setIsLoading(true);
    
    // Simulate SEO analysis - in real implementation, this would call an API
    setTimeout(() => {
      const analysis: SEOMetrics = {
        titleLength: titleEn.length,
        descriptionLength: description.length,
        keywordDensity: keywords ? (keywords.split(',').length / Math.max(titleEn.split(' ').length, 1)) * 100 : 0,
        readabilityScore: Math.floor(Math.random() * 30) + 70, // 70-100
        estimatedCTR: Math.floor(Math.random() * 15) + 2, // 2-17%
        pageSpeed: Math.floor(Math.random() * 30) + 70, // 70-100
        mobileFriendly: true,
        hasSchema: Math.random() > 0.5
      };
      setMetrics(analysis);
      setIsLoading(false);
    }, 1000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number, label: string) => {
    let variant: "default" | "success" | "warning" | "error" = "error";
    if (score >= 80) variant = "success";
    else if (score >= 60) variant = "warning";
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">{label}:</span>
        <Badge variant={variant}>{score}%</Badge>
      </div>
    );
  };

  const getSEOScore = () => {
    if (!metrics) return 0;
    
    let score = 0;
    
    // Title length (30-60 chars optimal)
    if (metrics.titleLength >= 30 && metrics.titleLength <= 60) score += 20;
    
    // Description length (150-160 chars optimal)
    if (metrics.descriptionLength >= 120 && metrics.descriptionLength <= 160) score += 20;
    
    // Readability score
    score += (metrics.readabilityScore / 100) * 20;
    
    // Page speed
    score += (metrics.pageSpeed / 100) * 20;
    
    // Mobile friendly
    if (metrics.mobileFriendly) score += 10;
    
    // Schema markup
    if (metrics.hasSchema) score += 10;
    
    return Math.round(score);
  };

  return (
    <div className="border rounded-lg p-3 bg-surface/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-brand" />
          <span className="font-medium text-sm">SEO Analysis</span>
          {metrics && (
            <Badge variant={getSEOScore() >= 80 ? "success" : getSEOScore() >= 60 ? "warning" : "error"}>
              {getSEOScore()}%
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-2"
        >
          {isExpanded ? "Hide" : "Show"}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {!metrics ? (
            <div className="space-y-3">
              {/* AI Model Selection */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI Model for Analysis
                </label>
                <select
                  value={selectedAIModel}
                  onChange={(e) => setSelectedAIModel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider}) - {model.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={analyzeSEO}
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-4 mr-2" />
                    Analyzing with {AI_MODELS.find(m => m.id === selectedAIModel)?.name}...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analyze SEO
                  </>
                )}
              </Button>
              {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3 text-muted" />
                  <span className="text-xs text-muted">Views:</span>
                  <span className="text-xs font-medium">{post.view_count || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MousePointer className="h-3 w-3 text-muted" />
                  <span className="text-xs text-muted">CTR:</span>
                  <span className={`text-xs font-medium ${getScoreColor(metrics.estimatedCTR)}`}>
                    {metrics.estimatedCTR}%
                  </span>
                </div>
              </div>

              {/* SEO Metrics */}
              <div className="space-y-2">
                {getScoreBadge(metrics.readabilityScore, "Readability")}
                {getScoreBadge(metrics.pageSpeed, "Page Speed")}
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">Mobile:</span>
                  {metrics.mobileFriendly ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">Schema:</span>
                  {metrics.hasSchema ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              {/* Content Analysis */}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Title Length:</span>
                  <span className={getScoreColor(metrics.titleLength >= 30 && metrics.titleLength <= 60 ? 100 : 50)}>
                    {metrics.titleLength} chars
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Description Length:</span>
                  <span className={getScoreColor(metrics.descriptionLength >= 120 && metrics.descriptionLength <= 160 ? 100 : 50)}>
                    {metrics.descriptionLength} chars
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Keywords:</span>
                  <span className="text-muted">{keywords ? keywords.split(',').length : 0}</span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="border-t pt-2">
                <p className="text-xs font-medium mb-1">Recommendations:</p>
                <ul className="text-xs text-muted space-y-1">
                  {metrics.titleLength < 30 && (
                    <li>• Title too short (min 30 chars)</li>
                  )}
                  {metrics.titleLength > 60 && (
                    <li>• Title too long (max 60 chars)</li>
                  )}
                  {metrics.descriptionLength < 120 && (
                    <li>• Description too short (min 120 chars)</li>
                  )}
                  {metrics.descriptionLength > 160 && (
                    <li>• Description too long (max 160 chars)</li>
                  )}
                  {!metrics.hasSchema && (
                    <li>• Add structured data markup</li>
                  )}
                  {keywords.split(',').length < 3 && (
                    <li>• Add more relevant keywords</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
