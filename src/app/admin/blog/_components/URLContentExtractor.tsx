"use client";

import { useState } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/admin/_components/ui/card";
import { Loader2, Globe, AlertCircle, CheckCircle, Eye, EyeOff, Download, Image as ImageIcon } from "lucide-react";
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
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [imageMetadata, setImageMetadata] = useState<Map<number, { alt: string; title: string }>>(new Map());
  const [isDownloading, setIsDownloading] = useState(false);

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
      
      // Initialize image metadata
      const metadata = new Map<number, { alt: string; title: string }>();
      extracted.images.forEach((img, idx) => {
        metadata.set(idx, { alt: img.alt || '', title: img.title || '' });
      });
      setImageMetadata(metadata);
      setSelectedImages(new Set());
      
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
    setSelectedImages(new Set());
    setImageMetadata(new Map());
  }

  function toggleImageSelection(index: number) {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedImages(newSelected);
  }

  function selectAllImages() {
    if (!extractedContent) return;
    const allIndices = new Set(extractedContent.images.map((_, idx) => idx));
    setSelectedImages(allIndices);
  }

  function deselectAllImages() {
    setSelectedImages(new Set());
  }

  function updateImageMetadata(index: number, field: 'alt' | 'title', value: string) {
    const newMetadata = new Map(imageMetadata);
    const current = newMetadata.get(index) || { alt: '', title: '' };
    newMetadata.set(index, { ...current, [field]: value });
    setImageMetadata(newMetadata);
  }

  async function downloadSelectedImages() {
    if (!extractedContent || selectedImages.size === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setIsDownloading(true);
    setError("");

    try {
      const imagesToDownload = Array.from(selectedImages).map(idx => {
        const image = extractedContent.images[idx];
        const metadata = imageMetadata.get(idx) || { alt: image.alt, title: image.title };
        return {
          src: image.src,
          alt: metadata.alt,
          title: metadata.title
        };
      });

      const response = await fetch("/admin/api/blog/download-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: imagesToDownload,
          blogTitle: extractedContent.title
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download images");
      }

      const result = await response.json();
      toast.success(`Successfully downloaded ${result.downloaded.length} image(s)`);
      
      // Show uploaded paths
      if (result.downloaded.length > 0) {
        console.log("Uploaded images:", result.downloaded);
      }
      
      setSelectedImages(new Set());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to download images";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
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
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Images ({extractedContent.images.length})
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllImages}
                          disabled={selectedImages.size === extractedContent.images.length}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllImages}
                          disabled={selectedImages.size === 0}
                        >
                          Deselect All
                        </Button>
                        <Button
                          size="sm"
                          onClick={downloadSelectedImages}
                          disabled={selectedImages.size === 0 || isDownloading}
                          className="gap-2"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download Selected ({selectedImages.size})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {extractedContent.images.map((image, index) => {
                        const metadata = imageMetadata.get(index) || { alt: image.alt, title: image.title };
                        const isSelected = selectedImages.has(index);
                        
                        return (
                          <div
                            key={index}
                            className={`border rounded-lg p-3 transition-colors ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="flex items-start pt-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleImageSelection(index)}
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                              </div>
                              <div className="flex-shrink-0">
                                <img
                                  src={image.src}
                                  alt={metadata.alt}
                                  className="w-24 h-24 object-cover rounded border"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-image.png';
                                  }}
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Alt Text</label>
                                  <Input
                                    value={metadata.alt}
                                    onChange={(e) => updateImageMetadata(index, 'alt', e.target.value)}
                                    placeholder="Enter alt text for SEO"
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Title (Optional)</label>
                                  <Input
                                    value={metadata.title}
                                    onChange={(e) => updateImageMetadata(index, 'title', e.target.value)}
                                    placeholder="Enter title attribute"
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {image.src}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                  <div className="text-sm max-h-96 overflow-y-auto bg-white p-4 rounded border prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: extractedContent.content }} />
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
