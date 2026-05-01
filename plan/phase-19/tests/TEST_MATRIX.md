# Phase 19 Test Matrix

## wizard.ts utilities
| ID | Description | Expected |
|---|---|---|
| TC-19.0.1 | encodeWizard → decodeWizard round-trip (ASCII) | identical object |
| TC-19.0.2 | round-trip with Unicode (Bengali/Swedish) | identical object |
| TC-19.0.3 | parseContentSegments — no wizard blocks | single html segment |
| TC-19.0.4 | parseContentSegments — one wizard block | [html, wizard, html] |
| TC-19.0.5 | parseContentSegments — two wizard blocks | 5 segments |
| TC-19.0.6 | parseContentSegments — invalid base64 gracefully skipped | segment skipped |
| TC-19.0.7 | parseContentSegments — wizard at start of content | first segment is wizard |
| TC-19.0.8 | parseContentSegments — wizard at end of content | last segment is wizard |

## WizardBlock (frontend)
| ID | Description | Expected |
|---|---|---|
| TC-19.1.1 | Renders first step title tab as active | step[0] tab has aria-selected=true |
| TC-19.1.2 | Renders first step content | first step HTML present |
| TC-19.1.3 | Clicking second tab switches content | second step content visible |
| TC-19.1.4 | Previous button disabled on first step | disabled attribute |
| TC-19.1.5 | Next button disabled on last step | disabled attribute |
| TC-19.1.6 | Next button advances to next step | step index increments |
| TC-19.1.7 | Previous button goes back | step index decrements |
| TC-19.1.8 | Completed steps show ✓ | checkmark text present |
| TC-19.1.9 | Navigation footer hidden for single-step wizard | no Previous/Next buttons |
| TC-19.1.10 | Returns null for empty steps array | nothing rendered |

## WizardBuilder (admin)
| ID | Description | Expected |
|---|---|---|
| TC-19.2.1 | Renders with one initial step tab | "Step 1" tab visible |
| TC-19.2.2 | "Add Step" appends new tab | step count increases |
| TC-19.2.3 | Remove step button removes it | step count decreases |
| TC-19.2.4 | Cannot remove last step | button disabled |
| TC-19.2.5 | Title input updates step tab label | tab text changes |
| TC-19.2.6 | Move step (up/down) reorders tabs | step at new position |
| TC-19.2.7 | "Insert Wizard" calls onInsert with HTML containing data-wizard | onInsert called |
| TC-19.2.8 | Inserted HTML encodes step titles correctly | decoded titles match |
| TC-19.2.9 | "Cancel" calls onClose | onClose called |
| TC-19.2.10 | Live preview appears when content is typed | preview div rendered |
