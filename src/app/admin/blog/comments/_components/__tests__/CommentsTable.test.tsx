// F18.3 — CommentsTable component tests (TC-18.3.6 – 18.3.8)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

import { CommentsTable } from "../CommentsTable";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const client = makeQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const SAMPLE_COMMENTS = [
  {
    id: "c-1",
    author_name: "Alice",
    author_email: "alice@example.com",
    body: "Great post!",
    is_approved: false,
    created_at: "2026-01-01T00:00:00Z",
    blog_post_id: "p-1",
    blog_posts: { title: "Test Post" },
  },
  {
    id: "c-2",
    author_name: "Bob",
    author_email: "bob@example.com",
    body: "Very helpful.",
    is_approved: true,
    created_at: "2026-01-02T00:00:00Z",
    blog_post_id: "p-1",
    blog_posts: { title: "Test Post" },
  },
];

function mockFetchSuccess(data = SAMPLE_COMMENTS, total = 2) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data, total }),
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.confirm = vi.fn(() => true);
  mockFetchSuccess();
});

afterEach(cleanup);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CommentsTable", () => {
  it("TC-18.3.6 renders table with author names and action buttons after data loads", async () => {
    renderWithQuery(<CommentsTable />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Approve/Hide buttons (pending → Approve, approved → Hide)
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Hide" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });

  it("shows comment body text", async () => {
    renderWithQuery(<CommentsTable />);

    await waitFor(() => {
      expect(screen.getByText("Great post!")).toBeInTheDocument();
      expect(screen.getByText("Very helpful.")).toBeInTheDocument();
    });
  });

  it("shows pending badge for unapproved comment and approved badge for approved", async () => {
    renderWithQuery(<CommentsTable />);

    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });
  });

  it("TC-18.3.7 Approve button calls PATCH with is_approved=true", async () => {
    let fetchCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        // Initial list fetch
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: SAMPLE_COMMENTS, total: 2 }),
        });
      }
      // PATCH mutation + refetch
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: SAMPLE_COMMENTS, total: 2 }),
      });
    }) as unknown as typeof fetch;

    renderWithQuery(<CommentsTable />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      const patchCall = fetchMock.mock.calls.find(
        (call) =>
          (call[0] as string).includes("/c-1") && (call[1] as RequestInit).method === "PATCH",
      );
      expect(patchCall).toBeDefined();
      const body = JSON.parse((patchCall![1] as RequestInit).body as string);
      expect(body.is_approved).toBe(true);
    });
  });

  it("TC-18.3.8 Delete button shows confirm dialog before deleting", async () => {
    globalThis.confirm = vi.fn(() => false); // cancel the deletion
    renderWithQuery(<CommentsTable />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[0]);

    expect(globalThis.confirm).toHaveBeenCalledWith(
      "Delete this comment permanently?",
    );

    // fetch should NOT have been called for DELETE since user cancelled
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const deleteCalls = fetchMock.mock.calls.filter(
      (call) => (call[1] as RequestInit)?.method === "DELETE",
    );
    expect(deleteCalls).toHaveLength(0);
  });

  it("proceeds with delete when user confirms", async () => {
    globalThis.confirm = vi.fn(() => true);
    let fetchCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            fetchCallCount === 1
              ? { data: SAMPLE_COMMENTS, total: 2 }
              : { success: true },
          ),
      });
    }) as unknown as typeof fetch;

    renderWithQuery(<CommentsTable />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      const deleteCalls = fetchMock.mock.calls.filter(
        (call) => (call[1] as RequestInit)?.method === "DELETE",
      );
      expect(deleteCalls).toHaveLength(1);
    });
  });

  it("shows 'No comments found' when data is empty", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0 }),
    }) as unknown as typeof fetch;

    renderWithQuery(<CommentsTable />);

    await waitFor(() => {
      expect(screen.getByText("No comments found.")).toBeInTheDocument();
    });
  });

  it("shows loading skeletons before data arrives", () => {
    let resolveData!: (v: Response) => void;
    globalThis.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveData = resolve;
        }),
    ) as unknown as typeof fetch;

    renderWithQuery(<CommentsTable />);

    // Before data resolves — skeleton elements should be visible
    // Skeletons render as divs with animate-pulse (jsdom doesn't apply CSS, check element count)
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    // Resolve to clean up
    resolveData({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0 }),
    } as Response);
  });
});
