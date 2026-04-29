import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { AsinImportWidget } from "../dashboard/AsinImportWidget";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("AsinImportWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the ASIN input and a disabled Sync button initially", () => {
    render(<AsinImportWidget />);
    expect(screen.getByLabelText(/ASIN/i)).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: /sync/i });
    expect(submit).toBeDisabled();
  });

  it("enables the Sync button for a 10-char uppercase ASIN", () => {
    render(<AsinImportWidget />);
    const input = screen.getByLabelText(/ASIN/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "B0ABCDEFGH" } });
    expect(input.value).toBe("B0ABCDEFGH");
    expect(screen.getByRole("button", { name: /sync/i })).toBeEnabled();
  });

  it("keeps the Sync button disabled for short ASINs", () => {
    render(<AsinImportWidget />);
    fireEvent.change(screen.getByLabelText(/ASIN/i), { target: { value: "ABC" } });
    expect(screen.getByRole("button", { name: /sync/i })).toBeDisabled();
  });

  it("uppercases input typed in lowercase", () => {
    render(<AsinImportWidget />);
    const input = screen.getByLabelText(/ASIN/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "b0abcdefgh" } });
    expect(input.value).toBe("B0ABCDEFGH");
  });

  it("shows loading text while fetching and success banner afterwards", async () => {
    let resolveFetch!: (v: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    setFetch(() => fetchPromise);

    render(<AsinImportWidget />);
    fireEvent.change(screen.getByLabelText(/ASIN/i), { target: { value: "B0ABCDEFGH" } });
    fireEvent.click(screen.getByRole("button", { name: /sync/i }));

    expect(screen.getByRole("button", { name: /syncing/i })).toBeDisabled();

    resolveFetch(
      new Response(
        JSON.stringify({
          product_id: "prod-1",
          asin: "B0ABCDEFGH",
          name: { en: "Wireless Headphones" },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const link = await screen.findByRole("link", { name: /open draft/i });
    expect(link).toHaveAttribute("href", "/admin/products/prod-1");
    expect(screen.getByText(/Wireless Headphones/)).toBeInTheDocument();
  });

  it("shows an error banner when the fetch returns a non-2xx JSON body", async () => {
    setFetch(
      async () =>
        new Response(JSON.stringify({ error: "Amazon import failed: boom" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
    );

    render(<AsinImportWidget />);
    fireEvent.change(screen.getByLabelText(/ASIN/i), { target: { value: "B0ABCDEFGH" } });
    fireEvent.click(screen.getByRole("button", { name: /sync/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/Amazon import failed: boom/);
  });
});
