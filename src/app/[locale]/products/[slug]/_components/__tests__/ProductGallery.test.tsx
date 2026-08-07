/**
 * Tests for the public product-gallery component (thumbnail swap + lightbox).
 *
 * Pinned behaviour:
 *   - The image flagged `is_primary: true` is the initially active one.
 *   - Clicking a thumbnail swaps the main image (no network change; the
 *     <Image src> attribute updates).
 *   - Clicking the main image opens the lightbox (role="dialog" appears).
 *   - The lightbox can be closed via the close button.
 *   - The active thumbnail gets an `aria-selected="true"` marker so
 *     screen readers can track the current selection.
 *   - When there's exactly one image, no thumbnail row is rendered (no
 *     need for a "swap me with myself" UX).
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { ProductGallery } from "../ProductGallery";

afterEach(cleanup);

const img = (overrides: Partial<{ id: string; url: string; is_primary: boolean; sort_order: number }> = {}) => ({
  id: overrides.id ?? "img-1",
  url: overrides.url ?? "/uploads/a.png",
  alt_text: { en: "alt-en" },
  width: null,
  height: null,
  sort_order: overrides.sort_order ?? 0,
  is_primary: overrides.is_primary ?? false,
});

describe("<ProductGallery />", () => {
  it("starts on the primary image when one is flagged", () => {
    render(
      <ProductGallery
        images={[
          img({ id: "a", url: "/uploads/a.png", is_primary: false, sort_order: 1 }),
          img({ id: "p", url: "/uploads/p.png", is_primary: true, sort_order: 0 }),
          img({ id: "b", url: "/uploads/b.png", is_primary: false, sort_order: 2 }),
        ]}
        productName="Widget"
        locale="en"
      />,
    );
    // The primary image is selected in the tablist.
    const tablist = screen.getByRole("tablist");
    const selected = within(tablist).getByRole("tab", { selected: true });
    expect(selected.getAttribute("aria-label")).toMatch(/image 2 of 3/);
  });

  it("swaps the main image when a thumbnail is clicked", () => {
    render(
      <ProductGallery
        images={[
          img({ id: "a", url: "/uploads/a.png", is_primary: true, sort_order: 0 }),
          img({ id: "b", url: "/uploads/b.png", is_primary: false, sort_order: 1 }),
        ]}
        productName="Widget"
        locale="en"
      />,
    );

    // Initially the main button's label mentions image 1.
    const mainButton = screen.getByRole("button", {
      name: /enlarge image 1 of 2/i,
    });
    expect(mainButton).toBeInTheDocument();

    // Click thumbnail #2.
    const tablist = screen.getByRole("tablist");
    const secondThumb = within(tablist).getByRole("tab", {
      name: /image 2 of 2/i,
    });
    fireEvent.click(secondThumb);

    // The main button's label should now mention image 2 of 2.
    expect(
      screen.getByRole("button", { name: /enlarge image 2 of 2/i }),
    ).toBeInTheDocument();

    // And the second thumbnail should be aria-selected.
    expect(secondThumb.getAttribute("aria-selected")).toBe("true");

    // Cleanup: the stale mainButton reference is no longer in the DOM with
    // that label — we don't assert on it directly.
    void mainButton;
  });

  it("opens the lightbox when the main image is clicked", () => {
    render(
      <ProductGallery
        images={[img({ id: "a", url: "/uploads/a.png", is_primary: true })]}
        productName="Widget"
        locale="en"
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /enlarge image 1 of 1/i }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the lightbox via the close button", () => {
    render(
      <ProductGallery
        images={[img({ id: "a", url: "/uploads/a.png", is_primary: true })]}
        productName="Widget"
        locale="en"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /enlarge image 1 of 1/i }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close enlarged/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not render the thumbnail row when there is only one image", () => {
    render(
      <ProductGallery
        images={[img({ id: "a", url: "/uploads/a.png", is_primary: true })]}
        productName="Widget"
        locale="en"
      />,
    );
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});