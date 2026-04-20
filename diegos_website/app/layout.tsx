import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { getSite } from "@/lib/content";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const site = getSite();
  const title = site.seoTitle || site.name || "Photography";
  const description =
    site.seoDescription || site.tagline || "Photographs by Diego Ortega.";
  return {
    title: { default: title, template: `%s — ${site.name ?? title}` },
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
