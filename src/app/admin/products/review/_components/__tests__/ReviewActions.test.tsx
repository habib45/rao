import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

const { mockRefresh, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

import { ReviewActions } from "../ReviewActions";

const PRODUCT_ID = "p-123";

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn(
    () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }) as unknown as Promise<Response>
  ) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
});

describe("ReviewActions", () => {
  it("approves the product via the approve endpoint", async () => {
    render(<ReviewActions productId={PRODUCT_ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/admin/api/products/${PRODUCT_ID}/approve`,
        { method: "POST" }
      );
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Product approved");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows the rejection reason input when Reject is clicked", () => {
    render(<ReviewActions productId={PRODUCT_ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(screen.getByLabelText("Rejection reason")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm Reject" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("rejects with the provided reason", async () => {
    render(<ReviewActions productId={PRODUCT_ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    const textarea = screen.getByLabelText("Rejection reason");
    fireEvent.change(textarea, { target: { value: "Image quality too low" } });

    fireEvent.click(screen.getByRole("button", { name: "Confirm Reject" }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/admin/api/products/${PRODUCT_ID}/reject`,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const callArgs = fetchMock.mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const parsedBody = JSON.parse(init.body as string);
    expect(parsedBody).toEqual({ reason: "Image quality too low" });
    expect(mockToastSuccess).toHaveBeenCalledWith("Product rejected");
  });

  it("shows an error toast on approve failure", async () => {
    globalThis.fetch = vi.fn(
      () =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Boom" }),
        }) as unknown as Promise<Response>
    ) as unknown as typeof fetch;

    render(<ReviewActions productId={PRODUCT_ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Boom");
    });
  });
});
