import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { PublishScheduler } from "../PublishScheduler";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PublishScheduler", () => {
  it("renders datetime input + Schedule button, disabled until a future date is picked", () => {
    render(<PublishScheduler productId="p1" currentPublishAt={null} />);
    expect(screen.getByLabelText(/Publish at/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^schedule$/i })).toBeDisabled();
  });

  it("enables the Schedule button when a future datetime is entered", () => {
    render(<PublishScheduler productId="p1" currentPublishAt={null} />);
    const input = screen.getByLabelText(/Publish at/i);
    const future = new Date(Date.now() + 3600_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const value =
      `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}` +
      `T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    fireEvent.change(input, { target: { value } });
    expect(screen.getByRole("button", { name: /^schedule$/i })).toBeEnabled();
  });

  it("Schedule button PATCHes publish_at as ISO UTC", async () => {
    const fetchFn = setFetch(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );

    render(<PublishScheduler productId="p1" currentPublishAt={null} />);
    const input = screen.getByLabelText(/Publish at/i);
    const future = new Date(Date.now() + 3600_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const value =
      `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}` +
      `T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    fireEvent.change(input, { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: /^schedule$/i }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("/admin/api/products/p1");
    expect(init?.method).toBe("PATCH");
    const body = JSON.parse(init!.body as string);
    expect(typeof body.publish_at).toBe("string");
    expect(body.publish_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("Publish Now PATCHes is_active=true and publish_at=null", async () => {
    const fetchFn = setFetch(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );

    render(<PublishScheduler productId="p7" currentPublishAt={null} />);
    fireEvent.click(screen.getByRole("button", { name: /publish now/i }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchFn.mock.calls[0][1]!.body as string);
    expect(body).toEqual({ is_active: true, publish_at: null });
  });

  it('Clear schedule appears when currentPublishAt is set and PATCHes publish_at=null', async () => {
    const fetchFn = setFetch(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );

    render(
      <PublishScheduler productId="p9" currentPublishAt="2099-06-01T00:00:00.000Z" />,
    );

    const clear = screen.getByRole("button", { name: /clear schedule/i });
    expect(clear).toBeInTheDocument();
    fireEvent.click(clear);

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchFn.mock.calls[0][1]!.body as string);
    expect(body).toEqual({ publish_at: null });
  });
});
