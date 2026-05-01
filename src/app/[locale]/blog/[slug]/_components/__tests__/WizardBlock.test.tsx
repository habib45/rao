import { it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WizardBlock } from "../WizardBlock";
import type { WizardStep } from "@/lib/wizard";

afterEach(cleanup);

const steps: WizardStep[] = [
  { id: "s1", title: "First", content: "<p>Content A</p>" },
  { id: "s2", title: "Second", content: "<p>Content B</p>" },
  { id: "s3", title: "Third", content: "<p>Content C</p>" },
];

// TC-19.1.1
it("TC-19.1.1 renders first step title tab as active", () => {
  render(<WizardBlock steps={steps} />);
  const tab = screen.getByRole("tab", { name: "First" });
  expect(tab.getAttribute("aria-selected")).toBe("true");
});

// TC-19.1.2
it("TC-19.1.2 renders first step content", () => {
  render(<WizardBlock steps={steps} />);
  expect(screen.getByRole("tabpanel").innerHTML).toContain("Content A");
});

// TC-19.1.3
it("TC-19.1.3 clicking second tab switches content", () => {
  render(<WizardBlock steps={steps} />);
  fireEvent.click(screen.getByRole("tab", { name: "Second" }));
  expect(screen.getByRole("tabpanel").innerHTML).toContain("Content B");
});

// TC-19.1.4
it("TC-19.1.4 Previous button disabled on first step", () => {
  render(<WizardBlock steps={steps} />);
  expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
});

// TC-19.1.5
it("TC-19.1.5 Next button disabled on last step", () => {
  render(<WizardBlock steps={steps} />);
  // advance to last step
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
});

// TC-19.1.6
it("TC-19.1.6 Next button advances to next step", () => {
  render(<WizardBlock steps={steps} />);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(screen.getByRole("tabpanel").innerHTML).toContain("Content B");
});

// TC-19.1.7
it("TC-19.1.7 Previous button goes back", () => {
  render(<WizardBlock steps={steps} />);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  fireEvent.click(screen.getByRole("button", { name: /previous/i }));
  expect(screen.getByRole("tabpanel").innerHTML).toContain("Content A");
});

// TC-19.1.8
it("TC-19.1.8 completed steps show checkmark", () => {
  render(<WizardBlock steps={steps} />);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(screen.getByRole("tab", { name: /✓ First/ })).toBeTruthy();
});

// TC-19.1.9
it("TC-19.1.9 navigation footer hidden for single-step wizard", () => {
  render(<WizardBlock steps={[steps[0]]} />);
  expect(screen.queryByRole("button", { name: /previous/i })).toBeNull();
  expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
});

// TC-19.1.10
it("TC-19.1.10 returns null for empty steps array", () => {
  const { container } = render(<WizardBlock steps={[]} />);
  expect(container.firstChild).toBeNull();
});
