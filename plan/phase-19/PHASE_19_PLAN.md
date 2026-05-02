# Phase 19 — Blog Wizard Component

## Goal
Allow blog editors to insert interactive multi-step wizard blocks directly inside the CKEditor content. Each wizard renders as a tabbed/stepper UI on the public frontend, enabling use-cases like ingredient multipliers (½X / 1X / 2X), step-by-step guides, comparison tables, and any grouped content.

## Acceptance Criteria
- Admin can open a Wizard Builder draggable modal inside the blog post form
- Wizard Builder modal: repositionable via drag handle on header
- Wizard Builder: add, remove, rename, reorder steps (including drag-and-drop reorder)
- Each step has a title (text) and full CKEditor rich-content area
- "Insert Wizard into Content" appends a wizard marker to the CKEditor body
- Existing wizards shown as a list below the editor with Edit buttons
- Edit opens the builder modal pre-populated; "Update Wizard" replaces the block in-place
- Multiple wizards can be inserted into a single post
- Frontend renders every wizard block as interactive tabs
- Tab click + Previous/Next buttons navigate between steps
- Completed steps show ✓ indicator
- Wizard data survives the full save → reload → render cycle

### Style Controls (all persisted in encoded data)
- **Border color** — color picker (default `#94a3b8`)
- **Border size** — number input 1–10 px (default `2`)
- **Show box border** — checkbox; hides outer wrapper border when unchecked
- **Show panel border** — checkbox; hides internal tab-bar and footer dividers when unchecked
- **Panel border color** — color picker (visible only when "Show panel border" is on, default `#e2e8f0`)
- **Box shadow** — dropdown: None / Small / Medium / Medium+ / Large / Extra Large (default `shadow-sm`)
- **Show Next / Previous footer** — checkbox; hides the prev/next nav bar when unchecked

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
│   └── wizard.ts                                ← encode/decode/parse + WizardData type
├── app/
│   ├── admin/
│   │   └── blog/
│   │       └── _components/
│   │           ├── BlogPostForm.tsx              ← wizard builder wiring
│   │           └── WizardBuilder.tsx             ← draggable modal step editor + style controls
│   └── [locale]/
│       └── blog/
│           └── [slug]/
│               ├── page.tsx                     ← parse + render wizard blocks
│               └── _components/
│                   └── WizardBlock.tsx           ← frontend tabs component
```

The wizard is also embeddable inside product descriptions via `ProductEditForm` and `ProductCreateForm`, which share the same `WizardBuilder` component.

## Data Contract

Wizard blocks are stored in `content` HTML as:

```html
<div class="wizard-block"
     data-wizard="BASE64_ENCODED_JSON"
     style="border:2px dashed #94a3b8;padding:12px 16px;margin:16px 0;background:#f8fafc;border-radius:8px;">
  <strong>Wizard:</strong> Step 1 | Step 2 | Step 3
</div>
```

The `data-wizard` attribute holds `btoa(encodeURIComponent(JSON.stringify(data)))`:

```ts
interface WizardData {
  type: "wizard";
  steps: WizardStep[];         // array of { id, title, content }
  showFooter?: boolean;        // default true  — show Next/Previous nav bar
  shadow?: string;             // default "shadow-sm" — Tailwind shadow class
  showBorder?: boolean;        // default true  — show outer box border
  showPanelBorder?: boolean;   // default true  — show tab-bar / footer dividers
  panelBorderColor?: string;   // default "#e2e8f0" — divider color (inline style)
}
```

All new fields are optional and backward-compatible — old wizards missing them fall back to defaults.

## Style Control Defaults (backward-compatible)

| Field | Default | Applied as |
|---|---|---|
| `showFooter` | `true` | Conditional render of footer div |
| `shadow` | `"shadow-sm"` | Tailwind class on outer wrapper |
| `showBorder` | `true` | Tailwind `border border-border` on outer wrapper |
| `showPanelBorder` | `true` | Inline `borderBottom` / `borderTop` style on tab list / footer |
| `panelBorderColor` | `"#e2e8f0"` | Inline style color value |

## Dependencies
- Phase 14 / 18 (blog system + CKEditor already in place)
- No new npm packages required
