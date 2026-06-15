"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import CKEditor to avoid SSR issues
const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then(mod => mod.CKEditor), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-lg bg-border" />,
});

// Dynamically import CKEditor modules to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadCKEditorModules = async (): Promise<any> => {
  const ckeditor5 = await import("ckeditor5");
  return {
    ClassicEditor: ckeditor5.ClassicEditor,
    Essentials: ckeditor5.Essentials,
    Paragraph: ckeditor5.Paragraph,
    Bold: ckeditor5.Bold,
    Italic: ckeditor5.Italic,
    Underline: ckeditor5.Underline,
    Strikethrough: ckeditor5.Strikethrough,
    Subscript: ckeditor5.Subscript,
    Superscript: ckeditor5.Superscript,
    Font: ckeditor5.Font,
    FontSize: ckeditor5.FontSize,
    FontFamily: ckeditor5.FontFamily,
    FontColor: ckeditor5.FontColor,
    FontBackgroundColor: ckeditor5.FontBackgroundColor,
    Heading: ckeditor5.Heading,
    Alignment: ckeditor5.Alignment,
    List: ckeditor5.List,
    ListProperties: ckeditor5.ListProperties,
    TodoList: ckeditor5.TodoList,
    Link: ckeditor5.Link,
    AutoLink: ckeditor5.AutoLink,
    Image: ckeditor5.Image,
    ImageCaption: ckeditor5.ImageCaption,
    ImageStyle: ckeditor5.ImageStyle,
    ImageToolbar: ckeditor5.ImageToolbar,
    ImageUpload: ckeditor5.ImageUpload,
    ImageResizeEditing: ckeditor5.ImageResizeEditing,
    ImageResizeHandles: ckeditor5.ImageResizeHandles,
    ImageInsert: ckeditor5.ImageInsert,
    ImageInsertViaUrl: ckeditor5.ImageInsertViaUrl,
    MediaEmbed: ckeditor5.MediaEmbed,
    Table: ckeditor5.Table,
    TableToolbar: ckeditor5.TableToolbar,
    TableProperties: ckeditor5.TableProperties,
    TableCellProperties: ckeditor5.TableCellProperties,
    TableColumnResize: ckeditor5.TableColumnResize,
    TableCaption: ckeditor5.TableCaption,
    CodeBlock: ckeditor5.CodeBlock,
    Code: ckeditor5.Code,
    BlockQuote: ckeditor5.BlockQuote,
    Indent: ckeditor5.Indent,
    IndentBlock: ckeditor5.IndentBlock,
    Highlight: ckeditor5.Highlight,
    HorizontalLine: ckeditor5.HorizontalLine,
    HtmlEmbed: ckeditor5.HtmlEmbed,
    FindAndReplace: ckeditor5.FindAndReplace,
    SelectAll: ckeditor5.SelectAll,
    RemoveFormat: ckeditor5.RemoveFormat,
    SpecialCharacters: ckeditor5.SpecialCharacters,
    SpecialCharactersArrows: ckeditor5.SpecialCharactersArrows,
    SpecialCharactersCurrency: ckeditor5.SpecialCharactersCurrency,
    SpecialCharactersEssentials: ckeditor5.SpecialCharactersEssentials,
    SpecialCharactersLatin: ckeditor5.SpecialCharactersLatin,
    SpecialCharactersMathematical: ckeditor5.SpecialCharactersMathematical,
    SpecialCharactersText: ckeditor5.SpecialCharactersText,
    PageBreak: ckeditor5.PageBreak,
    WordCount: ckeditor5.WordCount,
    AutoImage: ckeditor5.AutoImage,
    PastePlainText: ckeditor5.PastePlainText,
    TextPartLanguage: ckeditor5.TextPartLanguage,
    ShowBlocks: ckeditor5.ShowBlocks,
    SourceEditing: ckeditor5.SourceEditing,
    GeneralHtmlSupport: ckeditor5.GeneralHtmlSupport,
    Autoformat: ckeditor5.Autoformat,
    Undo: ckeditor5.Undo,
  };
};

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReady?: (editor: any) => void;
  placeholder?: string;
  className?: string;
  showWordCount?: boolean;
  showPreview?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  onReady,
  placeholder,
  className,
  showWordCount = true,
  showPreview = false,
}: RichTextEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ckeditorModules, setCkeditorModules] = useState<any>(null);
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0 });
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    loadCKEditorModules().then(setCkeditorModules);
  }, []);

  // Calculate word and character count
  useEffect(() => {
    const text = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    setWordCount({ words, characters });
  }, [value]);

  const config = ckeditorModules ? {
    licenseKey: "GPL",
    placeholder: placeholder ?? "Write your content here...",
    plugins: [
      ckeditorModules.Essentials,
      ckeditorModules.Autoformat,
      ckeditorModules.Paragraph,
      ckeditorModules.Bold,
      ckeditorModules.Italic,
      ckeditorModules.Underline,
      ckeditorModules.Strikethrough,
      ckeditorModules.Subscript,
      ckeditorModules.Superscript,
      ckeditorModules.Font,
      ckeditorModules.FontSize,
      ckeditorModules.FontFamily,
      ckeditorModules.FontColor,
      ckeditorModules.FontBackgroundColor,
      ckeditorModules.Heading,
      ckeditorModules.Alignment,
      ckeditorModules.List,
      ckeditorModules.ListProperties,
      ckeditorModules.TodoList,
      ckeditorModules.Link,
      ckeditorModules.AutoLink,
      ckeditorModules.Image,
      ckeditorModules.ImageCaption,
      ckeditorModules.ImageStyle,
      ckeditorModules.ImageToolbar,
      ckeditorModules.ImageUpload,
      ckeditorModules.ImageResizeEditing,
      ckeditorModules.ImageResizeHandles,
      ckeditorModules.ImageInsert,
      ckeditorModules.ImageInsertViaUrl,
      ckeditorModules.MediaEmbed,
      ckeditorModules.Table,
      ckeditorModules.TableToolbar,
      ckeditorModules.TableProperties,
      ckeditorModules.TableCellProperties,
      ckeditorModules.TableColumnResize,
      ckeditorModules.TableCaption,
      ckeditorModules.CodeBlock,
      ckeditorModules.Code,
      ckeditorModules.BlockQuote,
      ckeditorModules.Indent,
      ckeditorModules.IndentBlock,
      ckeditorModules.Highlight,
      ckeditorModules.HorizontalLine,
      ckeditorModules.HtmlEmbed,
      ckeditorModules.FindAndReplace,
      ckeditorModules.SelectAll,
      ckeditorModules.RemoveFormat,
      ckeditorModules.SpecialCharacters,
      ckeditorModules.SpecialCharactersArrows,
      ckeditorModules.SpecialCharactersCurrency,
      ckeditorModules.SpecialCharactersEssentials,
      ckeditorModules.SpecialCharactersLatin,
      ckeditorModules.SpecialCharactersMathematical,
      ckeditorModules.SpecialCharactersText,
      ckeditorModules.PageBreak,
      ckeditorModules.WordCount,
      ckeditorModules.AutoImage,
      ckeditorModules.PastePlainText,
      ckeditorModules.TextPartLanguage,
      ckeditorModules.ShowBlocks,
      ckeditorModules.SourceEditing,
      ckeditorModules.GeneralHtmlSupport,
      ckeditorModules.Undo,
    ],
    toolbar: {
      items: [
        // Basic formatting
        "undo",
        "redo",
        "|",
        "heading",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "bulletedList",
        "numberedList",
        "|",
        "link",
        "blockQuote",
        "|",
        // Advanced formatting
        "fontSize",
        "fontFamily",
        "|",
        "fontColor",
        "fontBackgroundColor",
        "highlight",
        "|",
        "alignment",
        "|",
        // Media
        "insertImage",
        "insertTable",
        "mediaEmbed",
        "|",
        // Advanced tools
        "codeBlock",
        "htmlEmbed",
        "horizontalLine",
        "pageBreak",
        "|",
        "findAndReplace",
        "showBlocks",
        "sourceEditing",
        "|",
        "specialCharacters",
        "selectAll",
      ],
      shouldNotGroupWhenFull: true,
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4' },
        { model: 'heading5', view: 'h5', title: 'Heading 5' },
        { model: 'heading6', view: 'h6', title: 'Heading 6' }
      ]
    } as Record<string, unknown>,
    fontSize: {
      options: [
        8,
        9,
        10,
        11,
        12,
        14,
        16,
        18,
        20,
        22,
        24,
        26,
        28,
        36,
        48,
        72
      ]
    } as Record<string, unknown>,
    fontFamily: {
      options: [
        'default',
        'Arial, Helvetica, sans-serif',
        'Courier New, Courier, monospace',
        'Georgia, serif',
        'Tahoma, Geneva, sans-serif',
        'Times New Roman, Times, serif',
        'Verdana, Geneva, sans-serif'
      ]
    } as Record<string, unknown>,
    image: {
      toolbar: [
        "imageStyle:inline",
        "imageStyle:block",
        "imageStyle:side",
        "|",
        "toggleImageCaption",
        "imageTextAlternative",
        "|",
        "resizeImage",
      ],
    },
    table: {
      contentToolbar: [
        "tableColumn",
        "tableRow",
        "mergeTableCells",
        "tableProperties",
        "tableCellProperties",
        "toggleTableCaption",
      ],
    },
    list: {
      properties: {
        styles: true,
        startIndex: true,
        reversed: true,
      },
    },
    link: {
      decorators: {
        openInNewTab: {
          mode: "manual" as const,
          label: "Open in a new tab",
          attributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      },
    },
    wordCount: {
      onUpdate: () => {},
    },
    htmlSupport: {
      allow: [
        {
          name: /.*/,
          attributes: true,
          classes: true,
          styles: true,
        } as Record<string, unknown>,
      ],
    },
  } : {};

  return (
    <div className={className}>
      <link rel="stylesheet" href="https://cdn.ckeditor.com/ckeditor5/48.2.0/ckeditor5.css" />
      <style>{`
        .ck-editor__editable { font-size: 1rem; line-height: 1.7; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .ck-editor__editable { font-size: 1.0625rem; line-height: 1.8; }
        }
        .ck-editor__editable > * + * { margin-top: 1rem; }
        @media (min-width: 640px) {
          .ck-editor__editable > * + * { margin-top: 1.25rem; }
        }
        .ck-editor__editable h1 { font-size: 1.5rem; font-weight: 800; line-height: 1.2; margin-top: 2rem; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .ck-editor__editable h1 { font-size: 2rem; margin-top: 2.5rem; }
        }
        .ck-editor__editable h2 { font-size: 1.25rem; font-weight: 700; line-height: 1.3; margin-top: 1.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-border); color: var(--color-foreground); }
        @media (min-width: 640px) {
          .ck-editor__editable h2 { font-size: 1.5rem; margin-top: 2rem; }
        }
        .ck-editor__editable h3 { font-size: 1.125rem; font-weight: 700; line-height: 1.4; margin-top: 1.5rem; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .ck-editor__editable h3 { font-size: 1.25rem; margin-top: 1.75rem; }
        }
        .ck-editor__editable h4, .ck-editor__editable h5, .ck-editor__editable h6 { font-weight: 700; line-height: 1.4; margin-top: 1.25rem; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .ck-editor__editable h4, .ck-editor__editable h5, .ck-editor__editable h6 { margin-top: 1.5rem; }
        }
        .ck-editor__editable p { color: var(--color-foreground); }
        .ck-editor__editable a { color: var(--color-brand); text-decoration: underline; text-underline-offset: 3px; }
        .ck-editor__editable a:hover { opacity: 0.8; }
        .ck-editor__editable ul { list-style-type: disc; padding-left: 1.5rem; }
        @media (min-width: 640px) {
          .ck-editor__editable ul { padding-left: 1.75rem; }
        }
        .ck-editor__editable ol { list-style-type: decimal; padding-left: 1.5rem; }
        @media (min-width: 640px) {
          .ck-editor__editable ol { padding-left: 1.75rem; }
        }
        .ck-editor__editable li { margin-top: 0.5rem; }
        .ck-editor__editable blockquote { border-left: 4px solid var(--color-brand); padding: 0.75rem 1rem; font-style: italic; color: var(--color-muted); background: var(--color-surface); border-radius: 0 0.5rem 0.5rem 0; margin: 1.25rem 0; }
        @media (min-width: 640px) {
          .ck-editor__editable blockquote { padding: 1rem 1.25rem; margin: 1.5rem 0; }
        }
        .ck-editor__editable img { border-radius: 0.75rem; margin: 1rem 0; max-width: 100% !important; height: auto !important; display: block !important; width: 100% !important; object-fit: contain; }
        @media (min-width: 640px) {
          .ck-editor__editable img { margin: 1.5rem 0; }
        }
        .ck-editor__editable pre { background: var(--color-surface); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.8125rem; border: 1px solid var(--color-border); }
        @media (min-width: 640px) {
          .ck-editor__editable pre { padding: 1.25rem; font-size: 0.875rem; }
        }
        .ck-editor__editable code { background: var(--color-surface); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125em; border: 1px solid var(--color-border); }
        .ck-editor__editable pre code { background: transparent; padding: 0; border: none; }
        .ck-editor__editable table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; }
        @media (min-width: 640px) {
          .ck-editor__editable table { margin: 1.5rem 0; font-size: 0.9375rem; }
        }
        .ck-editor__editable th, .ck-editor__editable td { border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; }
        @media (min-width: 640px) {
          .ck-editor__editable th, .ck-editor__editable td { padding: 0.625rem 0.875rem; }
        }
        .ck-editor__editable th { background: var(--color-surface); font-weight: 700; text-align: left; }
        .ck-editor__editable tr:nth-child(even) td { background: color-mix(in srgb, var(--color-surface) 60%, transparent); }
        .ck-editor__editable hr { border: none; border-top: 2px solid var(--color-border); margin: 1.75rem 0; }
        @media (min-width: 640px) {
          .ck-editor__editable hr { margin: 2rem 0; }
        }
        /* Dark mode support */
        .ck.ck-editor__main .ck-editor__editable { background: var(--color-background); }
        .ck.ck-toolbar { background: var(--color-background); border-color: var(--color-border); }
        .ck.ck-toolbar .ck-button { color: var(--color-foreground); }
        .ck.ck-toolbar .ck-button:hover { background: var(--color-surface); }
        .ck.ck-toolbar .ck-button.ck-on { background: var(--color-brand); color: white; }
        .ck.ck-dropdown__panel { background: var(--color-background); border-color: var(--color-border); }
        .ck.ck-dropdown__panel .ck-list__item { color: var(--color-foreground); }
        .ck.ck-dropdown__panel .ck-list__item:hover { background: var(--color-surface); }
        .ck.ck-dropdown__panel .ck-list__item.ck-item_selected { background: var(--color-brand); color: white; }
        /* Preview mode styles */
        .editor-preview { font-size: 1rem; line-height: 1.7; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .editor-preview { font-size: 1.0625rem; line-height: 1.8; }
        }
        .editor-preview > * + * { margin-top: 1rem; }
        @media (min-width: 640px) {
          .editor-preview > * + * { margin-top: 1.25rem; }
        }
        .editor-preview h1 { font-size: 1.5rem; font-weight: 800; line-height: 1.2; margin-top: 2rem; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .editor-preview h1 { font-size: 2rem; margin-top: 2.5rem; }
        }
        .editor-preview h2 { font-size: 1.25rem; font-weight: 700; line-height: 1.3; margin-top: 1.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-border); color: var(--color-foreground); }
        @media (min-width: 640px) {
          .editor-preview h2 { font-size: 1.5rem; margin-top: 2rem; }
        }
        .editor-preview h3 { font-size: 1.125rem; font-weight: 700; line-height: 1.4; margin-top: 1.5rem; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .editor-preview h3 { font-size: 1.25rem; margin-top: 1.75rem; }
        }
        .editor-preview h4, .editor-preview h5, .editor-preview h6 { font-weight: 700; line-height: 1.4; margin-top: 1.25rem; color: var(--color-foreground); }
        @media (min-width: 640px) {
          .editor-preview h4, .editor-preview h5, .editor-preview h6 { margin-top: 1.5rem; }
        }
        .editor-preview p { color: var(--color-foreground); }
        .editor-preview a { color: var(--color-brand); text-decoration: underline; text-underline-offset: 3px; }
        .editor-preview a:hover { opacity: 0.8; }
        .editor-preview ul { list-style-type: disc; padding-left: 1.5rem; }
        @media (min-width: 640px) {
          .editor-preview ul { padding-left: 1.75rem; }
        }
        .editor-preview ol { list-style-type: decimal; padding-left: 1.5rem; }
        @media (min-width: 640px) {
          .editor-preview ol { padding-left: 1.75rem; }
        }
        .editor-preview li { margin-top: 0.5rem; }
        .editor-preview blockquote { border-left: 4px solid var(--color-brand); padding: 0.75rem 1rem; font-style: italic; color: var(--color-muted); background: var(--color-surface); border-radius: 0 0.5rem 0.5rem 0; margin: 1.25rem 0; }
        @media (min-width: 640px) {
          .editor-preview blockquote { padding: 1rem 1.25rem; margin: 1.5rem 0; }
        }
        .editor-preview img { border-radius: 0.75rem; margin: 1rem 0; max-width: 100% !important; height: auto !important; display: block !important; width: 100% !important; object-fit: contain; }
        @media (min-width: 640px) {
          .editor-preview img { margin: 1.5rem 0; }
        }
        .editor-preview pre { background: var(--color-surface); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.8125rem; border: 1px solid var(--color-border); }
        @media (min-width: 640px) {
          .editor-preview pre { padding: 1.25rem; font-size: 0.875rem; }
        }
        .editor-preview code { background: var(--color-surface); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125em; border: 1px solid var(--color-border); }
        .editor-preview pre code { background: transparent; padding: 0; border: none; }
        .editor-preview table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; }
        @media (min-width: 640px) {
          .editor-preview table { margin: 1.5rem 0; font-size: 0.9375rem; }
        }
        .editor-preview th, .editor-preview td { border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; }
        @media (min-width: 640px) {
          .editor-preview th, .editor-preview td { padding: 0.625rem 0.875rem; }
        }
        .editor-preview th { background: var(--color-surface); font-weight: 700; text-align: left; }
        .editor-preview tr:nth-child(even) td { background: color-mix(in srgb, var(--color-surface) 60%, transparent); }
        .editor-preview hr { border: none; border-top: 2px solid var(--color-border); margin: 1.75rem 0; }
        @media (min-width: 640px) {
          .editor-preview hr { margin: 2rem 0; }
        }
      `}</style>
      {ckeditorModules && (
        <div className="relative">
          {showPreview && (
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isPreviewMode
                    ? 'bg-brand text-white'
                    : 'bg-surface text-foreground hover:bg-surface/80'
                }`}
              >
                {isPreviewMode ? 'Edit' : 'Preview'}
              </button>
            </div>
          )}
          {isPreviewMode ? (
            <div
              className="editor-preview rounded-lg border border-border bg-background p-4 min-h-[300px]"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <CKEditor
              editor={ckeditorModules.ClassicEditor}
              data={value}
              config={config}
              onReady={(editor) => {
                onReady?.(editor);
              }}
              onChange={(_event, editor) => {
                onChange(editor.getData());
              }}
            />
          )}
          {showWordCount && (
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{wordCount.words} words</span>
              <span>{wordCount.characters} characters</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
