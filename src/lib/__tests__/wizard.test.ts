import { it, expect } from "vitest";
import {
  encodeWizard,
  decodeWizard,
  encodeComparison,
  decodeComparison,
  parseContentSegments,
} from "@/lib/wizard";
import type { WizardData, ComparisonData } from "@/lib/wizard";

const sampleData: WizardData = {
  type: "wizard",
  steps: [
    { id: "a1", title: "Step A", content: "<p>Hello</p>" },
    { id: "b2", title: "Step B", content: "<ul><li>item</li></ul>" },
  ],
};

const sampleComparisonData: ComparisonData = {
  type: "comparison",
  title: "Product Comparison",
  columns: [
    { id: "col1", title: "Product A", price: "$99" },
    { id: "col2", title: "Product B", price: "$199" },
  ],
  rows: [
    { id: "row1", label: "Price", values: { col1: "$99", col2: "$199" } },
    { id: "row2", label: "Rating", values: { col1: "4.5", col2: "4.8" } },
  ],
};

function makeBlock(encoded: string): string {
  return `<div class="wizard-block" data-wizard="${encoded}" style="border:1px solid red;">placeholder</div>`;
}

function makeComparisonBlock(encoded: string): string {
  return `<div class="comparison-block" data-comparison="${encoded}" style="border:1px solid blue;">placeholder</div>`;
}

// TC-19.0.1
it("TC-19.0.1 encodeWizard → decodeWizard round-trip (ASCII)", () => {
  const encoded = encodeWizard(sampleData);
  expect(decodeWizard(encoded)).toEqual(sampleData);
});

// TC-19.0.2
it("TC-19.0.2 round-trip with Unicode (Bengali/Swedish)", () => {
  const unicodeData: WizardData = {
    type: "wizard",
    steps: [
      { id: "u1", title: "আমার", content: "<p>বাংলা</p>" },
      { id: "u2", title: "Åäö", content: "<p>Swedish</p>" },
    ],
  };
  expect(decodeWizard(encodeWizard(unicodeData))).toEqual(unicodeData);
});

// TC-19.0.3
it("TC-19.0.3 parseContentSegments — no wizard blocks", () => {
  const html = "<p>plain content</p>";
  const segs = parseContentSegments(html);
  expect(segs).toHaveLength(1);
  expect(segs[0].type).toBe("html");
});

// TC-19.0.4
it("TC-19.0.4 parseContentSegments — one wizard block", () => {
  const encoded = encodeWizard(sampleData);
  const html = `<p>before</p>${makeBlock(encoded)}<p>after</p>`;
  const segs = parseContentSegments(html);
  expect(segs).toHaveLength(3);
  expect(segs[0].type).toBe("html");
  expect(segs[1].type).toBe("wizard");
  expect(segs[2].type).toBe("html");
});

// TC-19.0.5
it("TC-19.0.5 parseContentSegments — two wizard blocks", () => {
  const encoded = encodeWizard(sampleData);
  const html = `<p>A</p>${makeBlock(encoded)}<p>B</p>${makeBlock(encoded)}<p>C</p>`;
  const segs = parseContentSegments(html);
  expect(segs).toHaveLength(5);
  expect(segs.filter((s) => s.type === "wizard")).toHaveLength(2);
});

// TC-19.0.6
it("TC-19.0.6 parseContentSegments — invalid base64 gracefully skipped", () => {
  const html = `<p>text</p><div class="wizard-block" data-wizard="!!!invalid!!!" style="">x</div><p>end</p>`;
  const segs = parseContentSegments(html);
  const wizardSegs = segs.filter((s) => s.type === "wizard");
  expect(wizardSegs).toHaveLength(0);
});

// TC-19.0.7
it("TC-19.0.7 parseContentSegments — wizard at start of content", () => {
  const encoded = encodeWizard(sampleData);
  const html = `${makeBlock(encoded)}<p>after</p>`;
  const segs = parseContentSegments(html);
  expect(segs[0].type).toBe("wizard");
});

// TC-19.0.8
it("TC-19.0.8 parseContentSegments — wizard at end of content", () => {
  const encoded = encodeWizard(sampleData);
  const html = `<p>before</p>${makeBlock(encoded)}`;
  const segs = parseContentSegments(html);
  expect(segs[segs.length - 1].type).toBe("wizard");
});

// Comparison encode/decode tests
it("encodeComparison → decodeComparison round-trip (ASCII)", () => {
  const encoded = encodeComparison(sampleComparisonData);
  expect(decodeComparison(encoded)).toEqual(sampleComparisonData);
});

it("round-trip with Unicode (Bengali/Swedish)", () => {
  const unicodeData: ComparisonData = {
    type: "comparison",
    title: "তুলনা",
    columns: [
      { id: "col1", title: "পণ্য আ", price: "৯৯৳" },
      { id: "col2", title: "Produkt B", price: "199 kr" },
    ],
    rows: [
      { id: "row1", label: "Price", values: { col1: "৯৯৳", col2: "199 kr" } },
    ],
  };
  expect(decodeComparison(encodeComparison(unicodeData))).toEqual(unicodeData);
});

// Comparison block parsing tests
it("parseContentSegments — one comparison block", () => {
  const encoded = encodeComparison(sampleComparisonData);
  const html = `<p>before</p>${makeComparisonBlock(encoded)}<p>after</p>`;
  const segs = parseContentSegments(html);
  expect(segs).toHaveLength(3);
  expect(segs[0].type).toBe("html");
  expect(segs[1].type).toBe("comparison");
  expect(segs[2].type).toBe("html");
});

it("parseContentSegments — two comparison blocks", () => {
  const encoded = encodeComparison(sampleComparisonData);
  const html = `<p>A</p>${makeComparisonBlock(encoded)}<p>B</p>${makeComparisonBlock(encoded)}<p>C</p>`;
  const segs = parseContentSegments(html);
  expect(segs).toHaveLength(5);
  expect(segs.filter((s) => s.type === "comparison")).toHaveLength(2);
});

it("parseContentSegments — invalid comparison base64 gracefully skipped", () => {
  const html = `<p>text</p><div class="comparison-block" data-comparison="!!!invalid!!!" style="">x</div><p>end</p>`;
  const segs = parseContentSegments(html);
  const comparisonSegs = segs.filter((s) => s.type === "comparison");
  expect(comparisonSegs).toHaveLength(0);
});

it("parseContentSegments — mixed wizard and comparison blocks", () => {
  const wizardEncoded = encodeWizard(sampleData);
  const comparisonEncoded = encodeComparison(sampleComparisonData);
  const html = `<p>start</p>${makeBlock(wizardEncoded)}<p>middle</p>${makeComparisonBlock(comparisonEncoded)}<p>end</p>`;
  const segs = parseContentSegments(html);
  expect(segs).toHaveLength(5);
  expect(segs[1].type).toBe("wizard");
  expect(segs[3].type).toBe("comparison");
});
