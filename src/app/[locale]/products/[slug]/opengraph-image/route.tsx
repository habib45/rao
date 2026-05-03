import { ImageResponse } from "next/og";
import type { LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { formatPrice } from "@/lib/i18n/format";
import { getProductBySlug } from "@/lib/queries/products";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const loc = locale as LocaleCode;
  const product = await getProductBySlug(slug, loc);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#f9fafb",
            fontSize: 48,
            color: "#171717",
          }}
        >
          Product Not Found
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const name = t(product.name, loc) as string;
  const price =
    product.price_cents !== null
      ? formatPrice(product.price_cents, product.currency, loc)
      : "";
  const primaryImage = product.product_images?.find((img) => img.is_primary);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
          padding: "60px",
        }}
      >
        {primaryImage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "400px",
              height: "100%",
              marginRight: "60px",
            }}
          >
            <img
              src={primaryImage.url}
              alt={name}
              width={360}
              height={360}
              style={{ objectFit: "contain" }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          {product.brand && (
            <div style={{ fontSize: 24, color: "#6b7280", marginBottom: 12 }}>
              {product.brand}
            </div>
          )}
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#171717",
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {name.length > 80 ? name.slice(0, 80) + "..." : name}
          </div>
          {price && (
            <div
              style={{ fontSize: 40, fontWeight: 700, color: "#f59e0b" }}
            >
              {price}
            </div>
          )}
          <div
            style={{
              fontSize: 20,
              color: "#6b7280",
              marginTop: 24,
            }}
          >
            RaoFinds
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
