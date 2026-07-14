import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  isRemoveOrphanUploadsEnabled,
  removeOrphanUploads,
  resolveSafeUploadPath,
} from "@/lib/uploads/remove-orphan-uploads";

const ORIGINAL_ENV = { ...process.env };

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "uploads-test-"));
  process.env.FEATURE_REMOVE_ORPHAN_UPLOADS = "true";
});

afterEach(async () => {
  process.env = { ...ORIGINAL_ENV };
  if (tmpRoot) await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function writeFile(rel: string, content = "x"): Promise<string> {
  const abs = path.join(tmpRoot, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content);
  return abs;
}

describe("resolveSafeUploadPath", () => {
  it("rejects external URLs", () => {
    expect(resolveSafeUploadPath("https://m.media-amazon.com/x.jpg", tmpRoot)).toBeNull();
    expect(resolveSafeUploadPath("http://example.com/x.jpg", tmpRoot)).toBeNull();
  });

  it("rejects URLs that don't start with /uploads/", () => {
    expect(resolveSafeUploadPath("/static/foo.png", tmpRoot)).toBeNull();
    expect(resolveSafeUploadPath("uploads/foo.png", tmpRoot)).toBeNull();
    expect(resolveSafeUploadPath("", tmpRoot)).toBeNull();
  });

  it("resolves a normal /uploads/ URL", () => {
    const resolved = resolveSafeUploadPath("/uploads/products/apple.png", tmpRoot);
    expect(resolved).toBe(path.join(tmpRoot, "products/apple.png"));
  });

  it("blocks path-traversal attempts", () => {
    expect(resolveSafeUploadPath("/uploads/../etc/passwd", tmpRoot)).toBeNull();
    expect(resolveSafeUploadPath("/uploads/%2e%2e/etc/passwd", tmpRoot)).toBeNull();
    expect(resolveSafeUploadPath("/uploads/../../package.json", tmpRoot)).toBeNull();
  });

  it("blocks null bytes", () => {
    expect(resolveSafeUploadPath("/uploads/foo%00.png", tmpRoot)).toBeNull();
  });
});

describe("isRemoveOrphanUploadsEnabled", () => {
  it("defaults to false when env var is unset", () => {
    delete process.env.FEATURE_REMOVE_ORPHAN_UPLOADS;
    expect(isRemoveOrphanUploadsEnabled()).toBe(false);
  });

  it("returns true when env var is 'true' / '1'", () => {
    process.env.FEATURE_REMOVE_ORPHAN_UPLOADS = "true";
    expect(isRemoveOrphanUploadsEnabled()).toBe(true);
    process.env.FEATURE_REMOVE_ORPHAN_UPLOADS = "1";
    expect(isRemoveOrphanUploadsEnabled()).toBe(true);
  });

  it("returns false for anything else", () => {
    process.env.FEATURE_REMOVE_ORPHAN_UPLOADS = "yes-please";
    expect(isRemoveOrphanUploadsEnabled()).toBe(false);
  });
});

describe("removeOrphanUploads — end-to-end behavior", () => {
  it("unlinks a removed local /uploads/ file", async () => {
    const abs = await writeFile("products/apple.png");
    expect(await fs.stat(abs)).toBeTruthy();

    const outcome = await removeOrphanUploads({
      previous: [{ url: "/uploads/products/apple.png" }],
      next: [],
      uploadRoot: tmpRoot,
    });

    expect(outcome.unlinked).toEqual([abs]);
    expect(outcome.failed).toEqual([]);
    expect(outcome.externalIgnored).toEqual([]);
    expect(outcome.unsafeIgnored).toEqual([]);
    expect(outcome.preservedShared).toEqual([]);
    await expect(fs.stat(abs)).rejects.toThrow();
  });

  it("ignores external (non-/uploads/) URLs", async () => {
    const outcome = await removeOrphanUploads({
      previous: [
        { url: "https://m.media-amazon.com/images/I/x.jpg" },
        { url: "http://example.com/foo.png" },
      ],
      next: [],
      uploadRoot: tmpRoot,
    });

    expect(outcome.unlinked).toEqual([]);
    expect(outcome.externalIgnored.length).toBe(2);
  });

  it("treats a missing file as success (ENOENT idempotent)", async () => {
    const outcome = await removeOrphanUploads({
      previous: [{ url: "/uploads/products/never-existed.png" }],
      next: [],
      uploadRoot: tmpRoot,
    });

    expect(outcome.unlinked).toEqual([]);
    expect(outcome.failed).toEqual([]);
  });

  it("does not touch files that are still in the next list", async () => {
    const abs = await writeFile("products/keep.png");
    await removeOrphanUploads({
      previous: [{ url: "/uploads/products/keep.png" }],
      next: [{ url: "/uploads/products/keep.png" }],
      uploadRoot: tmpRoot,
    });
    expect(await fs.stat(abs)).toBeTruthy();
  });

  it("preserves files that are still referenced by another product", async () => {
    const abs = await writeFile("products/shared.png");
    const outcome = await removeOrphanUploads({
      previous: [{ url: "/uploads/products/shared.png" }],
      next: [],
      isUrlStillReferenced: () => true,
      uploadRoot: tmpRoot,
    });

    expect(outcome.preservedShared).toEqual(["/uploads/products/shared.png"]);
    expect(outcome.unlinked).toEqual([]);
    expect(await fs.stat(abs)).toBeTruthy();
  });

  it("keeps nothing when the oracle says the URL is no longer referenced", async () => {
    const abs = await writeFile("products/unique-now.png");
    const outcome = await removeOrphanUploads({
      previous: [{ url: "/uploads/products/unique-now.png" }],
      next: [],
      isUrlStillReferenced: () => false,
      uploadRoot: tmpRoot,
    });

    expect(outcome.preservedShared).toEqual([]);
    expect(outcome.unlinked).toEqual([abs]);
    await expect(fs.stat(abs)).rejects.toThrow();
  });

  it("rejects path-traversal URLs as unsafe", async () => {
    const outcome = await removeOrphanUploads({
      previous: [{ url: "/uploads/../package.json" }],
      next: [],
      uploadRoot: tmpRoot,
    });

    expect(outcome.unsafeIgnored).toEqual(["/uploads/../package.json"]);
    expect(outcome.unlinked).toEqual([]);
  });

  it("captures real I/O errors (not ENOENT) as failures", async () => {
    // Make a directory where the helper expects a file: unlink will fail
    // with `EISDIR`. We assert the failure is recorded, not silently dropped.
    await writeFile("products/is-a-dir.png"); // creates the file
    await fs.rm(path.join(tmpRoot, "products/is-a-dir.png")); // then remove
    await fs.mkdir(path.join(tmpRoot, "products/is-a-dir.png")); // then make dir

    const outcome = await removeOrphanUploads({
      previous: [{ url: "/uploads/products/is-a-dir.png" }],
      next: [],
      uploadRoot: tmpRoot,
    });

    expect(outcome.failed.length).toBe(1);
    expect(outcome.failed[0].code).toBe("EISDIR");
    expect(outcome.unlinked).toEqual([]);
  });
});
