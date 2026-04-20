import { describe, it, expect } from "vitest";
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
    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(envExample).toContain("NEXT_PUBLIC_SITE_URL");
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
      expect(content).not.toMatch(
        /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]+['"]/
      );
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
