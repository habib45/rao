import { describe, it, expect } from "vitest";
import { slugify } from "../slugify";

describe("slugify", () => {
  it("lowercases and hyphenates basic words", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics from accented Latin characters", () => {
    expect(slugify("Café Latte")).toBe("cafe-latte");
  });

  it("strips Swedish diacritics (å, ä, ö)", () => {
    expect(slugify("Åsa Öberg")).toBe("asa-oberg");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  leading spaces  ")).toBe("leading-spaces");
  });

  it("collapses multiple spaces into a single hyphen", () => {
    expect(slugify("multiple   spaces")).toBe("multiple-spaces");
  });

  it("preserves already-hyphenated words", () => {
    expect(slugify("already-hyphenated")).toBe("already-hyphenated");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("double--hyphens")).toBe("double-hyphens");
  });

  it("strips special characters", () => {
    expect(slugify("special! @#$% chars")).toBe("special-chars");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("preserves digits", () => {
    expect(slugify("123 numbers")).toBe("123-numbers");
  });

  it("strips Bengali/non-Latin characters entirely", () => {
    const result = slugify("বাংলা product");
    // Bengali chars have no Latin equivalent — stripped, only "product" survives
    expect(result).toBe("product");
  });

  it("handles string with only special chars → empty string", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });

  it("handles single word", () => {
    expect(slugify("Electronics")).toBe("electronics");
  });

  it("strips leading/trailing hyphens after transform", () => {
    // "!hello!" → "hello" (exclamations stripped, no leading/trailing hyphens)
    expect(slugify("!hello!")).toBe("hello");
  });
});
