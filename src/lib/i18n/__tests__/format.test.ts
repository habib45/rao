import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/i18n/format";

describe("formatPrice()", () => {
  // TC-1.4.11: formatPrice basic USD/en
  it("formats basic USD price for en", () => {
    expect(formatPrice(1999, "USD", "en")).toBe("$19.99");
  });

  // TC-1.4.12: formatPrice zero cents
  it("formats zero cents", () => {
    expect(formatPrice(0, "USD", "en")).toBe("$0.00");
  });

  // TC-1.4.13: formatPrice large amount
  it("formats large amount with grouping", () => {
    expect(formatPrice(99999999, "USD", "en")).toBe("$999,999.99");
  });

  // TC-1.4.14: formatPrice null returns empty string
  it("returns empty string for null", () => {
    expect(formatPrice(null, "USD", "en")).toBe("");
  });

  // TC-1.4.15: formatPrice Swedish krona
  it("formats Swedish krona", () => {
    const result = formatPrice(19900, "SEK", "sv");
    expect(result).toContain("199");
    expect(result).toContain("kr");
  });

  // TC-1.4.16: formatPrice Bengali locale uses Western digits
  it("uses Western digits for Bengali locale", () => {
    const result = formatPrice(1999, "USD", "bn-BD");
    expect(result).toContain("19");
    expect(result).toContain("99");
    // Should NOT contain Bengali digits ০-৯
    expect(result).not.toMatch(/[০-৯]/);
  });

  // TC-1.4.17: formatPrice with BDT currency
  it("formats BDT currency with Western digits", () => {
    const result = formatPrice(500000, "BDT", "bn-BD");
    expect(result).toContain("5,000");
    expect(result).not.toMatch(/[০-৯]/);
  });

  // TC-1.4.18: formatPrice single cent
  it("formats single cent", () => {
    expect(formatPrice(1, "USD", "en")).toBe("$0.01");
  });

  // TC-1.4.19: formatPrice negative amount
  it("formats negative amount", () => {
    const result = formatPrice(-1999, "USD", "en");
    expect(result).toContain("19.99");
    // Should have some negative indicator
    expect(result).toMatch(/-|\(/);
  });

  // TC-1.4.20: formatPrice with unknown currency code
  it("handles unknown currency code", () => {
    // Intl.NumberFormat in Node 20+ accepts unknown codes and uses them as symbol
    const result = formatPrice(1999, "XYZ", "en");
    expect(result).toContain("XYZ");
    expect(result).toContain("19.99");
  });

  // TC-1.4.21: formatPrice with undefined cents
  it("returns empty string for undefined cents", () => {
    expect(formatPrice(undefined as unknown as null, "USD", "en")).toBe("");
  });
});
