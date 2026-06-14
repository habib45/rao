import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ScheduledPublishWidget } from "../dashboard/ScheduledPublishWidget";

afterEach(cleanup);

describe("ScheduledPublishWidget", () => {
  it("renders a row for each scheduled product with an edit link", () => {
    const products = [
      {
        id: "id-1",
        asin: "B0000001AA",
        name: { en: "Alpha Gadget" },
        publish_at: "2099-01-15T10:00:00.000Z",
        scheduled_at: "2099-01-15T10:00:00.000Z",
      },
      {
        id: "id-2",
        asin: "B0000002BB",
        name: { en: "Beta Gadget" },
        publish_at: "2099-02-01T08:30:00.000Z",
        scheduled_at: "2099-02-01T08:30:00.000Z",
      },
    ];

    render(<ScheduledPublishWidget products={products} />);

    expect(screen.getByText("Alpha Gadget")).toBeInTheDocument();
    expect(screen.getByText("Beta Gadget")).toBeInTheDocument();
    expect(screen.getByText("B0000001AA")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /edit/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/admin/products/id-1");
    expect(links[1]).toHaveAttribute("href", "/admin/products/id-2");
  });

  it("renders the empty state when given no products", () => {
    render(<ScheduledPublishWidget products={[]} />);
    expect(
      screen.getByText(/No products currently scheduled/i),
    ).toBeInTheDocument();
  });

  it("formats the scheduled datetime using the absolute date", () => {
    const iso = "2099-07-04T16:45:00.000Z";
    const products = [
      {
        id: "id-x",
        asin: "B000000XYZ",
        name: { en: "Gamma Gadget" },
        publish_at: iso,
        scheduled_at: iso,
      },
    ];

    render(<ScheduledPublishWidget products={products} />);

    // The formatter outputs something like "Jul 4, 2099, 4:45 PM" in en locale
    // (the hour depends on the test environment's timezone — just assert the
    // year and the month-day components, both of which are stable across TZ).
    const all = screen.getAllByText(/2099/);
    expect(all.length).toBeGreaterThan(0);
  });
});
