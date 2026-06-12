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
}

export default function RichTextEditor({
  value,
  onChange,
  onReady,
  placeholder,
  className,
}: RichTextEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ckeditorModules, setCkeditorModules] = useState<any>(null);

  useEffect(() => {
    loadCKEditorModules().then(setCkeditorModules);
  }, []);

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
        "insertImage",
        "insertTable",
        "mediaEmbed",
        "|",
        "findAndReplace",
        "showBlocks",
        "|",
        "heading",
        "|",
        "fontSize",
        "fontFamily",
        "|",
        "bold",
        "italic",
        "strikethrough",
        "underline",
        "code",
        "subscript",
        "superscript",
        "removeFormat",
        "|",
        "bulletedList",
        "numberedList",
        "todoList",
        "outdent",
        "indent",
        "|",
        "undo",
        "redo",
        "-",
        "fontColor",
        "fontBackgroundColor",
        "highlight",
        "|",
        "alignment",
        "|",
        "link",
        "blockQuote",
        "codeBlock",
        "htmlEmbed",
        "horizontalLine",
        "pageBreak",
        "|",
        "specialCharacters",
        "selectAll",
        "|",
        "textPartLanguage",
        "|",
        "sourceEditing",
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
    } as any,
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
    } as any,
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
    } as any,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    },
  } : {};

  return (
    <div className={className}>
      <link rel="stylesheet" href="https://cdn.ckeditor.com/ckeditor5/48.2.0/ckeditor5.css" />
      {ckeditorModules && (
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
    </div>
  );
}
