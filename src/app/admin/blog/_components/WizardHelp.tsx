"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export function WizardHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Wizard help guide"
        className="flex items-center justify-center rounded-full p-1 text-muted hover:text-brand transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-[360px] rounded-xl border border-border bg-white shadow-lg sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold text-foreground">
              📋 Wizard Block — User Guide
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close guide"
              className="rounded p-0.5 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[480px] overflow-y-auto px-4 py-4 text-sm text-foreground space-y-5">

            {/* What is it */}
            <section>
              <h3 className="mb-1.5 font-semibold text-brand">What is a Wizard Block?</h3>
              <p className="text-muted leading-relaxed">
                A Wizard Block is an interactive multi-step component embedded inside your blog
                post. Readers can click through steps (tabs) using Previous / Next buttons or
                directly clicking a tab header — great for recipes (½X / 1X / 2X portions),
                step-by-step guides, comparison tables, and grouped content.
              </p>
            </section>

            {/* How to add */}
            <section>
              <h3 className="mb-1.5 font-semibold text-brand">How to add a Wizard</h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-muted leading-relaxed">
                <li>
                  Click the <span className="font-semibold text-foreground">📋 Add Wizard</span> button
                  above the content editor to open the Wizard Builder panel.
                </li>
                <li>
                  Give the first step a <span className="font-semibold text-foreground">title</span>
                  {' (e.g. "Step 1", "½X", "Beginner").'}
                </li>
                <li>
                  Type or paste <span className="font-semibold text-foreground">HTML content</span>
                  {" "}for this step in the textarea below the title.
                  A live preview appears as you type.
                </li>
                <li>
                  Add more steps with the{" "}
                  <span className="font-semibold text-foreground">+ Add Step</span> button.
                </li>
                <li>
                  Click{" "}
                  <span className="font-semibold text-foreground">Insert Wizard into Content</span>
                  {" "}— the wizard block is appended to the end of the editor content.
                </li>
                <li>
                  Save the post as usual. The wizard renders automatically on the frontend.
                </li>
              </ol>
            </section>

            {/* Step management */}
            <section>
              <h3 className="mb-1.5 font-semibold text-brand">Managing steps</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-muted leading-relaxed">
                <li>
                  <span className="font-semibold text-foreground">Rename:</span>{" "}
                  Edit the title input — the tab label updates live.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Reorder:</span>{" "}
                  Use the ← → arrow buttons next to the title to move the active step
                  left or right.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Remove:</span>{" "}
                  Click ✕ next to the title. The last remaining step cannot be removed.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Switch steps:</span>{" "}
                  Click any step tab at the top of the builder panel.
                </li>
              </ul>
            </section>

            {/* Step content */}
            <section>
              <h3 className="mb-1.5 font-semibold text-brand">Writing step content</h3>
              <p className="text-muted leading-relaxed">
                Each step accepts raw HTML. You can use any markup that is valid inside an
                article — paragraphs, lists, tables, images, headings, etc. The live preview
                below the textarea renders exactly as it will appear on the public page.
              </p>
              <div className="mt-2 rounded-lg border border-border bg-surface p-3 font-mono text-xs text-muted">
                {`<ul>\n  <li>½ cup rice</li>\n  <li>1 tbsp butter</li>\n</ul>`}
              </div>
            </section>

            {/* Multiple wizards */}
            <section>
              <h3 className="mb-1.5 font-semibold text-brand">Multiple wizards in one post</h3>
              <p className="text-muted leading-relaxed">
                You can insert as many Wizard Blocks as you like. Each click of{" "}
                <span className="font-semibold text-foreground">Insert Wizard into Content</span>
                {" "}appends a new independent block. Each wizard is rendered separately on the
                frontend and has its own navigation state.
              </p>
            </section>

            {/* Frontend behaviour */}
            <section>
              <h3 className="mb-1.5 font-semibold text-brand">How it looks for readers</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-muted leading-relaxed">
                <li>Tab headers row — click any tab to jump to that step.</li>
                <li>Completed steps (already visited) show a ✓ prefix in the tab.</li>
                <li>Previous ← / → Next footer buttons for sequential navigation.</li>
                <li>Footer is hidden when the wizard has only one step.</li>
              </ul>
            </section>

            {/* Tips */}
            <section>
              <h3 className="mb-1.5 font-semibold text-brand">Tips</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-muted leading-relaxed">
                <li>
                  Steps with an empty title are silently skipped on insert — always fill in
                  the title before inserting.
                </li>
                <li>
                  You can edit a Wizard Block after insertion by switching to{" "}
                  <span className="font-semibold text-foreground">Source editing</span> mode in
                  the CKEditor toolbar and modifying the{" "}
                  <code className="rounded bg-surface px-1 text-xs">data-wizard</code> attribute.
                </li>
                <li>
                  Wizard data is stored as Unicode-safe Base64 JSON inside the post HTML —
                  it survives copy-paste, export, and re-import without data loss.
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
