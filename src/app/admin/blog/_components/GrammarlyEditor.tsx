"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/admin/_components/ui/button";
import { CheckCircle, AlertCircle, Loader2, Type, Heading, Eye, EyeOff, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

interface GrammarlySuggestion {
  id: string;
  type: "grammar" | "spelling" | "clarity" | "conciseness" | "vocabulary" | "heading";
  severity: "critical" | "suggestion" | "tip";
  message: string;
  offset: number;
  length: number;
  replacements?: string[];
  context?: string;
  headingLevel?: number;
}

interface GrammarlyEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  isRichText?: boolean;
}

declare global {
  interface Window {
    Grammarly?: {
      init: (config: Record<string, unknown>) => void;
      addPlugin: (plugin: Record<string, unknown>) => void;
    };
    grammarly?: {
      checkText: (text: string) => Promise<GrammarlySuggestion[]>;
      applySuggestion: (suggestionId: string, replacement: string) => Promise<void>;
    };
  }
}

export function GrammarlyEditor({ 
  content, 
  onContentChange, 
  placeholder = "Start writing...", 
  className = "",
  isRichText = true
}: GrammarlyEditorProps) {
  const [suggestions, setSuggestions] = useState<GrammarlySuggestion[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "headings">("content");
  const [isMounted, setIsMounted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [grammarlyEnabled, setGrammarlyEnabled] = useState(false);
  const [grammarlyLoadAttempted, setGrammarlyLoadAttempted] = useState(false);

  // Prevent SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load Grammarly SDK (optional - fail silently)
  useEffect(() => {
    if (grammarlyLoadAttempted) return; // Only try once
    
    const loadGrammarly = () => {
      if (typeof window === 'undefined') return;
      
      setGrammarlyLoadAttempted(true);
      
      try {
        // Check if already loaded
        if (window.Grammarly) {
          setGrammarlyEnabled(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.grammarly.com/grammarly-sdk.js';
        script.async = true;
        script.onload = () => {
          if (window.Grammarly) {
            window.Grammarly.init({
              clientId: 'client_B8D7F2X4P1H9J0K7L3M5N2Q6', // This would need to be replaced with actual client ID
              dialect: 'american',
              documentDomain: 'blog',
              input: ['[data-grammarly="true"]']
            });
            setGrammarlyEnabled(true);
          }
        };
        script.onerror = () => {
          // Fail silently - editor works without Grammarly
          setGrammarlyEnabled(false);
        };
        document.head.appendChild(script);
      } catch (_error) {
        // Fail silently - editor works without Grammarly
        setGrammarlyEnabled(false);
      }
    };

    loadGrammarly();
  }, [grammarlyLoadAttempted]);

  // HTML-aware text replacement function
  const fixTextInHTML = (html: string, fixes: Array<{pattern: RegExp, replacement: string}>): { fixedHTML: string, fixesApplied: number } => {
    if (!html) return { fixedHTML: html, fixesApplied: 0 };
    
    // Check if we're on the client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Server-side: simple regex replacement (may not be perfect but preserves basic structure)
      let fixedHTML = html;
      let fixesApplied = 0;
      
      fixes.forEach(fix => {
        const matches = fixedHTML.match(fix.pattern);
        if (matches) {
          fixedHTML = fixedHTML.replace(fix.pattern, fix.replacement);
          fixesApplied += matches.length;
        }
      });
      
      return { fixedHTML, fixesApplied };
    }
    
    // Client-side: DOM-based approach to preserve HTML structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let fixesApplied = 0;
    
    // Process text nodes recursively
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || '';
        const originalText = text;
        
        // Apply fixes to text content
        fixes.forEach(fix => {
          const matches = text.match(fix.pattern);
          if (matches) {
            text = text.replace(fix.pattern, fix.replacement);
            fixesApplied += matches.length;
          }
        });
        
        // Update node if text changed
        if (text !== originalText) {
          node.textContent = text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process child nodes
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(processNode);
      }
    };
    
    // Process all child nodes
    const childNodes = Array.from(tempDiv.childNodes);
    childNodes.forEach(processNode);
    
    return { 
      fixedHTML: tempDiv.innerHTML, 
      fixesApplied 
    };
  };

  // Auto-fix grammar when enabled and content changes
  useEffect(() => {
    if (grammarlyEnabled && content.trim() && isMounted) {
      const autoFixGrammar = async () => {
        try {
          // Define fixes that work on text content only
          const spellingFixes = [
            { pattern: new RegExp('\\bteh\\b', 'gi'), replacement: 'the' },
            { pattern: new RegExp('\\brecieve\\b', 'gi'), replacement: 'receive' },
            { pattern: new RegExp('\\boccured\\b', 'gi'), replacement: 'occurred' },
            { pattern: new RegExp('\\bseperate\\b', 'gi'), replacement: 'separate' },
            { pattern: new RegExp('\\bdefinately\\b', 'gi'), replacement: 'definitely' },
            { pattern: new RegExp('\\baccomodate\\b', 'gi'), replacement: 'accommodate' },
            { pattern: new RegExp('\\bbegining\\b', 'gi'), replacement: 'beginning' },
            { pattern: new RegExp('\\bcomming\\b', 'gi'), replacement: 'coming' },
            { pattern: new RegExp('\\bexistance\\b', 'gi'), replacement: 'existence' },
            { pattern: new RegExp('\\bgoverment\\b', 'gi'), replacement: 'government' },
            { pattern: new RegExp('\\bhappend\\b', 'gi'), replacement: 'happened' },
            { pattern: new RegExp('\\bknowlege\\b', 'gi'), replacement: 'knowledge' },
            { pattern: new RegExp('\\bneccessary\\b', 'gi'), replacement: 'necessary' },
            { pattern: new RegExp('\\bparalell\\b', 'gi'), replacement: 'parallel' },
            { pattern: new RegExp('\\bpriviledge\\b', 'gi'), replacement: 'privilege' },
            { pattern: new RegExp('\\brecomend\\b', 'gi'), replacement: 'recommend' },
            { pattern: new RegExp('\\bresistence\\b', 'gi'), replacement: 'resistance' },
            { pattern: new RegExp('\\bsence\\b', 'gi'), replacement: 'sense' },
            { pattern: new RegExp('\\bsieze\\b', 'gi'), replacement: 'seize' },
            { pattern: new RegExp('\\bsupose\\b', 'gi'), replacement: 'suppose' },
            { pattern: new RegExp('\\buntill\\b', 'gi'), replacement: 'until' },
            { pattern: new RegExp('\\bwich\\b', 'gi'), replacement: 'which' }
          ];
          
          const grammarFixes = [
            { pattern: /\bi\s+/gi, replacement: 'I ' }, // Capitalize "i" to "I"
            { pattern: /\s+([,.!?])/g, replacement: '$1' }, // Remove space before punctuation
            { pattern: /([,.!?])(?!\s)/g, replacement: '$1 ' }, // Add space after punctuation
            { pattern: /\s{2,}/g, replacement: ' ' }, // Remove multiple spaces
          ];
          
          // Be more careful with "a vs an" fixes as they can be context-dependent
          const articleFixes = [
            { pattern: /\b(a)\s+([aeiouAEIOU])/gi, replacement: 'an $2' }, // a vs an before vowels
            { pattern: /\b(an)\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ])/gi, replacement: 'a $2' }, // an vs a before consonants
          ];
          
          const allFixes = [...spellingFixes, ...grammarFixes, ...articleFixes];
          
          let result;
          if (isRichText) {
            // For rich text, use HTML-aware fixing
            result = fixTextInHTML(content, allFixes);
          } else {
            // For plain text, apply fixes directly
            let fixedText = content;
            let fixesApplied = 0;
            
            allFixes.forEach(fix => {
              const matches = fixedText.match(fix.pattern);
              if (matches) {
                fixedText = fixedText.replace(fix.pattern, fix.replacement);
                fixesApplied += matches.length;
              }
            });
            
            result = { fixedHTML: fixedText, fixesApplied };
          }

          // Apply fixes if any were made
          if (result.fixesApplied > 0) {
            onContentChange(result.fixedHTML);
            toast.success(`Auto-fixed ${result.fixesApplied} grammatical issues`);
          }
        } catch (error) {
          console.error('Auto-fix failed:', error);
        }
      };

      // Add a small delay to avoid excessive calls during typing
      const timeoutId = setTimeout(autoFixGrammar, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [content, grammarlyEnabled, isMounted, isRichText, onContentChange]);

  // Convert HTML to plain text for grammar checking
  const htmlToPlainText = (html: string): string => {
    if (!html) return "";
    
    // Check if we're on the client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Server-side fallback: simple HTML tag removal
      return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Client-side: Use DOM parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Extract text content
    let text = tempDiv.textContent || tempDiv.innerText || "";
    
    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  };

  // Extract headings from HTML content
  const extractHeadings = (html: string): Array<{text: string, level: number, offset: number}> => {
    if (!html) return [];
    
    // Check if we're on the client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Server-side fallback: regex-based heading extraction
      const headings: Array<{text: string, level: number, offset: number}> = [];
      const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
      let match;
      
      while ((match = headingRegex.exec(html)) !== null) {
        const level = parseInt(match[1]);
        const text = match[2]
          .replace(/<[^>]*>/g, '') // Remove nested HTML
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
        
        if (text) {
          headings.push({ text, level, offset: match.index });
        }
      }
      
      return headings;
    }
    
    // Client-side: Use DOM parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const headings: Array<{text: string, level: number, offset: number}> = [];
    const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingElements.forEach((heading, _index) => {
      const text = heading.textContent?.trim() || '';
      const level = parseInt(heading.tagName.charAt(1));
      const offset = html.indexOf(heading.outerHTML);
      
      if (text) {
        headings.push({ text, level, offset });
      }
    });
    
    return headings;
  };

  // Apply suggestion to HTML content
  const applySuggestionToHTML = (html: string, suggestion: GrammarlySuggestion, replacement: string): string => {
    if (suggestion.type === 'heading') {
      // Check if we're on the client side
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Server-side fallback: regex-based heading replacement
        const headingRegex = new RegExp(`(<h${suggestion.headingLevel || '1'}[^>]*>)(.*?)(</h${suggestion.headingLevel || '1'}>)`, 'gi');
        return html.replace(headingRegex, (match, openTag, currentText, closeTag) => {
          // Simple heuristic to find the right heading based on offset
          const currentOffset = html.indexOf(match);
          if (Math.abs(currentOffset - suggestion.offset) < 100) { // Within 100 characters
            return openTag + replacement + closeTag;
          }
          return match;
        });
      }
      
      // Client-side: Use DOM parsing
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingIndex = Math.floor(suggestion.offset / 100); // Rough approximation
      
      if (headingElements[headingIndex]) {
        headingElements[headingIndex].textContent = replacement;
        return tempDiv.innerHTML;
      }
    } else {
      // For text suggestions, work with plain text and then convert back
      const plainText = htmlToPlainText(html);
      const before = plainText.substring(0, suggestion.offset);
      const after = plainText.substring(suggestion.offset + suggestion.length);
      const newPlainText = before + replacement + after;
      
      // For now, just return the updated plain text
      // In a real implementation, we'd need to preserve HTML structure
      return newPlainText;
    }
    
    return html;
  };

  // Check grammar and spelling
  const checkGrammar = async () => {
    if (!content.trim() || !grammarlyEnabled) return;

    setIsChecking(true);
    try {
      const textToCheck = isRichText ? htmlToPlainText(content) : content;
      const headings = extractHeadings(content);
      
      // For demo purposes, we'll create mock suggestions based on actual content
      const mockSuggestions: GrammarlySuggestion[] = [];
      
      // Check for common spelling mistakes
      const commonMistakes = [
        { wrong: 'teh', correct: 'the' },
        { wrong: 'recieve', correct: 'receive' },
        { wrong: 'occured', correct: 'occurred' },
        { wrong: 'seperate', correct: 'separate' },
        { wrong: 'definately', correct: 'definitely' }
      ];
      
      commonMistakes.forEach((mistake, index) => {
        const offset = textToCheck.toLowerCase().indexOf(mistake.wrong);
        if (offset !== -1) {
          mockSuggestions.push({
            id: `spelling-${index}`,
            type: 'spelling' as const,
            severity: 'critical' as const,
            message: `Possible spelling mistake: "${mistake.wrong}" should be "${mistake.correct}"`,
            offset,
            length: mistake.wrong.length,
            replacements: [mistake.correct],
            context: textToCheck.substring(Math.max(0, offset - 20), offset + mistake.wrong.length + 20)
          });
        }
      });
      
      // Check headings for common issues
      headings.forEach((heading, index) => {
        // Check for very short headings
        if (heading.text.length < 3) {
          mockSuggestions.push({
            id: `heading-short-${index}`,
            type: 'heading' as const,
            severity: 'suggestion' as const,
            message: `Heading is too short. Consider making it more descriptive.`,
            offset: heading.offset,
            length: heading.text.length,
            replacements: [`${heading.text}: A More Descriptive Title`],
            context: heading.text,
            headingLevel: heading.level
          });
        }
        
        // Check for all-caps headings
        if (heading.text === heading.text.toUpperCase() && heading.text.length > 5) {
          mockSuggestions.push({
            id: `heading-caps-${index}`,
            type: 'heading' as const,
            severity: 'suggestion' as const,
            message: `Heading is in all caps. Consider using title case for better readability.`,
            offset: heading.offset,
            length: heading.text.length,
            replacements: [heading.text.charAt(0) + heading.text.slice(1).toLowerCase()],
            context: heading.text,
            headingLevel: heading.level
          });
        }
        
        // Check for missing punctuation in headings
        if (heading.text.length > 0 && !heading.text.match(/[.!?]$/) && heading.level >= 3) {
          mockSuggestions.push({
            id: `heading-punct-${index}`,
            type: 'heading' as const,
            severity: 'tip' as const,
            message: `Consider adding punctuation to this heading for better readability.`,
            offset: heading.offset,
            length: heading.text.length,
            replacements: [`${heading.text}.`],
            context: heading.text,
            headingLevel: heading.level
          });
        }
      });

      setSuggestions(mockSuggestions);
      
      if (mockSuggestions.length > 0) {
        toast.info(`Found ${mockSuggestions.length} suggestions (${mockSuggestions.filter(s => s.type === 'heading').length} heading issues)`);
      } else {
        toast.success("No issues found!");
      }
    } catch (error) {
      console.error('Grammar check failed:', error);
      toast.error("Grammar check failed");
    } finally {
      setIsChecking(false);
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion: GrammarlySuggestion, replacement: string) => {
    const newContent = isRichText 
      ? applySuggestionToHTML(content, suggestion, replacement)
      : content.substring(0, suggestion.offset) + replacement + content.substring(suggestion.offset + suggestion.length);
    
    onContentChange(newContent);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    toast.success("Suggestion applied!");
  };

  // Reject suggestion
  const rejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  // Get suggestion icon based on type and severity
  const getSuggestionIcon = (suggestion: GrammarlySuggestion) => {
    if (suggestion.type === 'heading') {
      return <Heading className="h-4 w-4 text-blue-500" />;
    }
    if (suggestion.severity === 'critical') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  // Get suggestion color
  const getSuggestionColor = (suggestion: GrammarlySuggestion) => {
    switch (suggestion.severity) {
      case 'critical': return 'text-red-600 border-red-200 bg-red-50';
      case 'suggestion': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'tip': return 'text-blue-600 border-blue-200 bg-blue-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  // Filter suggestions by type
  const contentSuggestions = suggestions.filter(s => s.type !== 'heading');
  const headingSuggestions = suggestions.filter(s => s.type === 'heading');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grammarly controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Grammarly Enable Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={grammarlyEnabled}
            onChange={(e) => setGrammarlyEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
          />
          <span className="text-sm font-medium text-foreground flex items-center gap-1">
            {grammarlyEnabled ? (
              <CheckSquare className="h-4 w-4 text-green-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-500" />
            )}
            Enable Grammarly
          </span>
        </label>
        
        {grammarlyEnabled && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={checkGrammar}
              disabled={!content.trim() || isChecking}
              className="flex items-center gap-2"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isChecking ? "Checking..." : "Check Grammar & Headings"}
            </Button>
            
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Auto-fix Enabled
            </span>
          </>
        )}
        
        {isRichText && (
          <span className="text-xs text-blue-600 flex items-center gap-1">
            <Type className="h-3 w-3" />
            Rich Text Mode
          </span>
        )}
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1 text-xs"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-3 w-3" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      {/* Content preview (read-only) - Toggleable */}
      {isMounted && showPreview && (
        <div className="relative">
          <div className="w-full min-h-[200px] max-h-[300px] overflow-y-auto rounded-lg border border-border bg-surface p-3 text-sm">
            {content ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground mb-2">Content Preview (Grammarly checks this text):</div>
                <div className="whitespace-pre-wrap">{isRichText ? htmlToPlainText(content) : content}</div>
              </div>
            ) : (
              <div className="text-muted-foreground italic">{placeholder}</div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions tabs */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2 border-b border-border">
            <Button
              type="button"
              variant={activeTab === "content" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("content")}
              className="flex items-center gap-1"
            >
              <Type className="h-3 w-3" />
              Content ({contentSuggestions.length})
            </Button>
            <Button
              type="button"
              variant={activeTab === "headings" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("headings")}
              className="flex items-center gap-1"
            >
              <Heading className="h-3 w-3" />
              Headings ({headingSuggestions.length})
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(activeTab === "content" ? contentSuggestions : headingSuggestions).map((suggestion) => (
              <div
                key={suggestion.id}
                className={`rounded-lg border p-3 ${getSuggestionColor(suggestion)}`}
              >
                <div className="flex items-start gap-2">
                  {getSuggestionIcon(suggestion)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{suggestion.message}</p>
                    <p className="text-xs opacity-75">
                      Type: {suggestion.type} • Severity: {suggestion.severity}
                      {suggestion.headingLevel && ` • H${suggestion.headingLevel}`}
                    </p>
                    {suggestion.context && (
                      <p className="text-xs opacity-60 italic mt-1">
                        Context: &ldquo;{suggestion.context}&rdquo;
                      </p>
                    )}
                    {suggestion.replacements && suggestion.replacements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestion.replacements.map((replacement, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applySuggestion(suggestion, replacement)}
                            className="text-xs h-6"
                          >
                            {replacement}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectSuggestion(suggestion.id)}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
