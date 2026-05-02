"use client";

import { useState, useRef, useEffect } from "react";
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
import { encodeWizard } from "@/lib/wizard";
import type { WizardStep } from "@/lib/wizard";

interface Props {
  initialSteps?: WizardStep[];
  isEditing?: boolean;
  initialBorderColor?: string;
  initialBorderSize?: number;
  initialShowFooter?: boolean;
  initialShadow?: string;
  initialShowBorder?: boolean;
  initialShowPanelBorder?: boolean;
  initialPanelBorderColor?: string;
  onInsert: (html: string) => void;
  onClose: () => void;
}

const STEP_EDITOR_CONFIG = {
  licenseKey: "GPL" as const,
  plugins: [
    Essentials, Autoformat, Paragraph,
    Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
    Font, FontColor, FontBackgroundColor,
    Heading, Alignment,
    List, ListProperties, TodoList,
    Link, AutoLink,
    Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload,
    ImageResizeEditing, ImageResizeHandles, ImageInsert, ImageInsertViaUrl, AutoImage,
    Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, TableCaption,
    CodeBlock, Code, BlockQuote, Indent, IndentBlock,
    Highlight, HorizontalLine, HtmlEmbed,
    FindAndReplace, SelectAll, RemoveFormat,
    SpecialCharacters, SpecialCharactersArrows, SpecialCharactersCurrency,
    SpecialCharactersEssentials, SpecialCharactersLatin, SpecialCharactersMathematical, SpecialCharactersText,
    PageBreak, WordCount, PastePlainText, TextPartLanguage, ShowBlocks,
    SourceEditing, GeneralHtmlSupport, Undo,
  ],
  toolbar: {
    items: [
      "insertImage", "insertTable", "|",
      "findAndReplace", "showBlocks", "|",
      "heading", "|",
      "bold", "italic", "strikethrough", "underline", "code", "subscript", "superscript", "removeFormat", "|",
      "bulletedList", "numberedList", "todoList", "outdent", "indent", "|",
      "undo", "redo",
      "-",
      "fontColor", "fontBackgroundColor", "highlight", "|",
      "alignment", "|",
      "link", "blockQuote", "codeBlock", "htmlEmbed", "horizontalLine", "pageBreak", "|",
      "specialCharacters", "selectAll", "|",
      "textPartLanguage", "|",
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
      "imageStyle:inline", "imageStyle:block", "imageStyle:side", "|",
      "toggleImageCaption", "imageTextAlternative", "|",
      "resizeImage",
    ],
  },
  table: {
    contentToolbar: [
      "tableColumn", "tableRow", "mergeTableCells",
      "tableProperties", "tableCellProperties", "toggleTableCaption",
    ],
  },
  list: {
    properties: { styles: true, startIndex: true, reversed: true },
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
  wordCount: { onUpdate: () => {} },
  htmlSupport: {
    allow: [{ name: /.*/, attributes: true as const, classes: true as const, styles: true as const }],
  },
};

function makeStep(): WizardStep {
  return { id: `step-${Math.random().toString(36).slice(2, 9)}`, title: "", content: "" };
}

export function WizardBuilder({
  initialSteps,
  isEditing = false,
  initialBorderColor,
  initialBorderSize,
  initialShowFooter,
  initialShadow,
  initialShowBorder,
  initialShowPanelBorder,
  initialPanelBorderColor,
  onInsert,
  onClose,
}: Props) {
  const [steps, setSteps] = useState<WizardStep[]>(() =>
    initialSteps && initialSteps.length > 0 ? initialSteps : [makeStep()]
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [borderColor, setBorderColor] = useState(initialBorderColor ?? "#94a3b8");
  const [borderSize, setBorderSize] = useState(initialBorderSize ?? 2);
  const [showFooter, setShowFooter] = useState(initialShowFooter ?? true);
  const [shadow, setShadow] = useState(initialShadow ?? "shadow-sm");
  const [showBorder, setShowBorder] = useState(initialShowBorder ?? true);
  const [showPanelBorder, setShowPanelBorder] = useState(initialShowPanelBorder ?? true);
  const [panelBorderColor, setPanelBorderColor] = useState(initialPanelBorderColor ?? "#e2e8f0");
  const dragStepRef = useRef<number | null>(null);
  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(0, (window.innerWidth - 960) / 2) : 400,
    y: 60,
  }));
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.origX + e.clientX - dragRef.current.startX,
        y: dragRef.current.origY + e.clientY - dragRef.current.startY,
      });
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function updateStep(idx: number, patch: Partial<WizardStep>) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addStep() {
    const next = [...steps, makeStep()];
    setSteps(next);
    setActiveIdx(next.length - 1);
  }

  function removeStep(idx: number) {
    if (steps.length === 1) return;
    const next = steps.filter((_, i) => i !== idx);
    setSteps(next);
    setActiveIdx(Math.min(idx, next.length - 1));
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSteps(next);
    setActiveIdx(target);
  }

  function handleStepDragStart(idx: number) {
    dragStepRef.current = idx;
  }

  function handleStepDrop(targetIdx: number) {
    const src = dragStepRef.current;
    if (src === null || src === targetIdx) return;
    const next = [...steps];
    const [moved] = next.splice(src, 1);
    next.splice(targetIdx, 0, moved);
    setSteps(next);
    setActiveIdx(targetIdx);
    dragStepRef.current = null;
  }

  function handleInsert() {
    const valid = steps.filter((s) => s.title.trim());
    if (valid.length === 0) return;
    const encoded = encodeWizard({ type: "wizard", steps: valid, showFooter, shadow, showBorder, showPanelBorder, panelBorderColor });
    const labels = valid.map((s) => s.title.trim()).join(" | ");
    const html = `<div class="wizard-block" data-wizard="${encoded}" style="border:${borderSize}px dashed ${borderColor};padding:12px 16px;margin:16px 0;background:#f8fafc;border-radius:8px;"><strong>Wizard:</strong> ${labels}</div>`;
    onInsert(html);
  }

  const step = steps[activeIdx];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="fixed z-50 w-240 max-w-[95vw] rounded-xl border border-border bg-white shadow-xl"
        style={{ left: pos.x, top: pos.y }}
      >
        {/* Draggable header */}
        <div
          className="flex cursor-grab select-none items-center justify-between rounded-t-xl border-b border-border bg-surface px-4 py-3 active:cursor-grabbing"
          onMouseDown={(e) => {
            dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
          }}
        >
          <span className="text-sm font-semibold text-foreground">
            {isEditing ? "Edit Wizard" : "Wizard Builder"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wizard builder"
            className="rounded p-1 text-muted hover:bg-border hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {/* Step tabs — draggable to reorder */}
          <div className="mb-3 flex flex-wrap gap-1" role="tablist">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === activeIdx}
                draggable
                onDragStart={() => handleStepDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleStepDrop(i)}
                onDragEnd={() => { dragStepRef.current = null; }}
                onClick={() => setActiveIdx(i)}
                className={`cursor-grab rounded-md px-3 py-1 text-xs font-medium transition-colors active:cursor-grabbing ${
                  i === activeIdx
                    ? "bg-brand text-white"
                    : "bg-border text-foreground hover:bg-brand/20"
                }`}
              >
                {s.title.trim() || `Step ${i + 1}`}
              </button>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="rounded-md bg-brand/10 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/20"
            >
              + Add Step
            </button>
          </div>

          {/* Border style controls */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted" htmlFor="wizard-border-color">
                Border color
              </label>
              <input
                id="wizard-border-color"
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-border bg-background p-0.5"
              />
              <span className="font-mono text-xs text-muted">{borderColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted" htmlFor="wizard-border-size">
                Border size
              </label>
              <input
                id="wizard-border-size"
                type="number"
                min={1}
                max={10}
                value={borderSize}
                onChange={(e) => setBorderSize(Math.max(1, Math.min(10, Number(e.target.value))))}
                className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <span className="text-xs text-muted">px</span>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showBorder}
                onChange={(e) => setShowBorder(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              <span className="text-xs text-muted">Show box border</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showPanelBorder}
                onChange={(e) => setShowPanelBorder(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              <span className="text-xs text-muted">Show panel border</span>
            </label>
            {showPanelBorder && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted" htmlFor="wizard-panel-border-color">
                  Panel border color
                </label>
                <input
                  id="wizard-panel-border-color"
                  type="color"
                  value={panelBorderColor}
                  onChange={(e) => setPanelBorderColor(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded border border-border bg-background p-0.5"
                />
                <span className="font-mono text-xs text-muted">{panelBorderColor}</span>
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showFooter}
                onChange={(e) => setShowFooter(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              <span className="text-xs text-muted">Show Next / Previous footer</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted" htmlFor="wizard-shadow">
                Box shadow
              </label>
              <select
                id="wizard-shadow"
                value={shadow}
                onChange={(e) => setShadow(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="shadow-none">None</option>
                <option value="shadow-sm">Small</option>
                <option value="shadow">Medium</option>
                <option value="shadow-md">Medium+</option>
                <option value="shadow-lg">Large</option>
                <option value="shadow-xl">Extra Large</option>
              </select>
            </div>
          </div>

          {/* Active step editor */}
          {step && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(activeIdx, { title: e.target.value })}
                  placeholder="Step title…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  aria-label="Step title"
                />
                <button
                  type="button"
                  onClick={() => moveStep(activeIdx, -1)}
                  disabled={activeIdx === 0}
                  aria-label="Move step left"
                  className="rounded p-1 text-muted hover:text-foreground disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(activeIdx, 1)}
                  disabled={activeIdx === steps.length - 1}
                  aria-label="Move step right"
                  className="rounded p-1 text-muted hover:text-foreground disabled:opacity-30"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(activeIdx)}
                  disabled={steps.length === 1}
                  aria-label="Remove step"
                  className="rounded p-1 text-muted hover:text-red-600 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>

              {/* CKEditor for step content — key forces remount on step switch */}
              <div key={step.id} className="wizard-step-ck pb-1.25">
                <style>{`
                  .wizard-step-ck .ck-editor__editable {
                    min-height: 160px;
                    max-height: 300px;
                    overflow-y: auto;
                  }
                `}</style>
                <CKEditor
                  editor={ClassicEditor}
                  data={step.content}
                  config={STEP_EDITOR_CONFIG}
                  onChange={(_event, editor) => {
                    updateStep(activeIdx, { content: editor.getData() });
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsert}
              disabled={!steps.some((s) => s.title.trim())}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              {isEditing ? "Update Wizard" : "Insert Wizard into Content"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
