"use client";

import { useState } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/admin/_components/ui/card";
import { Loader2, Globe, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ExtractedContent {
  title: string;
  description: string;
  content: string;
  url: string;
  keywords: string[];
  headings: string[];
}

interface URLContentExtractorProps {
  onContentExtracted: (content: ExtractedContent) => void;
  onFormFill: (content: ExtractedContent) => void;
}

export function URLContentExtractor({ onContentExtracted, onFormFill }: URLContentExtractorProps) {
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  // Validate URL for news articles and blog posts
  function isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      const validPatterns = [
        /\/blog\//i,
        /\/news\//i,
        /\/article\//i,
        /\/post\//i,
        /\/story\//i,
        /blog\./i,
        /news\./i,
        /medium\.com/i,
        /substack\.com/i,
        /wordpress\.org/i,
        /blogger\.com/i
      ];
      
      return validPatterns.some(pattern => pattern.test(url.pathname) || pattern.test(url.hostname));
    } catch {
      return false;
    }
  }

  async function extractContent() {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      toast.error("Please enter a valid news article or blog post URL");
      return;
    }

    setIsExtracting(true);
    setError("");

    try {
      let data;
      
      // Try server-side scraping first
      try {
        const response = await fetch("/admin/api/blog/scrape-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error(`Server scraping failed: ${response.status}`);
        }
        
        data = await response.json();
      } catch (serverError) {
        console.log("Server-side scraping failed, trying client-side:", serverError);
        
        // Fallback to client-side scraping
        const fallbackResponse = await fetch("/admin/api/blog/scrape-url/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        
        if (!fallbackResponse.ok) {
          throw new Error("Both server and client-side scraping failed");
        }
        
        data = await fallbackResponse.json();
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const extracted: ExtractedContent = {
        title: data.title || "",
        description: data.description || "",
        content: data.content || "",
        url: url,
        keywords: data.keywords || [],
        headings: data.headings || []
      };

      setExtractedContent(extracted);
      onContentExtracted(extracted);
      setShowPreview(true);
      toast.success("Content extracted successfully!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to extract content";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  }

  function handleFormFill() {
    if (extractedContent) {
      onFormFill(extractedContent);
      toast.success("Form filled with extracted content!");
    }
  }

  function handleReset() {
    setUrl("");
    setExtractedContent(null);
    setShowPreview(false);
    setError("");
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Extract Content from URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter news article or blog post URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={extractContent}
            disabled={isExtracting || !url.trim()}
            className="min-w-[120px]"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract"
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {extractedContent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Content extracted successfully</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={handleFormFill}>
                  Fill Form with AI Content
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Clear
                </Button>
              </div>
            </div>

            {showPreview && (
              <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Title:</h4>
                  <p className="text-sm">{extractedContent.title}</p>
                </div>
                
                {extractedContent.description && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Description:</h4>
                    <p className="text-sm">{extractedContent.description}</p>
                  </div>
                )}

                {extractedContent.keywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Keywords:</h4>
                    <div className="flex flex-wrap gap-1">
                      {extractedContent.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {extractedContent.headings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Headings:</h4>
                    <ul className="text-sm space-y-1">
                      {extractedContent.headings.slice(0, 5).map((heading, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary/50 rounded-full"></span>
                          {heading}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-1">Content Preview:</h4>
                  <p className="text-sm line-clamp-3">{extractedContent.content}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
