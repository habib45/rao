"use client";

import { useState } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/admin/_components/ui/card";
import { Badge } from "@/app/admin/_components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Share2, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Target,
  Zap,
  Globe,
  DollarSign,
  ShoppingCart,
  Link2,
  Star
} from "lucide-react";

interface SEOScore {
  overall: number;
  title: number;
  meta: number;
  content: number;
  readability: number;
  affiliate: number;
}

interface SEORecommendation {
  type: "critical" | "warning" | "info" | "success";
  category: "seo" | "readability" | "affiliate" | "google_ranking";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  action?: string;
}

interface AffiliateOpportunity {
  type: "product" | "service" | "comparison";
  keyword: string;
  searchVolume: "high" | "medium" | "low";
  competition: "high" | "medium" | "low";
  potential: number;
  suggestedProducts: string[];
}

interface SEOOptimizerProps {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  category: string;
  onOptimizationApplied: (optimizations: any) => void;
}

export function SEOOptimizer({ 
  title, 
  content, 
  metaTitle, 
  metaDescription, 
  tags, 
  category,
  onOptimizationApplied 
}: SEOOptimizerProps) {
  const [score, setScore] = useState<SEOScore>({
    overall: 0,
    title: 0,
    meta: 0,
    content: 0,
    readability: 0,
    affiliate: 0
  });
  const [recommendations, setRecommendations] = useState<SEORecommendation[]>([]);
  const [affiliateOpportunities, setAffiliateOpportunities] = useState<AffiliateOpportunity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSEO = async () => {
    setIsAnalyzing(true);
    
    // Simulate SEO analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate SEO scores
    const titleScore = calculateTitleScore(title, metaTitle);
    const metaScore = calculateMetaScore(metaTitle, metaDescription);
    const contentScore = calculateContentScore(content, tags);
    const readabilityScore = calculateReadabilityScore(content);
    const affiliateScore = calculateAffiliateScore(content, category);
    
    const overall = Math.round((titleScore + metaScore + contentScore + readabilityScore + affiliateScore) / 5);
    
    setScore({
      overall,
      title: titleScore,
      meta: metaScore,
      content: contentScore,
      readability: readabilityScore,
      affiliate: affiliateScore
    });

    // Generate recommendations
    const newRecommendations = generateRecommendations({
      title,
      metaTitle,
      metaDescription,
      content,
      tags,
      category,
      scores: { title: titleScore, meta: metaScore, content: contentScore, readability: readabilityScore, affiliate: affiliateScore }
    });

    setRecommendations(newRecommendations);

    // Generate affiliate opportunities
    const opportunities = generateAffiliateOpportunities(content, category, tags);
    setAffiliateOpportunities(opportunities);

    setIsAnalyzing(false);
  };

  const calculateTitleScore = (title: string, metaTitle: string): number => {
    let score = 0;
    
    // Title length (30-60 characters optimal)
    if (title.length >= 30 && title.length <= 60) score += 25;
    else if (title.length >= 20 && title.length <= 70) score += 15;
    
    // Meta title length (50-60 characters optimal)
    if (metaTitle.length >= 50 && metaTitle.length <= 60) score += 25;
    else if (metaTitle.length >= 40 && metaTitle.length <= 70) score += 15;
    
    // Contains keywords
    if (title.toLowerCase().includes("best") || title.toLowerCase().includes("review") || title.toLowerCase().includes("guide")) score += 20;
    
    // Numbers in title (increase CTR)
    if (/\d{4}/.test(title)) score += 15;
    
    // No stop words at beginning
    const stopWords = ["the", "a", "an", "and", "or", "but"];
    const firstWord = title.split(" ")[0].toLowerCase();
    if (!stopWords.includes(firstWord)) score += 15;
    
    return Math.min(score, 100);
  };

  const calculateMetaScore = (metaTitle: string, metaDescription: string): number => {
    let score = 0;
    
    // Meta description length (150-160 characters optimal)
    if (metaDescription.length >= 150 && metaDescription.length <= 160) score += 40;
    else if (metaDescription.length >= 140 && metaDescription.length <= 170) score += 25;
    
    // Contains call to action
    const ctaWords = ["buy", "shop", "discover", "find", "learn", "get", "explore"];
    if (ctaWords.some(word => metaDescription.toLowerCase().includes(word))) score += 20;
    
    // Contains keywords
    if (metaDescription.toLowerCase().includes(metaTitle.toLowerCase().split(" ")[0])) score += 20;
    
    // Unique value proposition
    if (metaDescription.toLowerCase().includes("2024") || metaDescription.toLowerCase().includes("latest")) score += 20;
    
    return Math.min(score, 100);
  };

  const calculateContentScore = (content: string, tags: string[]): number => {
    let score = 0;
    
    // Content length (1000+ words optimal for SEO)
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 1000) score += 30;
    else if (wordCount >= 500) score += 20;
    else if (wordCount >= 300) score += 10;
    
    // Heading structure
    const headings = content.match(/^#{1,6}\s/gm) || [];
    if (headings.length >= 3) score += 20;
    else if (headings.length >= 1) score += 10;
    
    // Internal links (simulated)
    if (content.includes("[")) score += 15; // Assuming markdown links
    
    // Keyword density
    const keywords = tags.join(" ").toLowerCase();
    const contentLower = content.toLowerCase();
    const keywordCount = keywords.split(" ").filter(word => contentLower.includes(word)).length;
    if (keywordCount >= 5) score += 15;
    else if (keywordCount >= 3) score += 10;
    
    // Image alt text (simulated)
    if (content.includes("![")) score += 10;
    
    return Math.min(score, 100);
  };

  const calculateReadabilityScore = (content: string): number => {
    let score = 0;
    
    // Sentence length (average 15-20 words optimal)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgSentenceLength >= 15 && avgSentenceLength <= 20) score += 30;
    else if (avgSentenceLength >= 12 && avgSentenceLength <= 25) score += 20;
    
    // Paragraph length (2-4 sentences optimal)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const avgParagraphLength = paragraphs.reduce((acc, p) => acc + p.split(/[.!?]+/).length, 0) / paragraphs.length;
    
    if (avgParagraphLength >= 2 && avgParagraphLength <= 4) score += 30;
    else if (avgParagraphLength >= 1 && avgParagraphLength <= 6) score += 20;
    
    // Use of transition words
    const transitions = ["however", "therefore", "moreover", "furthermore", "additionally", "consequently"];
    const transitionCount = transitions.filter(word => content.toLowerCase().includes(word)).length;
    if (transitionCount >= 3) score += 20;
    else if (transitionCount >= 1) score += 10;
    
    // Active voice (simplified check)
    const passiveIndicators = ["is", "are", "was", "were", "been", "being"];
    const passiveCount = passiveIndicators.filter(word => {
      const regex = new RegExp(`\\b${word}\\s+\\w+\\s+by`, "gi");
      return content.match(regex);
    }).length;
    
    if (passiveCount <= 2) score += 20;
    else if (passiveCount <= 4) score += 10;
    
    return Math.min(score, 100);
  };

  const calculateAffiliateScore = (content: string, category: string): number => {
    let score = 0;
    
    // Product mentions
    const productIndicators = ["best", "top", "review", "recommend", "buy", "price", "deal"];
    const productCount = productIndicators.filter(word => content.toLowerCase().includes(word)).length;
    if (productCount >= 5) score += 25;
    else if (productCount >= 3) score += 15;
    
    // Price comparisons
    if (content.toLowerCase().includes("$") || content.toLowerCase().includes("price")) score += 20;
    
    // Buying guides elements
    const buyingGuideElements = ["features", "pros", "cons", "comparison", "vs", "alternative"];
    const guideCount = buyingGuideElements.filter(word => content.toLowerCase().includes(word)).length;
    if (guideCount >= 3) score += 25;
    else if (guideCount >= 1) score += 15;
    
    // Call to action for purchases
    const ctaPhrases = ["buy now", "shop now", "check price", "get deal", "purchase"];
    const ctaCount = ctaPhrases.filter(phrase => content.toLowerCase().includes(phrase)).length;
    if (ctaCount >= 2) score += 20;
    else if (ctaCount >= 1) score += 10;
    
    // Trust indicators
    const trustWords = ["guarantee", "warranty", "refund", "authentic", "official"];
    const trustCount = trustWords.filter(word => content.toLowerCase().includes(word)).length;
    if (trustCount >= 2) score += 10;
    
    return Math.min(score, 100);
  };

  const generateRecommendations = (data: any): SEORecommendation[] => {
    const recommendations: SEORecommendation[] = [];
    
    // Title recommendations
    if (data.scores.title < 70) {
      recommendations.push({
        type: "warning",
        category: "seo",
        title: "Optimize Your Title",
        description: "Your title could be more SEO-friendly. Consider adding numbers, power words, and keeping it between 30-60 characters.",
        impact: "high",
        effort: "low",
        action: "Add year (2024) and benefit-focused language"
      });
    }
    
    // Meta description recommendations
    if (data.scores.meta < 70) {
      recommendations.push({
        type: "warning",
        category: "seo",
        title: "Improve Meta Description",
        description: "Meta description should be 150-160 characters with a clear call-to-action and value proposition.",
        impact: "high",
        effort: "low",
        action: "Add CTA and ensure 150-160 character length"
      });
    }
    
    // Content recommendations
    if (data.scores.content < 70) {
      recommendations.push({
        type: "critical",
        category: "seo",
        title: "Enhance Content Structure",
        description: "Add more headings, internal links, and ensure content is at least 1000 words for better SEO performance.",
        impact: "high",
        effort: "medium",
        action: "Add H2/H3 headings and expand to 1000+ words"
      });
    }
    
    // Affiliate recommendations
    if (data.scores.affiliate < 60) {
      recommendations.push({
        type: "info",
        category: "affiliate",
        title: "Boost Affiliate Potential",
        description: "Add more product comparisons, price information, and clear calls-to-action to increase affiliate revenue.",
        impact: "medium",
        effort: "medium",
        action: "Add comparison tables and purchase CTAs"
      });
    }
    
    // Google ranking recommendations
    recommendations.push({
      type: "success",
      category: "google_ranking",
      title: "E-A-T Signals",
      description: "Demonstrate expertise, authoritativeness, and trustworthiness by adding author credentials and external sources.",
      impact: "high",
      effort: "medium",
      action: "Add author bio and cite authoritative sources"
    });
    
    return recommendations;
  };

  const generateAffiliateOpportunities = (content: string, category: string, tags: string[]): AffiliateOpportunity[] => {
    const opportunities: AffiliateOpportunity[] = [];
    
    // Analyze content for product opportunities
    if (category === "Electronics" || tags.some(tag => tag.includes("headphones") || tag.includes("wireless"))) {
      opportunities.push({
        type: "product",
        keyword: "wireless headphones",
        searchVolume: "high",
        competition: "high",
        potential: 85,
        suggestedProducts: ["Sony WH-1000XM5", "Bose QuietComfort", "Apple AirPods Max"]
      });
    }
    
    if (tags.some(tag => tag.includes("best") || tag.includes("review"))) {
      opportunities.push({
        type: "comparison",
        keyword: "best headphones 2024",
        searchVolume: "high",
        competition: "medium",
        potential: 92,
        suggestedProducts: ["Premium headphones", "Budget options", "Mid-range choices"]
      });
    }
    
    return opportunities;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO & Affiliate Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Optimize your content for maximum Google ranking and affiliate revenue potential
          </p>
          <Button onClick={analyzeSEO} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? "Analyzing..." : "Analyze SEO Performance"}
          </Button>
        </CardContent>
      </Card>

      {score.overall > 0 && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall SEO Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  <span className={getScoreColor(score.overall)}>{score.overall}</span>
                  <span className="text-lg text-gray-500">/100</span>
                </div>
                <div className="flex-1">
                  <div className={`h-3 rounded-full ${getScoreBgColor(score.overall)}`} style={{width: `${score.overall}%`}}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(score.title)}`}>{score.title}</div>
                  <div className="text-sm text-gray-500">Title</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(score.meta)}`}>{score.meta}</div>
                  <div className="text-sm text-gray-500">Meta</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(score.content)}`}>{score.content}</div>
                  <div className="text-sm text-gray-500">Content</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(score.readability)}`}>{score.readability}</div>
                  <div className="text-sm text-gray-500">Readability</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(score.affiliate)}`}>{score.affiliate}</div>
                  <div className="text-sm text-gray-500">Affiliate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(rec.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge className={getImpactColor(rec.impact)}>
                            {rec.impact} impact
                          </Badge>
                          <Badge variant="default">
                            {rec.effort} effort
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        {rec.action && (
                          <div className="text-sm font-medium text-blue-600">
                            💡 {rec.action}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Opportunities */}
          {affiliateOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Affiliate Revenue Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliateOpportunities.map((opp, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold capitalize">{opp.keyword}</h4>
                          <Badge variant="default">{opp.type}</Badge>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {opp.potential}% potential
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>🔍 {opp.searchVolume} search volume</span>
                        <span>⚔️ {opp.competition} competition</span>
                      </div>
                      <div className="text-sm">
                        <strong>Suggested products:</strong> {opp.suggestedProducts.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Google Ranking Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Google Ranking Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    E-A-T Signals
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Add author credentials and bio
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Cite authoritative sources
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Include expert quotes or studies
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Show publication date and updates
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    Performance Factors
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Eye className="h-3 w-3 text-blue-500" />
                      Optimize for featured snippets
                    </li>
                    <li className="flex items-center gap-2">
                      <MousePointer className="h-3 w-3 text-blue-500" />
                      Improve click-through rate
                    </li>
                    <li className="flex items-center gap-2">
                      <Share2 className="h-3 w-3 text-blue-500" />
                      Add social sharing elements
                    </li>
                    <li className="flex items-center gap-2">
                      <Link2 className="h-3 w-3 text-blue-500" />
                      Build internal linking structure
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
