import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatsCard } from "../dashboard/StatsCard";
import type { LucideIcon } from "lucide-react";

afterEach(cleanup);

const MockIcon = vi.fn(() => <svg data-testid="mock-icon" />) as unknown as LucideIcon;

describe("StatsCard", () => {
  it("renders the title", () => {
    render(<StatsCard title="Total Products" value={42} icon={MockIcon} />);
    expect(screen.getByText("Total Products")).toBeInTheDocument();
  });

  it("renders a numeric value", () => {
    render(<StatsCard title="Clicks" value={1234} icon={MockIcon} />);
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("renders a string value", () => {
    render(<StatsCard title="Revenue" value="$99.99" icon={MockIcon} />);
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <StatsCard
        title="Categories"
        value={8}
        icon={MockIcon}
        description="Active categories"
      />
    );
    expect(screen.getByText("Active categories")).toBeInTheDocument();
  });

  it("does not render description paragraph when omitted", () => {
    render(<StatsCard title="Products" value={10} icon={MockIcon} />);
    // No description text should appear for this render
    expect(screen.queryByText("Active categories")).not.toBeInTheDocument();
  });

  it("renders the icon component", () => {
    render(<StatsCard title="Stats" value={0} icon={MockIcon} />);
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });
});
