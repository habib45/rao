export interface WizardStep {
  id: string;
  title: string;
  content: string;
}

export interface WizardData {
  type: "wizard";
  steps: WizardStep[];
}

// ── Comparison types ──────────────────────────────────────────────────────────

export interface ComparisonColumn {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  price?: string;
  link?: string;
  badge?: string;
}

export interface ComparisonRow {
  id: string;
  label: string;
  values: Record<string, string>; // columnId → value
}

export interface ComparisonData {
  type: "comparison";
  title?: string;
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
}

// ── Content segment union ─────────────────────────────────────────────────────

export type ContentSegment =
  | { type: "html"; content: string }
  | { type: "wizard"; steps: WizardStep[] }
  | { type: "comparison"; data: ComparisonData };

// ── Wizard encode / decode ────────────────────────────────────────────────────

export function encodeWizard(data: WizardData): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeWizard(encoded: string): WizardData {
  return JSON.parse(
    decodeURIComponent(Buffer.from(encoded, "base64").toString()),
  ) as WizardData;
}

// ── Comparison encode / decode ────────────────────────────────────────────────

export function encodeComparison(data: ComparisonData): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeComparison(encoded: string): ComparisonData {
  return JSON.parse(
    decodeURIComponent(Buffer.from(encoded, "base64").toString()),
  ) as ComparisonData;
}

// ── Parser ────────────────────────────────────────────────────────────────────

const WIZARD_RE =
  /<div[^>]*class="wizard-block"[^>]*data-wizard="([^"]+)"[^>]*>[\s\S]*?<\/div>/g;

const COMPARISON_RE =
  /<div[^>]*class="comparison-block"[^>]*data-comparison="([^"]+)"[^>]*>[\s\S]*?<\/div>/g;

interface BlockMatch {
  index: number;
  length: number;
  segment: ContentSegment;
}

export function parseContentSegments(html: string): ContentSegment[] {
  const matches: BlockMatch[] = [];

  WIZARD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WIZARD_RE.exec(html)) !== null) {
    try {
      const data = decodeWizard(m[1]);
      matches.push({ index: m.index, length: m[0].length, segment: { type: "wizard", steps: data.steps } });
    } catch {
      // skip malformed
    }
  }

  COMPARISON_RE.lastIndex = 0;
  while ((m = COMPARISON_RE.exec(html)) !== null) {
    try {
      const data = decodeComparison(m[1]);
      matches.push({ index: m.index, length: m[0].length, segment: { type: "comparison", data } });
    } catch {
      // skip malformed
    }
  }

  matches.sort((a, b) => a.index - b.index);

  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const { index, length, segment } of matches) {
    const before = html.slice(lastIndex, index);
    if (before) segments.push({ type: "html", content: before });
    segments.push(segment);
    lastIndex = index + length;
  }

  const tail = html.slice(lastIndex);
  if (tail) segments.push({ type: "html", content: tail });

  return segments;
}
