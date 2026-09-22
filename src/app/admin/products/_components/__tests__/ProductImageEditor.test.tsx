/**
 * Tests for the product image editor used inside the admin product
 * edit form. Pins:
 *   - Empty / populated render
 *   - Reorder via up/down + star-to-primary
 *   - Per-image alt-text editor (EN/BN/SV)
 *   - Bulk alt-text (EN only)
 *   - Manual URL add (valid + invalid)
 *   - File upload (mocked) — optimistic placeholder + success + error
 *   - Oversized file rejection
 *   - Clipboard paste (DataTransfer simulation)
 *   - Drag-and-drop reorder
 *   - Drag-and-drop new files into the drop zone
 *   - Remove (with and without server id)
 *   - Media picker dialog → pick → append
 *   - Duplicate URL de-dup
 *   - Move-image out-of-bounds no-op
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

import { ProductImageEditor, type ImageEntry } from "../ProductImageEditor";

function makeFile(name: string, sizeBytes: number, type = "image/png"): File {
  const file = new File([new Uint8Array(sizeBytes)], name, { type });
  return file;
}

function setup(overrides: {
  initial?: ImageEntry[];
  onChange?: Mock<(next: ImageEntry[]) => void>;
  onRemoveById?: Mock<(id: string) => Promise<void> | void>;
} = {}) {
  const onChange: Mock<(next: ImageEntry[]) => void> =
    overrides.onChange ?? vi.fn<(next: ImageEntry[]) => void>();
  const onRemoveById: Mock<(id: string) => Promise<void> | void> =
    overrides.onRemoveById ?? vi.fn<(id: string) => Promise<void> | void>();
  const utils = render(
    <ProductImageEditor
      value={overrides.initial ?? []}
      onChange={onChange}
      onRemoveById={onRemoveById}
    />,
  );
  return { ...utils, onChange, onRemoveById };
}

function lastCallPayload(mock: Mock<(next: ImageEntry[]) => void>): ImageEntry[] {
  return mock.mock.calls[mock.mock.calls.length - 1]![0] as ImageEntry[];
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProductImageEditor — empty / populated render", () => {
  it("renders the empty state with drop zone and CTA when no images are supplied", () => {
    setup();
    expect(screen.getByText(/No images yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload files/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pick from media/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/m\.media-amazon\.com/i)).toBeInTheDocument();
  });

  it("renders existing images with primary badge on the first card", () => {
    const initial: ImageEntry[] = [
      {
        key: "k1",
        id: "i1",
        url: "https://example.com/a.jpg",
        source: "existing",
        is_primary: true,
        sort_order: 0,
      },
      {
        key: "k2",
        id: "i2",
        url: "https://example.com/b.jpg",
        source: "existing",
        is_primary: false,
        sort_order: 1,
      },
    ];
    setup({ initial });
    expect(screen.getByText("Primary")).toBeInTheDocument();
    // The primary card disables its "set as primary" button; only the second
    // card exposes a clickable star.
    const starButtons = screen.getAllByRole("button", { name: /set as primary/i });
    expect(starButtons).toHaveLength(2);
    expect(starButtons[0]).toBeDisabled();
    expect(starButtons[1]).not.toBeDisabled();
    expect(screen.getByText(/2 images/i)).toBeInTheDocument();
  });
});

describe("ProductImageEditor — reorder + primary", () => {
  const seed: ImageEntry[] = [
    { key: "k1", id: "i1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    { key: "k2", id: "i2", url: "https://x/b.jpg", source: "existing", sort_order: 1, is_primary: false },
    { key: "k3", id: "i3", url: "https://x/c.jpg", source: "existing", sort_order: 2, is_primary: false },
  ];

  it("moves an image up when the up arrow is clicked", () => {
    const { onChange } = setup({ initial: seed });
    const cards = screen.getAllByRole("button", { name: /move up/i });
    fireEvent.click(cards[1]!); // move image #2 up
    const last = lastCallPayload(onChange);
    expect(last.map((i) => i.key)).toEqual(["k2", "k1", "k3"]);
  });

  it("disables the up arrow on the first image and the down arrow on the last", () => {
    setup({ initial: seed });
    const upButtons = screen.getAllByRole("button", { name: /move up/i });
    const downButtons = screen.getAllByRole("button", { name: /move down/i });
    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });

  it("clicking the star promotes the chosen image to primary", () => {
    const { onChange } = setup({ initial: seed });
    const stars = screen.getAllByRole("button", { name: /set as primary/i });
    fireEvent.click(stars[1]!); // promote image #2
    const last = lastCallPayload(onChange);
    expect(last[0]!.key).toBe("k2");
    expect(mockToastSuccess).toHaveBeenCalledWith("Primary image updated");
  });

  it("moveImage out-of-bounds is a no-op", () => {
    // Indirect check via the public API: clicking up on the first card is
    // disabled and onChange is not invoked.
    const { onChange } = setup({ initial: seed });
    const upButtons = screen.getAllByRole("button", { name: /move up/i });
    fireEvent.click(upButtons[0]!); // disabled
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ProductImageEditor — alt text", () => {
  const seed: ImageEntry[] = [
    { key: "k1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    { key: "k2", url: "https://x/b.jpg", source: "existing", sort_order: 1, is_primary: false },
  ];

  it("opens the per-image alt-text panel with three locale inputs", () => {
    setup({ initial: seed });
    const altButtons = screen.getAllByRole("button", { name: /toggle alt text/i });
    fireEvent.click(altButtons[0]!);
    const enInput = screen.getAllByPlaceholderText("Alt text")[0]!;
    // The panel is the wrapper that contains the EN, BN, and SV labels and
    // the three input rows. Walk up: <Input>-wrapper → <div class="flex…gap-1.5"> → panel.
    const panel = enInput.parentElement!.parentElement!.parentElement!;
    expect(within(panel).getByText("EN")).toBeInTheDocument();
    expect(within(panel).getByText("BN")).toBeInTheDocument();
    expect(within(panel).getByText("SV")).toBeInTheDocument();
  });

  it("editing alt text for a single locale updates only that locale", () => {
    const { onChange } = setup({ initial: seed });
    const altButtons = screen.getAllByRole("button", { name: /toggle alt text/i });
    fireEvent.click(altButtons[0]!);
    const enInput = screen.getAllByPlaceholderText("Alt text")[0]!;
    fireEvent.change(enInput, { target: { value: "front view" } });
    const last = lastCallPayload(onChange);
    expect(last[0]!.alt?.en).toBe("front view");
    expect(last[0]!.alt?.sv).toBeUndefined();
  });

  it("bulk alt text applies to every image (EN locale only)", () => {
    const { onChange } = setup({ initial: seed });
    const bulk = screen.getByPlaceholderText(/describe the product/i);
    fireEvent.change(bulk, { target: { value: "shared alt" } });
    fireEvent.click(screen.getByRole("button", { name: /apply to all/i }));
    const last = lastCallPayload(onChange);
    expect(last.every((i) => i.alt?.en === "shared alt")).toBe(true);
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining("Alt text applied"),
    );
  });
});

describe("ProductImageEditor — manual URL add", () => {
  it("appends a valid http(s) URL", () => {
    const { onChange } = setup();
    const input = screen.getByPlaceholderText(/https:\/\/m\.media-amazon\.com/i);
    fireEvent.change(input, { target: { value: "https://x.example/img.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: /add url/i }));
    const last = lastCallPayload(onChange);
    expect(last).toHaveLength(1);
    expect(last[0]!.url).toBe("https://x.example/img.jpg");
    expect(last[0]!.source).toBe("manual");
  });

  it("rejects an invalid URL with a toast and does not append", () => {
    const { onChange } = setup();
    const input = screen.getByPlaceholderText(/https:\/\/m\.media-amazon\.com/i);
    fireEvent.change(input, { target: { value: "not-a-url" } });
    fireEvent.click(screen.getByRole("button", { name: /add url/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("valid http(s) URL"),
    );
  });

  it("treats a POSIX absolute path as a local file ref and POSTs to upload-by-path", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ paths: ["/uploads/products/abs.png"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchFn as unknown as typeof fetch);

    const { onChange } = setup();
    const input = screen.getByPlaceholderText(/https:\/\/m\.media-amazon\.com/i);
    fireEvent.change(input, { target: { value: "/home/admin/pics/foo.png" } });
    fireEvent.click(screen.getByRole("button", { name: /add url/i }));

    // First call: optimistic placeholder (url is empty, uploading is true).
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const first = onChange.mock.calls[0]![0] as ImageEntry[];
    expect(first).toHaveLength(1);
    expect(first[0]!.url).toBe("");
    expect(first[0]!.uploading).toBe(true);

    // Then the server endpoint receives a JSON body with the path.
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledWith(
        "/admin/api/public-media/upload-by-path",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        }),
      );
    });
    const calls = fetchFn.mock.calls as unknown as Array<[string, RequestInit?]>;
    const call = calls.find(
      ([url]) => url === "/admin/api/public-media/upload-by-path",
    );
    const init = call?.[1] as { body?: string } | undefined;
    expect(JSON.parse(init!.body!)).toEqual({
      path: "/home/admin/pics/foo.png",
      folder: "products",
    });

    // The placeholder is replaced with the returned URL.
    await waitFor(() => {
      const final = lastCallPayload(onChange);
      expect(final[0]!.url).toBe("/uploads/products/abs.png");
      expect(final[0]!.uploading).toBe(false);
    });
  });

  it("treats a file:// URL as a local file ref and POSTs to upload-by-path", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ paths: ["/uploads/products/lib.png"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchFn);

    setup();
    const input = screen.getByPlaceholderText(/https:\/\/m\.media-amazon\.com/i);
    fireEvent.change(input, { target: { value: "file:///Users/me/Pictures/x.png" } });
    fireEvent.click(screen.getByRole("button", { name: /add url/i }));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledWith(
        "/admin/api/public-media/upload-by-path",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const calls = fetchFn.mock.calls as unknown as Array<[string, RequestInit?]>;
    const call = calls.find(
      ([url]) => url === "/admin/api/public-media/upload-by-path",
    );
    const init = call?.[1] as { body?: string } | undefined;
    expect(JSON.parse(init!.body!)).toEqual({
      path: "file:///Users/me/Pictures/x.png",
      folder: "products",
    });
  });

  it("surfaces a server error from upload-by-path as a toast and marks the placeholder failed", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ error: "path not found" }), { status: 400 }),
    );
    vi.stubGlobal("fetch", fetchFn);

    const { onChange } = setup();
    const input = screen.getByPlaceholderText(/https:\/\/m\.media-amazon\.com/i);
    fireEvent.change(input, { target: { value: "/home/admin/missing.png" } });
    fireEvent.click(screen.getByRole("button", { name: /add url/i }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    const final = lastCallPayload(onChange);
    expect(final[0]!.uploadError).toBe("path not found");
    expect(final[0]!.uploading).toBe(false);
  });

  it("de-duplicates an identical URL on the second add", () => {
    const initial: ImageEntry[] = [
      { key: "k1", url: "https://x/dup.jpg", source: "manual", sort_order: 0, is_primary: true },
    ];
    const { onChange } = setup({ initial });
    const input = screen.getByPlaceholderText(/https:\/\/m\.media-amazon\.com/i);
    fireEvent.change(input, { target: { value: "https://x/dup.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: /add url/i }));
    // appendUnique still calls onChange with the deduplicated list; the
    // observable behaviour is that the length stays the same.
    const last = lastCallPayload(onChange);
    expect(last).toHaveLength(initial.length);
  });
});

describe("ProductImageEditor — file upload", () => {
  it("uploads a single file via the hidden input and replaces the placeholder", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ paths: ["/uploads/products/x.png"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchFn);

    const { onChange } = setup();
    const file = makeFile("x.png", 1024, "image/png");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledWith(
        "/admin/api/public-media/upload",
        expect.objectContaining({ method: "POST" }),
      );
    });
    // Final state: a single image with the returned URL.
    const finalCall = lastCallPayload(onChange);
    expect(finalCall).toHaveLength(1);
    expect(finalCall[0]!.url).toBe("/uploads/products/x.png");
    expect(finalCall[0]!.uploading).toBe(false);
    expect(finalCall[0]!.uploadError).toBeNull();
  });

  it("surfaces an upload error via toast and marks the placeholder as failed", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
    );
    vi.stubGlobal("fetch", fetchFn);

    const { onChange } = setup();
    const file = makeFile("bad.png", 1024, "image/png");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining("bad.png"),
      );
    });
    const finalCall = lastCallPayload(onChange);
    expect(finalCall[0]!.url).toBe(""); // placeholder kept
    expect(finalCall[0]!.uploading).toBe(false);
    expect(finalCall[0]!.uploadError).toMatch(/boom|Upload failed/);
  });

  it("rejects files over 10 MB with a toast and does not upload", () => {
    const fetchFn = vi.fn();
    vi.stubGlobal("fetch", fetchFn);
    const { onChange } = setup();
    const big = makeFile("huge.png", 11 * 1024 * 1024, "image/png");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [big] } });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("10 MB limit"),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects non-image files with a toast", () => {
    const fetchFn = vi.fn();
    vi.stubGlobal("fetch", fetchFn);
    const { onChange } = setup();
    const pdf = makeFile("doc.pdf", 1024, "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("image files only"),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uploads the small files in a mixed batch and skips oversized ones", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ paths: ["/uploads/products/x.png"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchFn);

    const { onChange } = setup();
    const small = makeFile("ok.png", 1024, "image/png");
    const huge = makeFile("huge.png", 11 * 1024 * 1024, "image/png");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [small, huge] } });

    // The oversize warning is surfaced immediately.
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("huge.png"),
    );
    // The small file still uploads; the huge one is skipped without
    // aborting the batch.
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalled();
    });
    const finalCall = lastCallPayload(onChange);
    expect(finalCall).toHaveLength(1);
    expect(finalCall[0]!.url).toBe("/uploads/products/x.png");
    expect(finalCall[0]!.uploading).toBe(false);
  });

  it("skips non-image files in a mixed batch but still uploads the images", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ paths: ["/uploads/products/x.png"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchFn);

    const { onChange } = setup();
    const img = makeFile("ok.png", 1024, "image/png");
    const doc = makeFile("readme.txt", 1024, "text/plain");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [img, doc] } });

    // Non-image files get a separate "Skipped N non-image files" toast.
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("Skipped 1 non-image file"),
    );
    // The image still uploads.
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalled();
    });
    const finalCall = lastCallPayload(onChange);
    expect(finalCall).toHaveLength(1);
  });
});

describe("ProductImageEditor — clipboard paste", () => {
  it("triggers upload when an image is pasted into an image card", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ paths: ["/uploads/pasted.png"] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchFn);

    const initial: ImageEntry[] = [
      { key: "k1", id: "i1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    ];
    setup({ initial });
    // URL is rendered with the protocol stripped — locate the card via
    // the data-testid we set on the ImageCard wrapper.
    const card = screen.getByTestId("image-card-0");

    const file = makeFile("pasted.png", 256, "image/png");
    const items = [{ kind: "file", type: "image/png", getAsFile: () => file }];
    const clipboardData = { items } as unknown as DataTransfer;
    fireEvent.paste(card, { clipboardData });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledWith(
        "/admin/api/public-media/upload",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});

describe("ProductImageEditor — DnD reorder + drop zone", () => {
  const seed: ImageEntry[] = [
    { key: "k1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    { key: "k2", url: "https://x/b.jpg", source: "existing", sort_order: 1, is_primary: false },
  ];

  it("reorders images on drag/drop between cards", () => {
    const { onChange } = setup({ initial: seed });
    const cards = document.querySelectorAll('[data-testid^="image-card-"]');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const source = cards[0]! as HTMLElement;
    const target = cards[1]! as HTMLElement;
    expect(source.getAttribute("draggable")).not.toBe("false");
    expect(target.getAttribute("draggable")).not.toBe("false");

    const dataTransfer = {
      getData: (kind: string) => (kind === "text/plain" ? "0" : ""),
      setData: vi.fn(),
      effectAllowed: "",
      dropEffect: "",
      files: [] as File[],
    } as unknown as DataTransfer;
    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(source);
    expect(onChange).toHaveBeenCalled();
    // Some version of the reorder should appear in the latest payload.
    const calls = onChange.mock.calls.map(
      (c) => (c[0] as ImageEntry[]).map((i) => i.key).join(","),
    );
    expect(calls).toContain("k2,k1");
  });

  it("dropping image files into the drop zone triggers upload", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ paths: ["/uploads/products/drop.png"] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchFn);

    setup();
    const file = makeFile("drop.png", 1024, "image/png");
    const dataTransfer = { files: [file] } as unknown as DataTransfer;
    // Walk up from the "Drop image files here" label to the dashed drop zone.
    const label = screen.getByText(/drop image files here/i);
    const zone = label.closest('[class*="border-dashed"]')!;
    fireEvent.drop(zone, { dataTransfer });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledWith(
        "/admin/api/public-media/upload",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});

describe("ProductImageEditor — remove", () => {
  it("removes an image locally when it has no server id (no API call)", () => {
    const initial: ImageEntry[] = [
      { key: "k1", url: "https://x/a.jpg", source: "upload", sort_order: 0, is_primary: true },
    ];
    const { onChange, onRemoveById } = setup({ initial });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    expect(onRemoveById).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    const last = lastCallPayload(onChange);
    expect(last).toHaveLength(0);
  });

  it("removes an image with a server id via the onRemoveById callback", async () => {
    const onRemoveById = vi.fn<(id: string) => Promise<void>>(async () => undefined);
    const initial: ImageEntry[] = [
      { key: "k1", id: "i1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    ];
    const { onChange } = setup({ initial, onRemoveById });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    await waitFor(() => {
      expect(onRemoveById).toHaveBeenCalledWith("i1");
    });
    await waitFor(() => {
      const last = lastCallPayload(onChange);
      expect(last).toHaveLength(0);
    });
  });

  it("optimistically removes the image from the list BEFORE the delete resolves", () => {
    // A delete that never resolves simulates a slow network. The UI
    // should still reflect the deletion immediately, not block on the
    // server response.
    const onRemoveById = vi.fn<(id: string) => Promise<void>>(
      () => new Promise(() => {}), // never resolves
    );
    const initial: ImageEntry[] = [
      { key: "k1", id: "i1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    ];
    const { onChange } = setup({ initial, onRemoveById });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    // Synchronous: the image is already gone from the working list even
    // though the DELETE request is still in flight.
    const last = lastCallPayload(onChange);
    expect(last).toHaveLength(0);
    expect(onRemoveById).toHaveBeenCalledWith("i1");
  });

  it("re-inserts the image at its original index when the delete fails", async () => {
    const onRemoveById = vi.fn<(id: string) => Promise<void>>(async () => {
      throw new Error("server down");
    });
    const initial: ImageEntry[] = [
      { key: "k1", id: "i1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    ];
    const { onChange } = setup({ initial, onRemoveById });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    // Optimistic remove happens synchronously.
    expect(lastCallPayload(onChange)).toHaveLength(0);
    // The async delete rejects, so the editor restores the row at its
    // original position. The parent already toasts the error.
    await waitFor(() => {
      const last = lastCallPayload(onChange);
      expect(last).toHaveLength(1);
      expect(last[0]!.id).toBe("i1");
    });
  });

  it("keeps the optimistic removal when onRemoveById resolves successfully", async () => {
    const onRemoveById = vi.fn<(id: string) => Promise<void>>(async () => undefined);
    const initial: ImageEntry[] = [
      { key: "k1", id: "i1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    ];
    const { onChange } = setup({ initial, onRemoveById });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    // Optimistic remove stays; a clean resolve does not restore the row.
    await waitFor(() => {
      expect(onRemoveById).toHaveBeenCalledWith("i1");
    });
    expect(lastCallPayload(onChange)).toHaveLength(0);
  });

  it("does not remove if the confirm dialog is cancelled", () => {
    const initial: ImageEntry[] = [
      { key: "k1", id: "i1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    ];
    const { onChange, onRemoveById } = setup({ initial });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    expect(onRemoveById).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ProductImageEditor — media picker dialog", () => {
  it("opens the picker, lists files, and appends the chosen one", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : (input as URL).toString();
      if (url.startsWith("/admin/api/public-media")) {
        // Mirror the real API response shape — items expose `publicUrl`,
        // not `url`. Folders have `publicUrl === null` and `isFolder: true`.
        return new Response(
          JSON.stringify({
            items: [
              {
                name: "lib1.png",
                publicUrl: "https://cdn/lib1.png",
                isFolder: false,
                path: "products/lib1.png",
              },
              {
                name: "lib2.png",
                publicUrl: "https://cdn/lib2.png",
                isFolder: false,
                path: "products/lib2.png",
              },
              {
                name: "subfolder",
                publicUrl: null,
                isFolder: true,
                path: "products/subfolder",
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchFn);

    const { onChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: /pick from media/i }));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "lib1.png" })).toBeInTheDocument();
    });
    // Folder entries are filtered out of the tile grid.
    expect(screen.queryByRole("img", { name: "subfolder" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("img", { name: "lib1.png" }));
    fireEvent.click(screen.getByRole("button", { name: /choose/i }));

    const last = lastCallPayload(onChange);
    expect(last).toHaveLength(1);
    expect(last[0]!.url).toBe("https://cdn/lib1.png");
    expect(last[0]!.source).toBe("picker");
  });

  it("shows the empty-folder hint when the API returns no images", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : (input as URL).toString();
      if (url.startsWith("/admin/api/public-media")) {
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchFn);

    setup();
    fireEvent.click(screen.getByRole("button", { name: /pick from media/i }));

    await waitFor(() => {
      expect(screen.getByText(/No files in this folder/i)).toBeInTheDocument();
    });
  });
});

describe("ProductImageEditor — clear all", () => {
  it("clears all images when the user confirms", () => {
    const initial: ImageEntry[] = [
      { key: "k1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
      { key: "k2", url: "https://x/b.jpg", source: "existing", sort_order: 1, is_primary: false },
    ];
    const { onChange } = setup({ initial });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    const last = lastCallPayload(onChange);
    expect(last).toHaveLength(0);
  });

  it("does not clear when the user cancels", () => {
    const initial: ImageEntry[] = [
      { key: "k1", url: "https://x/a.jpg", source: "existing", sort_order: 0, is_primary: true },
    ];
    const { onChange } = setup({ initial });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});