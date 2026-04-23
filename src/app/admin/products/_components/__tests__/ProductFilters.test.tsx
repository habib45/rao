import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { ProductFilters } from "../ProductFilters";

const categories = [
  { id: "cat-1", name: { en: "Electronics" } },
  { id: "cat-2", name: { en: "Books" } },
];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("ProductFilters", () => {
  it("renders a search input", () => {
    render(<ProductFilters categories={[]} onFilterChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search products...")).toBeInTheDocument();
  });

  it("renders category options from props", () => {
    render(<ProductFilters categories={categories} onFilterChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "Electronics" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Books" })).toBeInTheDocument();
  });

  it("renders All Categories option", () => {
    render(<ProductFilters categories={categories} onFilterChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "All Categories" })).toBeInTheDocument();
  });

  it("renders status filter options", () => {
    render(<ProductFilters categories={[]} onFilterChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "All Status" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Inactive" })).toBeInTheDocument();
  });

  it("calls onFilterChange after 300ms debounce when search changes", async () => {
    const onFilterChange = vi.fn();
    render(<ProductFilters categories={[]} onFilterChange={onFilterChange} />);

    // Flush the initial render's debounce call
    await act(async () => { vi.advanceTimersByTime(300); });
    onFilterChange.mockClear();

    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.change(input, { target: { value: "tv" } });

    // Before debounce settles — should not have been called with "tv"
    expect(onFilterChange).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(300); });

    expect(onFilterChange).toHaveBeenCalledWith({
      search: "tv",
      category: "",
      status: "all",
    });
  });

  it("does not call onFilterChange before debounce settles with rapid typing", async () => {
    const onFilterChange = vi.fn();
    render(<ProductFilters categories={[]} onFilterChange={onFilterChange} />);

    await act(async () => { vi.advanceTimersByTime(300); });
    onFilterChange.mockClear();

    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });

    await act(async () => { vi.advanceTimersByTime(200); });

    // Debounce hasn't settled — must not have fired yet
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it("calls onFilterChange with selected category after debounce", async () => {
    const onFilterChange = vi.fn();
    render(<ProductFilters categories={categories} onFilterChange={onFilterChange} />);

    await act(async () => { vi.advanceTimersByTime(300); });
    onFilterChange.mockClear();

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "cat-1" } });

    await act(async () => { vi.advanceTimersByTime(300); });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: "cat-1" })
    );
  });
});
