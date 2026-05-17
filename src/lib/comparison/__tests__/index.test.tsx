import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import { ComparisonProvider, useComparison } from "../index";

describe("comparison/index.tsx", () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Mock window to be defined
    vi.stubGlobal("window", {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("ComparisonProvider", () => {
    it("renders children", () => {
      render(
        <ComparisonProvider>
          <div>Test Child</div>
        </ComparisonProvider>,
      );
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("loads initial state from localStorage", () => {
      localStorage.setItem("bf_comparison", JSON.stringify(["prod-1", "prod-2"]));
      
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      expect(result.current.selectedIds).toEqual(["prod-1", "prod-2"]);
    });

    it("handles empty localStorage", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      expect(result.current.selectedIds).toEqual([]);
    });

    it("handles corrupt localStorage data", () => {
      localStorage.setItem("bf_comparison", "invalid json");
      
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      expect(result.current.selectedIds).toEqual([]);
    });
  });

  describe("useComparison hook", () => {
    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => useComparison());
      }).toThrow("useComparison must be used inside ComparisonProvider");
    });

    it("provides add function", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
      });

      expect(result.current.selectedIds).toContain("prod-1");
    });

    it("does not add duplicate IDs", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
        result.current.add("prod-1");
      });

      expect(result.current.selectedIds).toEqual(["prod-1"]);
    });

    it("does not add more than MAX_EXTRA items", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
        result.current.add("prod-2");
        result.current.add("prod-3");
        result.current.add("prod-4");
        result.current.add("prod-5");
        result.current.add("prod-6");
      });

      expect(result.current.selectedIds.length).toBe(5);
    });

    it("provides remove function", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
        result.current.add("prod-2");
      });

      act(() => {
        result.current.remove("prod-1");
      });

      expect(result.current.selectedIds).toEqual(["prod-2"]);
    });

    it("provides clear function", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
        result.current.add("prod-2");
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.selectedIds).toEqual([]);
    });

    it("provides isSelected function", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
      });

      expect(result.current.isSelected("prod-1")).toBe(true);
      expect(result.current.isSelected("prod-2")).toBe(false);
    });

    it("provides canAdd property", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      expect(result.current.canAdd).toBe(true);

      act(() => {
        result.current.add("prod-1");
        result.current.add("prod-2");
        result.current.add("prod-3");
        result.current.add("prod-4");
        result.current.add("prod-5");
      });

      expect(result.current.canAdd).toBe(false);
    });

    it("persists state to localStorage on add", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
      });

      const stored = localStorage.getItem("bf_comparison");
      expect(stored).toBe(JSON.stringify(["prod-1"]));
    });

    it("persists state to localStorage on remove", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
        result.current.add("prod-2");
      });

      act(() => {
        result.current.remove("prod-1");
      });

      const stored = localStorage.getItem("bf_comparison");
      expect(stored).toBe(JSON.stringify(["prod-2"]));
    });

    it("persists state to localStorage on clear", () => {
      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
      });

      act(() => {
        result.current.clear();
      });

      const stored = localStorage.getItem("bf_comparison");
      expect(stored).toBe(JSON.stringify([]));
    });

    it("handles localStorage errors on add gracefully", () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
      });

      // Should not throw, state should still update
      expect(result.current.selectedIds).toContain("prod-1");

      localStorage.setItem = originalSetItem;
    });

    it("handles localStorage errors on remove gracefully", () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.add("prod-1");
      });

      act(() => {
        result.current.remove("prod-1");
      });

      // Should not throw, state should still update
      expect(result.current.selectedIds).toEqual([]);

      localStorage.setItem = originalSetItem;
    });

    it("handles localStorage errors on persist gracefully", () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useComparison(), {
        wrapper: ComparisonProvider,
      });

      act(() => {
        result.current.clear();
      });

      // Should not throw, state should still update
      expect(result.current.selectedIds).toEqual([]);

      localStorage.setItem = originalSetItem;
    });
  });
});
