// BlogFilters component tests — search debounce, per-page URL updates
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";

const mockPush = vi.fn();
let mockSearchParamsString = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/en/blog",
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
}));

import { BlogFilters, PER_PAGE_OPTIONS } from "../BlogFilters";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mockSearchParamsString = "";
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

function renderFilters(props: { currentSearch?: string; currentPerPage?: number; totalCount?: number; currentView?: "list" | "grid" } = {}) {
  return render(
    <BlogFilters
      currentSearch={props.currentSearch ?? ""}
      currentPerPage={props.currentPerPage ?? PER_PAGE_OPTIONS[0]}
      totalCount={props.totalCount ?? 10}
      currentView={props.currentView ?? "list"}
    />,
  );
}

describe("BlogFilters — search", () => {
  it("does not call router.push immediately on typing (debounced)", () => {
    renderFilters();
    const input = screen.getByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "taco" } });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("calls router.push with ?q= after 350ms debounce", () => {
    renderFilters();
    const input = screen.getByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "taco" } });
    act(() => { vi.advanceTimersByTime(350); });
    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush.mock.calls[0][0]).toContain("q=taco");
  });

  it("resets debounce timer on each keystroke — only one push for rapid typing", () => {
    renderFilters();
    const input = screen.getByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "t" } });
    act(() => { vi.advanceTimersByTime(100); });
    fireEvent.change(input, { target: { value: "ta" } });
    act(() => { vi.advanceTimersByTime(100); });
    fireEvent.change(input, { target: { value: "tac" } });
    act(() => { vi.advanceTimersByTime(350); });
    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush.mock.calls[0][0]).toContain("q=tac");
  });

  it("removes ?q from URL when search is cleared", () => {
    mockSearchParamsString = "q=taco";
    renderFilters({ currentSearch: "taco" });
    const input = screen.getByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "" } });
    act(() => { vi.advanceTimersByTime(350); });
    expect(mockPush).toHaveBeenCalledOnce();
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).not.toContain("q=");
  });

  it("does not push if typed value equals currentSearch (no change)", () => {
    renderFilters({ currentSearch: "taco" });
    const input = screen.getByPlaceholderText("Search articles…");
    // Re-type same value — state is already "taco" from prop, typing "taco" keeps same value
    fireEvent.change(input, { target: { value: "taco" } });
    act(() => { vi.advanceTimersByTime(350); });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("resets page param when searching (removes ?page=)", () => {
    mockSearchParamsString = "page=3";
    renderFilters();
    const input = screen.getByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "beef" } });
    act(() => { vi.advanceTimersByTime(350); });
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).not.toContain("page=");
    expect(pushedUrl).toContain("q=beef");
  });
});

describe("BlogFilters — per-page", () => {
  it("renders all PER_PAGE_OPTIONS in the select", () => {
    renderFilters();
    const select = screen.getByRole("combobox");
    const options = Array.from((select as HTMLSelectElement).options).map((o) => Number(o.value));
    expect(options).toEqual(Array.from(PER_PAGE_OPTIONS));
  });

  it("omits perPage from URL when default value is selected", () => {
    renderFilters({ currentPerPage: PER_PAGE_OPTIONS[1] });
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: String(PER_PAGE_OPTIONS[0]) } });
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).not.toContain("perPage=");
  });

  it("adds perPage to URL when non-default value is selected", () => {
    renderFilters();
    const select = screen.getByRole("combobox");
    const nonDefault = PER_PAGE_OPTIONS[1];
    fireEvent.change(select, { target: { value: String(nonDefault) } });
    expect(mockPush.mock.calls[0][0]).toContain(`perPage=${nonDefault}`);
  });

  it("resets page param when changing per-page", () => {
    mockSearchParamsString = "page=5";
    renderFilters();
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: String(PER_PAGE_OPTIONS[1]) } });
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).not.toContain("page=");
  });
});

describe("BlogFilters — article count", () => {
  it("shows singular 'article' for count of 1", () => {
    renderFilters({ totalCount: 1 });
    expect(screen.getByText("1 article")).toBeInTheDocument();
  });

  it("shows plural 'articles' for count > 1", () => {
    renderFilters({ totalCount: 5 });
    expect(screen.getByText("5 articles")).toBeInTheDocument();
  });
});
