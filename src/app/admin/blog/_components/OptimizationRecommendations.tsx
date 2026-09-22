"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/admin/_components/ui/card";
import { CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp, X, ThumbsUp, ThumbsDown, Code, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface RecommendationItem {
  id: string;
  type: "title" | "meta_description" | "headings" | "keywords" | "internal_links" | "readability" | "images" | "url" | "product_placements" | "reviews" | "comparisons" | "recommendations" | "ctas" | "disclosures" | "benefits" | "buying_guide";
  title: string;
  description: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
  resolved: boolean;
}

interface OptimizationRecommendationsProps {
  recommendations: Record<string, unknown>;
  type: "seo_optimization" | "affiliate_content";
  onResolveRecommendation: (type: string, suggestion: string) => Promise<void>;
}

export function OptimizationRecommendations({
  recommendations,
  type,
  onResolveRecommendation
}: OptimizationRecommendationsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [resolvingItems, setResolvingItems] = useState<Set<string>>(new Set());
  const [resolvedItems, setResolvedItems] = useState<Set<string>>(new Set());
  const [rejectedItems, setRejectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<Record<string, "html" | "json">>({});
  const [showFullJson, setShowFullJson] = useState(false);
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});

  // Initialize first section as expanded on mount (accordion style)
  useEffect(() => {
    const sections: Record<string, boolean> = {};
    const keys = Object.keys(recommendations);
    if (keys.length > 0) {
      sections[keys[0]] = true; // Only expand first section
      keys.slice(1).forEach(key => {
        sections[key] = false;
      });
    }
    setExpandedSections(sections);
  }, [recommendations]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      // Accordion behavior: close all other sections when one is opened
      const newSections: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newSections[key] = key === section ? !prev[key] : false;
      });
      return newSections;
    });
  };

  const toggleViewMode = (itemId: string) => {
    setViewMode(prev => ({
      ...prev,
      [itemId]: prev[itemId] === "html" ? "json" : "html"
    }));
  };

  const toggleContentExpansion = (itemId: string) => {
    setExpandedContent(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatSuggestion = (suggestion: string, mode: "html" | "json") => {
    if (mode === "json") {
      try {
        // Try to parse as JSON for pretty printing
        const parsed = JSON.parse(suggestion);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If not valid JSON, show as-is
        return suggestion;
      }
    }
    // HTML mode - render as-is
    return suggestion;
  };

  const handleResolve = async (itemType: string, suggestion: string, itemId: string) => {
    setResolvingItems(prev => new Set(prev).add(itemId));
    
    try {
      await onResolveRecommendation(itemType, suggestion);
      setResolvedItems(prev => new Set(prev).add(itemId));
      setRejectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      toast.success(`✅ Applied ${itemType} recommendation`);
    } catch (error) {
      console.error("Failed to resolve recommendation:", error);
      toast.error("Failed to apply recommendation");
    } finally {
      setResolvingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleReject = (itemId: string) => {
    setRejectedItems(prev => new Set(prev).add(itemId));
    setResolvedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    toast.info("❌ Recommendation rejected");
  };

  const handleUndo = (itemId: string) => {
    setResolvedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    setRejectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    toast.info("↩️ Action undone");
  };

  const parseRecommendations = (): RecommendationItem[] => {
    const items: RecommendationItem[] = [];
    
    if (type === "seo_optimization") {
      // SEO Recommendations
      Object.entries(recommendations).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          items.push({
            id: `seo-${key}`,
            type: key as RecommendationItem["type"],
            title: getSEOTitle(key),
            description: getSEODescription(key),
            suggestion: typeof value === 'string' ? value : JSON.stringify(value),
            priority: getSEOPriority(key),
            resolved: resolvedItems.has(`seo-${key}`)
          });
        }
      });
    } else if (type === "affiliate_content") {
      // Affiliate Content Recommendations
      Object.entries(recommendations).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          items.push({
            id: `affiliate-${key}`,
            type: key as RecommendationItem["type"],
            title: getAffiliateTitle(key),
            description: getAffiliateDescription(key),
            suggestion: typeof value === 'string' ? value : JSON.stringify(value),
            priority: getAffiliatePriority(key),
            resolved: resolvedItems.has(`affiliate-${key}`)
          });
        }
      });
    }
    
    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔥";
      case "medium": return "⚡";
      case "low": return "✨";
      default: return "📝";
    }
  };

  const recommendationsList = parseRecommendations();
  const groupedRecommendations = recommendationsList.reduce((acc, item) => {
    const category = getCategory(item.type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, RecommendationItem[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🚀 AI Optimization Recommendations</h3>
        <div className="flex items-center gap-4 text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullJson(!showFullJson)}
            className="h-8"
          >
            {showFullJson ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showFullJson ? "Hide Full JSON" : "Show Full JSON"}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-green-600">{resolvedItems.size} Applied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-red-600">{rejectedItems.size} Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-muted-foreground">{recommendationsList.length - resolvedItems.size - rejectedItems.size} Pending</span>
          </div>
        </div>
      </div>

      {showFullJson && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="h-4 w-4" />
              Full JSON Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
              {JSON.stringify(recommendations, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedRecommendations).map(([category, items]) => (
        <Card key={category} className="border-border">
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection(category)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
                <span className="text-sm font-normal text-muted-foreground">
                  ({items.filter(item => resolvedItems.has(item.id)).length}/{items.length})
                </span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {expandedSections[category] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          {expandedSections[category] && (
            <CardContent className="pt-0 space-y-3">
              {items.map((item) => {
                const isResolved = resolvedItems.has(item.id);
                const isRejected = rejectedItems.has(item.id);
                const isPending = !isResolved && !isRejected;
                
                return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    isResolved ? 'bg-green-50 border-green-200 opacity-75' : 
                    isRejected ? 'bg-red-50 border-red-200 opacity-75' : 
                    getPriorityColor(item.priority)
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{getPriorityIcon(item.priority)}</span>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {isResolved && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {isRejected && (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="bg-white/70 rounded-lg border overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                          <span className="text-xs font-medium text-gray-600">
                            {viewMode[item.id] === "json" ? "JSON View" : "HTML View"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleContentExpansion(item.id)}
                              className="h-6 w-6 p-0"
                              title={expandedContent[item.id] ? "Collapse" : "Expand"}
                            >
                              {expandedContent[item.id] ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleViewMode(item.id)}
                              className="h-6 w-6 p-0"
                              title={viewMode[item.id] === "json" ? "Switch to HTML" : "Switch to JSON"}
                            >
                              {viewMode[item.id] === "json" ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <Code className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div 
                          className={`p-3 text-xs font-mono overflow-y-auto transition-all duration-300 ${
                            expandedContent[item.id] ? 'max-h-none' : 'max-h-64'
                          }`}
                        >
                          {viewMode[item.id] === "json" ? (
                            <pre className="whitespace-pre-wrap break-words">{formatSuggestion(item.suggestion, "json")}</pre>
                          ) : (
                            <div 
                              className="prose prose-xs max-w-none"
                              dangerouslySetInnerHTML={{ __html: formatSuggestion(item.suggestion, "html") }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleResolve(item.type, item.suggestion, item.id)}
                            disabled={resolvingItems.has(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white border-green-700"
                          >
                            {resolvingItems.has(item.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><ThumbsUp className="h-3 w-3 mr-1" /> Apply</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(item.id)}
                            disabled={resolvingItems.has(item.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <><ThumbsDown className="h-3 w-3 mr-1" /> Reject</>
                          </Button>
                        </>
                      )}
                      
                      {(isResolved || isRejected) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUndo(item.id)}
                          className="text-xs"
                        >
                          <><Circle className="h-3 w-3 mr-1" /> Undo</>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

// Helper functions
function getSEOTitle(key: string): string {
  const titles: Record<string, string> = {
    title: "Title Optimization",
    meta_description: "Meta Description",
    headings: "Heading Structure",
    keywords: "Keyword Optimization",
    internal_links: "Internal Linking",
    readability: "Readability Improvements",
    images: "Image SEO",
    url: "URL Structure"
  };
  return titles[key] || key;
}

function getSEODescription(key: string): string {
  const descriptions: Record<string, string> = {
    title: "Improve your blog title for better SEO and click-through rates",
    meta_description: "Create an compelling meta description that attracts clicks",
    headings: "Optimize heading structure for better content hierarchy",
    keywords: "Improve keyword density and placement throughout content",
    internal_links: "Add internal links to improve site navigation and SEO",
    readability: "Enhance content readability for better user experience",
    images: "Optimize images with proper alt text and descriptions",
    url: "Improve URL structure for better SEO"
  };
  return descriptions[key] || "Optimize this aspect of your content";
}

function getSEOPriority(key: string): "high" | "medium" | "low" {
  const priorities: Record<string, "high" | "medium" | "low"> = {
    title: "high",
    meta_description: "high",
    headings: "medium",
    keywords: "high",
    internal_links: "medium",
    readability: "medium",
    images: "low",
    url: "medium"
  };
  return priorities[key] || "medium";
}

function getAffiliateTitle(key: string): string {
  const titles: Record<string, string> = {
    product_placements: "Product Placement Opportunities",
    reviews: "Product Review Sections",
    comparisons: "Comparison Tables",
    recommendations: "Best of Lists",
    ctas: "Call-to-Action Phrases",
    disclosures: "Disclosure Statements",
    benefits: "Product Benefits",
    buying_guide: "Buying Guide Sections"
  };
  return titles[key] || key;
}

function getAffiliateDescription(key: string): string {
  const descriptions: Record<string, string> = {
    product_placements: "Add natural product placements within your content",
    reviews: "Create detailed product review sections with affiliate links",
    comparisons: "Add comparison tables to help readers make decisions",
    recommendations: "Create 'best of' lists with affiliate links",
    ctas: "Add compelling call-to-action phrases for conversions",
    disclosures: "Add FTC-compliant disclosure statements",
    benefits: "Highlight product benefits to drive conversions",
    buying_guide: "Create comprehensive buying guide sections"
  };
  return descriptions[key] || "Add this affiliate content to your blog";
}

function getAffiliatePriority(key: string): "high" | "medium" | "low" {
  const priorities: Record<string, "high" | "medium" | "low"> = {
    product_placements: "high",
    reviews: "high",
    comparisons: "medium",
    recommendations: "high",
    ctas: "medium",
    disclosures: "high",
    benefits: "medium",
    buying_guide: "medium"
  };
  return priorities[key] || "medium";
}

function getCategory(type: string): string {
  const categories: Record<string, string> = {
    // SEO Categories
    title: "Content Optimization",
    meta_description: "Meta Information",
    headings: "Content Structure",
    keywords: "SEO Keywords",
    internal_links: "Linking Strategy",
    readability: "Content Quality",
    images: "Media Optimization",
    url: "Technical SEO",
    // Affiliate Categories
    product_placements: "Product Integration",
    reviews: "Review Content",
    comparisons: "Comparison Content",
    recommendations: "Recommendation Lists",
    ctas: "Conversion Elements",
    disclosures: "Legal Compliance",
    benefits: "Value Proposition",
    buying_guide: "Educational Content"
  };
  return categories[type] || "General";
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    "Content Optimization": "📝",
    "Meta Information": "🏷️",
    "Content Structure": "🏗️",
    "SEO Keywords": "🔍",
    "Linking Strategy": "🔗",
    "Content Quality": "✨",
    "Media Optimization": "🖼️",
    "Technical SEO": "⚙️",
    "Product Integration": "🛍️",
    "Review Content": "⭐",
    "Comparison Content": "⚖️",
    "Recommendation Lists": "🏆",
    "Conversion Elements": "🎯",
    "Legal Compliance": "⚖️",
    "Value Proposition": "💎",
    "Educational Content": "📚",
    "General": "📋"
  };
  return icons[category] || "📋";
}
