import { describe, it, expect } from "vitest";
import { t } from "@/lib/i18n/translate";
import type { TranslationMap } from "@/types/domain";

const fullMap: TranslationMap = {
  en: "Hello",
  "bn-BD": "হ্যালো",
  sv: "Hej",
};

// TC-1.4.1: t() returns exact locale value
describe("t() helper", () => {
  it("returns exact locale value for bn-BD", () => {
    expect(t(fullMap, "bn-BD")).toBe("হ্যালো");
  });

  // TC-1.4.2: t() returns en value for each locale when present
  it("returns en value for en locale", () => {
    expect(t(fullMap, "en")).toBe("Hello");
  });

  it("returns sv value for sv locale", () => {
    expect(t(fullMap, "sv")).toBe("Hej");
  });

  // TC-1.4.3: t() falls back to en when locale is missing
  it("falls back to en when bn-BD is missing", () => {
    expect(t({ en: "Hello" }, "bn-BD")).toBe("Hello");
  });

  it("falls back to en when sv is missing", () => {
    expect(t({ en: "Hello" }, "sv")).toBe("Hello");
  });

  // TC-1.4.4: t() returns empty string for null map
  it("returns empty string for null map", () => {
    expect(t(null, "en")).toBe("");
  });

  // TC-1.4.5: t() returns empty string for undefined map
  it("returns empty string for undefined map", () => {
    expect(t(undefined, "en")).toBe("");
  });

  // TC-1.4.6: t() returns empty string for empty map
  it("returns empty string for empty map", () => {
    expect(t({}, "en")).toBe("");
  });

  // TC-1.4.7: t() works with TranslationMap<string[]>
  it("works with string[] generic", () => {
    const arrayMap: TranslationMap<string[]> = {
      en: ["Feature A", "Feature B"],
      sv: ["Funktion A"],
    };
    expect(t(arrayMap, "sv")).toEqual(["Funktion A"]);
    expect(t(arrayMap, "bn-BD")).toEqual(["Feature A", "Feature B"]);
  });

  // TC-1.4.8: t() with en value as empty string
  it("returns empty string when en value is empty string", () => {
    expect(t({ en: "" }, "en")).toBe("");
  });

  // TC-1.4.9: t() with locale value as empty string
  it("returns empty string when locale explicitly has empty string", () => {
    expect(t({ en: "Hello", "bn-BD": "" }, "bn-BD")).toBe("");
  });

  // TC-1.4.10: t() preserves Unicode characters
  it("preserves Bengali Unicode characters", () => {
    expect(t({ en: "Price", "bn-BD": "মূল্য" }, "bn-BD")).toBe("মূল্য");
  });

  it("preserves special characters in Swedish", () => {
    expect(t({ en: "Price", sv: "Pris — 100 kr" }, "sv")).toBe(
      "Pris — 100 kr"
    );
  });
});
