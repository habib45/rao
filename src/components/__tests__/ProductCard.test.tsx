import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ProductCard from "../ProductCard";
import type { Product } from "@/types/domain";

afterEach(cleanup);

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("@/components/AddToCartButton", () => ({
  default: () => <button>Add to cart</button>,
}));

const baseProduct: Product = {
  id: "p1",
  asin: "B001",
  name: { en: "Test Product" },
  slug: { en: "test-product" },
  description: { en: "" },
  features: [],
  meta_title: { en: "" },
  meta_description: { en: "" },
  price_cents: 2999,
  original_price_cents: 3999,
  currency: "USD",
  discount_pct: 25,
  availability: "in_stock",
  affiliate_url: "",
  rating: null,
  review_count: 0,
  brand: null,
  category_id: null,
  is_featured: false,
  is_active: true,
  product_status: "approved",
  product_images: [],
  created_at: "",
  updated_at: "",
};

describe("ProductCard — showPrice", () => {
  it("renders price when showPrice is not passed (default true)", () => {
    render(<ProductCard product={baseProduct} locale="en" />);
    expect(screen.getByText(/\$29\.99/i)).toBeInTheDocument();
  });

  it("renders price when showPrice={true}", () => {
    render(<ProductCard product={baseProduct} locale="en" showPrice={true} />);
    expect(screen.getByText(/\$29\.99/i)).toBeInTheDocument();
  });

  it("hides price when showPrice={false}", () => {
    render(<ProductCard product={baseProduct} locale="en" showPrice={false} />);
    expect(screen.queryByText(/\$29\.99/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$39\.99/i)).not.toBeInTheDocument();
  });

  it("hides discount badge when showPrice={false}", () => {
    render(<ProductCard product={baseProduct} locale="en" showPrice={false} />);
    expect(screen.queryByText(/-25%/i)).not.toBeInTheDocument();
  });

  it("shows discount badge when showPrice={true}", () => {
    render(<ProductCard product={baseProduct} locale="en" showPrice={true} />);
    expect(screen.getByText(/-25%/i)).toBeInTheDocument();
  });
});
