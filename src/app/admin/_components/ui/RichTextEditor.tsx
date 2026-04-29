"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Font,
  FontColor,
  FontBackgroundColor,
  Heading,
  Alignment,
  List,
  ListProperties,
  TodoList,
  Link,
  AutoLink,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  ImageResizeEditing,
  ImageResizeHandles,
  ImageInsert,
  ImageInsertViaUrl,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption,
  CodeBlock,
  Code,
  BlockQuote,
  Indent,
  IndentBlock,
  Highlight,
  HorizontalLine,
  HtmlEmbed,
  FindAndReplace,
  SelectAll,
  RemoveFormat,
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
  PageBreak,
  WordCount,
  AutoImage,
  PastePlainText,
  TextPartLanguage,
  ShowBlocks,
  SourceEditing,
  GeneralHtmlSupport,
  Autoformat,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  return (
    <div className={className}>
      <style>{`
        .ck-editor__editable {
          min-height: 320px;
        }
        .ck.ck-editor {
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid var(--color-border);
        }
        .ck.ck-toolbar {
          border: none;
          border-bottom: 1px solid var(--color-border) !important;
          background: var(--color-surface) !important;
          padding: 4px 8px !important;
        }
        .ck.ck-editor__main > .ck-editor__editable {
          border: none !important;
          box-shadow: none !important;
          background: var(--color-background, #fff) !important;
          color: var(--color-foreground) !important;
          padding: 12px 16px;
        }
        .ck.ck-editor__main > .ck-editor__editable:focus {
          box-shadow: none !important;
        }
        .ck.ck-button {
          color: var(--color-foreground) !important;
        }
        .ck.ck-button.ck-on {
          color: var(--color-brand) !important;
          background: color-mix(in srgb, var(--color-brand) 10%, transparent) !important;
        }
        .ck.ck-dropdown__panel,
        .ck.ck-balloon-panel {
          background: var(--color-surface) !important;
          border-color: var(--color-border) !important;
        }
        .ck-word-count {
          display: flex;
          gap: 12px;
          padding: 4px 12px;
          font-size: 0.75rem;
          color: var(--color-muted);
          border-top: 1px solid var(--color-border);
          background: var(--color-surface);
        }
      `}</style>
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          licenseKey: "GPL",
          placeholder: placeholder ?? "Write your content here...",
          plugins: [
            Essentials,
            Autoformat,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Subscript,
            Superscript,
            Font,
            FontColor,
            FontBackgroundColor,
            Heading,
            Alignment,
            List,
            ListProperties,
            TodoList,
            Link,
            AutoLink,
            Image,
            ImageCaption,
            ImageStyle,
            ImageToolbar,
            ImageUpload,
            ImageResizeEditing,
            ImageResizeHandles,
            ImageInsert,
            ImageInsertViaUrl,
            Table,
            TableToolbar,
            TableProperties,
            TableCellProperties,
            TableColumnResize,
            TableCaption,
            CodeBlock,
            Code,
            BlockQuote,
            Indent,
            IndentBlock,
            Highlight,
            HorizontalLine,
            HtmlEmbed,
            FindAndReplace,
            SelectAll,
            RemoveFormat,
            SpecialCharacters,
            SpecialCharactersArrows,
            SpecialCharactersCurrency,
            SpecialCharactersEssentials,
            SpecialCharactersLatin,
            SpecialCharactersMathematical,
            SpecialCharactersText,
            PageBreak,
            WordCount,
            AutoImage,
            PastePlainText,
            TextPartLanguage,
            ShowBlocks,
            SourceEditing,
            GeneralHtmlSupport,
            Undo,
          ],
          toolbar: {
            items: [
              // Row 1
              "insertImage",
              "insertTable",
              "mediaEmbed",
              "|",
              "findAndReplace",
              "showBlocks",
              "|",
              "heading",
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
              // Row 2
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
              { model: "paragraph" as const, title: "Paragraph", class: "ck-heading_paragraph" },
              { model: "heading1" as const, view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
              { model: "heading2" as const, view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
              { model: "heading3" as const, view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
              { model: "heading4" as const, view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
              { model: "heading5" as const, view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
              { model: "heading6" as const, view: "h6", title: "Heading 6", class: "ck-heading_heading6" },
            ],
          },
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
              },
            ],
          },
        }}
        onChange={(_event, editor) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
