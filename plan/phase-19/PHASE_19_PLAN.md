# Phase 19 — Blog Wizard Component

## Goal
Allow blog editors to insert interactive multi-step wizard blocks directly inside the CKEditor content. Each wizard renders as a tabbed/stepper UI on the public frontend, enabling use-cases like ingredient multipliers (½X / 1X / 2X), step-by-step guides, comparison tables, and any grouped content.

## Acceptance Criteria
- Admin can open a Wizard Builder draggable modal inside the blog post form
- Wizard Builder modal: repositionable via drag handle on header
- Wizard Builder: add, remove, rename, reorder steps
- Each step has a title (text) and content (HTML textarea)
- Live preview of step content in the builder
- "Insert Wizard into Content" appends a wizard marker to the CKEditor body
- Existing wizards shown as a list below the editor with Edit buttons
- Edit opens the builder modal pre-populated; "Update Wizard" replaces the block in-place
- Multiple wizards can be inserted into a single post
- Frontend renders every wizard block as interactive tabs
- Tab click + Previous/Next buttons navigate between steps
- Completed steps show ✓ indicator
- Wizard data survives the full save → reload → render cycle
- TypeScript strict: 0 errors | ESLint: 0 warnings | all tests pass

## Feature Documents
- [F19.1 — Wizard Builder (admin)](features/F19.1-wizard-builder.md)
- [F19.2 — Wizard Block (frontend)](features/F19.2-wizard-block.md)

## Test Matrix
- [TEST_MATRIX.md](tests/TEST_MATRIX.md)

## File Structure

```
src/
├── lib/
│   └── wizard.ts                                ← encode/decode/parse utilities
├── app/
│   ├── admin/
│   │   ├── _components/ui/
│   │   │   └── RichTextEditor.tsx               ← add onReady prop
│   │   └── blog/
│   │       └── _components/
│   │           ├── BlogPostForm.tsx              ← wire up wizard builder
│   │           └── WizardBuilder.tsx             ← NEW: admin step editor
│   └── [locale]/
│       └── blog/
│           └── [slug]/
│               ├── page.tsx                     ← parse + render wizard blocks
│               └── _components/
│                   └── WizardBlock.tsx           ← NEW: frontend tabs component
```

## Data Contract

Wizard blocks are stored in the blog post `content` HTML as:

```html
<div class="wizard-block"
     data-wizard="BASE64_ENCODED_JSON"
     style="border:2px dashed #94a3b8;padding:12px 16px;margin:16px 0;background:#f8fafc;border-radius:8px;">
  <strong>Wizard:</strong> Step 1 | Step 2 | Step 3
</div>
```

The `data-wizard` attribute holds `btoa(encodeURIComponent(JSON.stringify(data)))`:

```json
{
  "type": "wizard",
  "steps": [
    { "id": "step-abc123", "title": "½X", "content": "<ul><li>½ cup rice</li></ul>" },
    { "id": "step-def456", "title": "1X",  "content": "<ul><li>1 cup rice</li></ul>" }
  ]
}
```

## Dependencies
- Phase 14 / 18 (blog system + editor already in place)
- No new npm packages required
