import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const messagesDir = path.resolve(__dirname, "../../../messages");

function loadJson(filename: string): Record<string, unknown> {
  const filePath = path.join(messagesDir, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function getNestedKeys(
  obj: Record<string, unknown>,
  prefix = ""
): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      keys.push(
        ...getNestedKeys(obj[key] as Record<string, unknown>, fullKey)
      );
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValues(obj: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const val of Object.values(obj)) {
    if (typeof val === "object" && val !== null) {
      values.push(...getNestedValues(val as Record<string, unknown>));
    } else if (typeof val === "string") {
      values.push(val);
    }
  }
  return values;
}

// TC-1.4.27: All message files exist
describe("Message file existence", () => {
  it("en.json exists", () => {
    expect(fs.existsSync(path.join(messagesDir, "en.json"))).toBe(true);
  });

  it("bn-BD.json exists", () => {
    expect(fs.existsSync(path.join(messagesDir, "bn-BD.json"))).toBe(true);
  });

  it("sv.json exists", () => {
    expect(fs.existsSync(path.join(messagesDir, "sv.json"))).toBe(true);
  });
});

// TC-1.4.30: Message files are valid JSON
describe("Message files are valid JSON", () => {
  it("en.json parses without error", () => {
    expect(() => loadJson("en.json")).not.toThrow();
  });

  it("bn-BD.json parses without error", () => {
    expect(() => loadJson("bn-BD.json")).not.toThrow();
  });

  it("sv.json parses without error", () => {
    expect(() => loadJson("sv.json")).not.toThrow();
  });
});

// TC-1.4.28: All message files have matching keys
describe("Message key completeness", () => {
  it("bn-BD.json has every key that en.json has", () => {
    const enKeys = getNestedKeys(loadJson("en.json"));
    const bnKeys = getNestedKeys(loadJson("bn-BD.json"));
    for (const key of enKeys) {
      expect(bnKeys, `Missing key: ${key}`).toContain(key);
    }
  });

  it("sv.json has every key that en.json has", () => {
    const enKeys = getNestedKeys(loadJson("en.json"));
    const svKeys = getNestedKeys(loadJson("sv.json"));
    for (const key of enKeys) {
      expect(svKeys, `Missing key: ${key}`).toContain(key);
    }
  });
});

// TC-1.4.29: No empty string values in en.json
describe("English message values", () => {
  it("has no empty string values in en.json", () => {
    const values = getNestedValues(loadJson("en.json"));
    for (const value of values) {
      expect(value.length, `Empty value found in en.json`).toBeGreaterThan(0);
    }
  });
});

// TC-1.4.31: Message files handle interpolation syntax
describe("Interpolation syntax", () => {
  it("product.rating contains {rating} placeholder in all locales", () => {
    const en = loadJson("en.json") as { product: { rating: string } };
    const bn = loadJson("bn-BD.json") as { product: { rating: string } };
    const sv = loadJson("sv.json") as { product: { rating: string } };

    expect(en.product.rating).toContain("{rating}");
    expect(bn.product.rating).toContain("{rating}");
    expect(sv.product.rating).toContain("{rating}");
  });
});

// TC-1.4.32: Bengali text in messages is valid Unicode
describe("Bengali Unicode validation", () => {
  it("bn-BD.json contains Bengali script characters", () => {
    const values = getNestedValues(loadJson("bn-BD.json"));
    const hasBengali = values.some((v) => /[\u0980-\u09FF]/.test(v));
    expect(hasBengali).toBe(true);
  });
});
