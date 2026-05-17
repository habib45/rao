import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./_components/Providers";
import "../globals.css";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { template: "%s | RaoFinds Admin", default: "RaoFinds Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-foreground" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
