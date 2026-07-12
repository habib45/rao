import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "../..");

// TC-1.1.1: TypeScript compilation passes (verified by TSC, but test config exists)
describe("Project Configuration", () => {
  it("tsconfig.json exists and has strict mode", () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(root, "tsconfig.json"), "utf-8")
    );
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  // TC-1.1.2: Path alias @/* resolves
  it("tsconfig has @/* path alias", () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(root, "tsconfig.json"), "utf-8")
    );
    expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
  });

  // TC-1.1.3: Environment variables documented
  it(".env.example documents all required env vars", () => {
    const envExample = fs.readFileSync(
      path.join(root, ".env.example"),
      "utf-8"
    );
    expect(envExample).toContain("NEXT_PUBLIC_SITE_URL");
    expect(envExample).toContain("MYSQL_API_URL");
    expect(envExample).toContain("MYSQL_API_SECRET");
    expect(envExample).toContain("MYSQL_API_JWT_TOKEN");
    // NEXT_PUBLIC_ prefix MUST NOT be used for the gateway JWT — server only.
    expect(envExample).not.toContain("NEXT_PUBLIC_MYSQL_API_JWT_TOKEN");
  });

  it(".env.example omits any real secret values", () => {
    const envExample = fs.readFileSync(
      path.join(root, ".env.example"),
      "utf-8"
    );
    // Keys that must NEVER carry a real value in .env.example (secrets).
    const secretKeys = [
      "MYSQL_API_SECRET",
      "MYSQL_API_JWT_TOKEN",
      "MYSQL_JWT_SECRET",
      "API_TOKEN",
      "AMAZON_ACCESS_KEY",
      "AMAZON_SECRET_KEY",
      "AMAZON_PARTNER_TAG",
      "GEMINI_API_KEY",
      "OPENAI_API_KEY",
      "GROQ_API_KEY",
    ];
    const lines = envExample.split(/\r?\n/);
    const violations: string[] = [];
    for (const key of secretKeys) {
      const re = new RegExp(`^${key}=.+$`);
      for (const line of lines) {
        if (re.test(line) && !line.endsWith("=")) {
          violations.push(line);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  // TC-1.1.4: Vitest configuration loads
  it("vitest.config.ts exists", () => {
    expect(
      fs.existsSync(path.join(root, "vitest.config.ts"))
    ).toBe(true);
  });

  // TC-1.1.5: Tailwind CSS processes utility classes
  it("postcss.config.mjs includes tailwindcss plugin", () => {
    const postcss = fs.readFileSync(
      path.join(root, "postcss.config.mjs"),
      "utf-8"
    );
    expect(postcss).toContain("tailwindcss");
  });

  // TC-1.1.6: No secrets in source code
  it("no real secrets committed in src/", () => {
    const srcDir = path.join(root, "src");
    const files = getAllFiles(srcDir, [".ts", ".tsx"]).filter(
      (f) => !f.includes("__tests__") && !f.includes(".test.")
    );
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      // Check for common secret patterns
      expect(content).not.toMatch(/sk_live_[a-zA-Z0-9]/);
      expect(content).not.toMatch(/eyJhbGciOi[a-zA-Z0-9]/);
    }
  });

  // TC-1.1.7: Package.json has required scripts
  it("package.json has dev, build, test scripts", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf-8")
    );
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });
});

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── Datasource secret handling ───────────────────────────────────────────────

const REAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...REAL_ENV };
});

afterEach(() => {
  process.env = REAL_ENV;
});

describe("datasource secret handling", () => {
  it("throws in production when MYSQL_API_SECRET is missing", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    const { MYSQL_API_SECRET: _drop1, ...rest } = process.env as Record<string, string | undefined>;
    process.env = rest as NodeJS.ProcessEnv;
    await expect(import("@/lib/config/datasource")).rejects.toThrow(
      /MYSQL_API_SECRET/,
    );
  });

  it("throws in production when MYSQL_API_JWT_TOKEN is missing", async () => {
    process.env = { ...process.env, NODE_ENV: "production", MYSQL_API_SECRET: "set" };
    const { MYSQL_API_JWT_TOKEN: _drop2, ...rest } = process.env as Record<string, string | undefined>;
    process.env = rest as NodeJS.ProcessEnv;
    await expect(import("@/lib/config/datasource")).rejects.toThrow(
      /MYSQL_API_JWT_TOKEN/,
    );
  });

  it("uses the dev fallback outside production when secrets are missing", async () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    const { MYSQL_API_SECRET: _s1, MYSQL_API_JWT_TOKEN: _j1, ...rest } = process.env as Record<string, string | undefined>;
    process.env = rest as NodeJS.ProcessEnv;
    const mod = await import("@/lib/config/datasource");
    expect(mod.MYSQL_API_SECRET).toMatch(/dev-only/);
    expect(mod.MYSQL_API_JWT_TOKEN).toMatch(/dev-only/);
  });

  it("does not expose NEXT_PUBLIC_-prefixed gateway JWT", async () => {
    // The renamed token must NOT have a NEXT_PUBLIC_ counterpart in source.
    const srcDir = path.join(root, "src");
    const files = getAllFiles(srcDir, [".ts", ".tsx"]);
    for (const file of files) {
      if (file.includes("__tests__") || file.includes(".test.")) continue;
      const content = fs.readFileSync(file, "utf-8");
      expect(content).not.toContain("NEXT_PUBLIC_MYSQL_API_JWT_TOKEN");
    }
  });
});
