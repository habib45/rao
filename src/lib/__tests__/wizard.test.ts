import { it, expect } from "vitest";
import {
  encodeWizard,
  decodeWizard,
  parseContentSegments,
} from "@/lib/wizard";
import type { WizardData } from "@/lib/wizard";

const sampleData: WizardData = {
  type: "wizard",
  steps: [
    { id: "a1", title: "Step A", content: "<p>Hello</p>" },
    { id: "b2", title: "Step B", content: "<ul><li>item</li></ul>" },
  ],
};

function makeBlock(encoded: string): string {
  return `<div class="wizard-block" data-wizard="${encoded}" style="border:1px solid red;">placeholder</div>`;
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
