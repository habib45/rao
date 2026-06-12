"use client";

import { useState } from "react";
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/app/admin/_components/ui/badge";
import { Button } from "@/app/admin/_components/ui/button";
import { toast } from "sonner";
import type { BlogPost } from "@/types/domain";

interface SEOScoreDisplayProps {
  post: BlogPost;
  onUpdate: any; // Mutation object from react-query
}

export function SEOScoreDisplay({ post, onUpdate }: SEOScoreDisplayProps) {
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateSEOScore = (): number => {
    const titleEn = post.title?.en ?? "";
    const description = post.meta_description?.en ?? "";
    const content = post.content ?? "";
    const keywords = post.blog_post_tags?.map(tag => tag.blog_tags.name?.en).filter(Boolean).join(', ') ?? "";

    let score = 0;
    let factors = 0;

    // Title length (30-60 chars optimal) - 20 points
    if (titleEn.length >= 30 && titleEn.length <= 60) {
      score += 20;
    } else if (titleEn.length > 0) {
      score += 10; // Partial credit for having a title
    }
    factors++;

    // Description length (120-160 chars optimal) - 20 points
    if (description.length >= 120 && description.length <= 160) {
      score += 20;
    } else if (description.length >= 50) {
      score += 10; // Partial credit
    }
    factors++;

    // Content length (minimum 300 words) - 15 points
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount >= 300) {
      score += 15;
    } else if (wordCount >= 150) {
      score += 8;
    } else if (wordCount >= 50) {
      score += 4;
    }
    factors++;

    // Keywords presence - 15 points
    const keywordCount = keywords.split(',').filter(k => k.trim().length > 0).length;
    if (keywordCount >= 3) {
      score += 15;
    } else if (keywordCount >= 1) {
      score += 8;
    }
    factors++;

    // Has featured image - 10 points
    if (post.cover_image_url) {
      score += 10;
    }
    factors++;

    // Has category - 10 points
    if (post.blog_category_id && post.blog_categories) {
      score += 10;
    }
    factors++;

    // Meta title presence - 10 points
    const metaTitle = post.meta_title?.en ?? "";
    if (metaTitle.length > 0) {
      score += 10;
    }
    factors++;

    return Math.round(score);
  };

  const handleRecalculateScore = async () => {
    setIsCalculating(true);
    
    try {
      const newScore = calculateSEOScore();
      
      // Update the SEO score via API
      await onUpdate.mutateAsync({
        id: post.id,
        payload: { overall_seo_score: newScore }
      });
      
      toast.success(`SEO Score updated to ${newScore}`);
    } catch (error) {
      toast.error("Failed to update SEO score");
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate real-time SEO score if database value is not available
  const realTimeScore = calculateSEOScore();
  const score = post.overall_seo_score ?? realTimeScore;
  
  const getScoreVariant = (score: number): "default" | "success" | "warning" | "error" => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-3 w-3" />;
    if (score >= 60) return <TrendingUp className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {getScoreIcon(score)}
        <Badge variant={getScoreVariant(score)} className="font-medium">
          {score}%
        </Badge>
        {!post.overall_seo_score && (
          <span className="text-xs text-muted" title="Real-time calculated score">
            *
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRecalculateScore}
        disabled={isCalculating || onUpdate.isPending}
        className="h-6 w-6 p-0"
        title={post.overall_seo_score ? "Recalculate SEO score" : "Save SEO score to database"}
      >
        <RefreshCw className={`h-3 w-3 ${isCalculating ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
