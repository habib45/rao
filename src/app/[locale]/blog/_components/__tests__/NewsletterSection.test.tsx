// F18.2 — NewsletterSection component tests (TC-18.2.8 – 18.2.10)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NewsletterSection } from "../NewsletterSection";

const DEFAULT_PROPS = {
  title: "Stay in the loop",
  subtitle: "Get the latest deals.",
  background: "indigo" as const,
  locale: "en",
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NewsletterSection", () => {
  it("TC-18.2.8 renders email input and subscribe button", () => {
    render(<NewsletterSection {...DEFAULT_PROPS} />);

    expect(
      screen.getByPlaceholderText("Enter your email"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Subscribe" }),
    ).toBeInTheDocument();
  });

  it("renders the title and subtitle", () => {
    render(<NewsletterSection {...DEFAULT_PROPS} />);
    expect(screen.getByText("Stay in the loop")).toBeInTheDocument();
    expect(screen.getByText("Get the latest deals.")).toBeInTheDocument();
  });

  it("renders a consent checkbox", () => {
    render(<NewsletterSection {...DEFAULT_PROPS} />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("TC-18.2.9 shows success state after successful submit", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }) as unknown as typeof fetch;

    render(<NewsletterSection {...DEFAULT_PROPS} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => {
      expect(screen.getByText(/You're subscribed/i)).toBeInTheDocument();
    });
  });

  it("TC-18.2.10 shows error message on API failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Already subscribed" }),
    }) as unknown as typeof fetch;

    render(<NewsletterSection {...DEFAULT_PROPS} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => {
      expect(screen.getByText("Already subscribed")).toBeInTheDocument();
    });
  });

  it("shows error when email is empty on submit", async () => {
    render(<NewsletterSection {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(
      screen.getByText("Please enter your email address."),
    ).toBeInTheDocument();
  });

  it("shows error when consent is not checked", async () => {
    render(<NewsletterSection {...DEFAULT_PROPS} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(
      screen.getByText("You must agree to the terms before subscribing."),
    ).toBeInTheDocument();
  });

  it("shows generic error on network failure", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(
      new Error("Network error"),
    ) as unknown as typeof fetch;

    render(<NewsletterSection {...DEFAULT_PROPS} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => {
      expect(screen.getByText("Network error. Please try again.")).toBeInTheDocument();
    });
  });

  it("applies correct background class for gray variant", () => {
    const { container } = render(
      <NewsletterSection {...DEFAULT_PROPS} background="gray" />,
    );
    expect(container.querySelector("section")).toHaveClass("bg-gray-100");
  });

  it("applies correct background class for dark variant", () => {
    const { container } = render(
      <NewsletterSection {...DEFAULT_PROPS} background="dark" />,
    );
    expect(container.querySelector("section")).toHaveClass("bg-gray-900");
  });
});
