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
  images: Array<{
    src: string;
    alt: string;
    title: string;
  }>;
  author: string;
  publishDate: string;
  wordCount: number;
  readTime: number;
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

  // Simple URL validation - just check if it's a valid URL format
  function isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
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
      toast.error("Please enter a valid URL");
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
        headings: data.headings || [],
        images: data.images || [],
        author: data.author || "",
        publishDate: data.publishDate || "",
        wordCount: data.wordCount || 0,
        readTime: data.readTime || 0
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
            placeholder="Enter any URL to extract content..."
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
              <div className="border rounded-lg p-4 bg-muted/50 space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Title:</h4>
                  <p className="text-sm">{extractedContent.title}</p>
                </div>
                
                {(extractedContent.author || extractedContent.publishDate) && (
                  <div className="flex flex-wrap gap-4 text-sm text-muted">
                    {extractedContent.author && (
                      <div>
                        <span className="font-medium">Author:</span> {extractedContent.author}
                      </div>
                    )}
                    {extractedContent.publishDate && (
                      <div>
                        <span className="font-medium">Published:</span> {new Date(extractedContent.publishDate).toLocaleDateString()}
                      </div>
                    )}
                    {extractedContent.wordCount > 0 && (
                      <div>
                        <span className="font-medium">Words:</span> {extractedContent.wordCount.toLocaleString()}
                      </div>
                    )}
                    {extractedContent.readTime > 0 && (
                      <div>
                        <span className="font-medium">Read time:</span> {extractedContent.readTime} min
                      </div>
                    )}
                  </div>
                )}
                
                {extractedContent.description && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Description:</h4>
                    <p className="text-sm">{extractedContent.description}</p>
                  </div>
                )}

                {extractedContent.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Images ({extractedContent.images.length}):</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {extractedContent.images.map((image, index) => (
                        <div key={index} className="border rounded overflow-hidden">
                          <img 
                            src={image.src} 
                            alt={image.alt}
                            title={image.title}
                            className="w-full h-24 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {image.alt && (
                            <p className="text-xs p-1 truncate">{image.alt}</p>
                          )}
                        </div>
                      ))}
                    </div>
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
                    <h4 className="font-semibold text-sm mb-1">Headings ({extractedContent.headings.length}):</h4>
                    <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                      {extractedContent.headings.map((heading, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary/50 rounded-full"></span>
                          {heading}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-1">Content ({extractedContent.content.length} chars):</h4>
                  <div className="text-sm max-h-48 overflow-y-auto bg-background p-2 rounded border">
                    <p className="whitespace-pre-wrap">{extractedContent.content.substring(0, 1000)}</p>
                    {extractedContent.content.length > 1000 && (
                      <p className="text-muted text-xs mt-2">... and {extractedContent.content.length - 1000} more characters</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
