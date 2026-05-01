import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WizardBuilder } from "../WizardBuilder";
import { decodeWizard } from "@/lib/wizard";

afterEach(cleanup);

function setup(overrides?: Partial<Parameters<typeof WizardBuilder>[0]>) {
  const onInsert = vi.fn();
  const onClose = vi.fn();
  render(<WizardBuilder onInsert={onInsert} onClose={onClose} {...overrides} />);
  return { onInsert, onClose };
}

// TC-19.2.1
it("TC-19.2.1 renders with one initial step tab", () => {
  setup();
  expect(screen.getByRole("tab", { name: "Step 1" })).toBeTruthy();
});

// TC-19.2.2
it("TC-19.2.2 Add Step appends new tab", () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: /\+ Add Step/i }));
  expect(screen.getAllByRole("tab")).toHaveLength(2);
});

// TC-19.2.3
it("TC-19.2.3 Remove step button removes it", () => {
  setup();
  // add a second step first
  fireEvent.click(screen.getByRole("button", { name: /\+ Add Step/i }));
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: /Remove step/i }));
  expect(screen.getAllByRole("tab")).toHaveLength(1);
});

// TC-19.2.4
it("TC-19.2.4 cannot remove last step", () => {
  setup();
  expect(screen.getByRole("button", { name: /Remove step/i })).toBeDisabled();
});

// TC-19.2.5
it("TC-19.2.5 title input updates step tab label", () => {
  setup();
  fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "My Step" } });
  expect(screen.getByRole("tab", { name: "My Step" })).toBeTruthy();
});

// TC-19.2.6
it("TC-19.2.6 move step right reorders tabs", () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: /\+ Add Step/i }));
  // Set titles so we can identify them
  // active tab is the second one after clicking Add Step
  // Go back to first tab
  fireEvent.click(screen.getAllByRole("tab")[0]);
  fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "Alpha" } });
  fireEvent.click(screen.getAllByRole("tab")[1]);
  fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "Beta" } });
  // Move Beta left (active is Beta at index 1)
  fireEvent.click(screen.getByRole("button", { name: /Move step left/i }));
  const tabs = screen.getAllByRole("tab");
  expect(tabs[0].textContent).toBe("Beta");
  expect(tabs[1].textContent).toBe("Alpha");
});

// TC-19.2.7
it("TC-19.2.7 Insert Wizard calls onInsert with wizard-block HTML", () => {
  const { onInsert } = setup();
  fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "MyStep" } });
  fireEvent.click(screen.getByRole("button", { name: /Insert Wizard into Content/i }));
  expect(onInsert).toHaveBeenCalledOnce();
  const html: string = onInsert.mock.calls[0][0];
  expect(html).toContain('class="wizard-block"');
  expect(html).toContain('data-wizard="');
});

// TC-19.2.8
it("TC-19.2.8 inserted HTML encodes step titles correctly", () => {
  const { onInsert } = setup();
  fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "Unicode আমার" } });
  fireEvent.click(screen.getByRole("button", { name: /Insert Wizard into Content/i }));
  const html: string = onInsert.mock.calls[0][0];
  const match = html.match(/data-wizard="([^"]+)"/);
  expect(match).toBeTruthy();
  const decoded = decodeWizard(match![1]);
  expect(decoded.steps[0].title).toBe("Unicode আমার");
});

// TC-19.2.9
it("TC-19.2.9 Cancel calls onClose", () => {
  const { onClose } = setup();
  fireEvent.click(screen.getAllByRole("button", { name: /Cancel/i })[0]);
  expect(onClose).toHaveBeenCalledOnce();
});

// TC-19.2.10
it("TC-19.2.10 CKEditor container is rendered for step content", () => {
  setup();
  // CKEditor is mocked; verify the editor wrapper div is present
  const editorContainer = document.querySelector(".wizard-step-ck");
  expect(editorContainer).toBeTruthy();
});
