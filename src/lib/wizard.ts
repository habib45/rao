export interface WizardStep {
  id: string;
  title: string;
  content: string;
}

export interface WizardData {
  type: "wizard";
  steps: WizardStep[];
}

export type ContentSegment =
  | { type: "html"; content: string }
  | { type: "wizard"; steps: WizardStep[] };

export function encodeWizard(data: WizardData): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeWizard(encoded: string): WizardData {
  return JSON.parse(
    decodeURIComponent(Buffer.from(encoded, "base64").toString()),
  ) as WizardData;
}

const WIZARD_RE =
  /<div[^>]*class="wizard-block"[^>]*data-wizard="([^"]+)"[^>]*>[\s\S]*?<\/div>/g;

export function parseContentSegments(html: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  WIZARD_RE.lastIndex = 0;
  while ((match = WIZARD_RE.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    if (before) segments.push({ type: "html", content: before });

    try {
      const data = decodeWizard(match[1]);
      segments.push({ type: "wizard", steps: data.steps });
    } catch {
      // invalid base64 — skip this block
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = html.slice(lastIndex);
  if (tail) segments.push({ type: "html", content: tail });

  return segments;
}
