import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ADSENSE_CLIENT, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Free Instagram Video, Reels & Photo Downloader`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Download Instagram videos, Reels, photos and audio for free. Paste a public post link – no login, no watermark, unlimited downloads.",
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Free Instagram Video, Reels & Photo Downloader`,
    description: "Paste a public Instagram link to download videos, Reels, photos and audio – free, no login, no watermark.",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

export const viewport: Viewport = {
  themeColor: "#dd2a7b",
  width: "device-width",
  initialScale: 1,
};

const themeInit = `
  try {
    const stored = localStorage.getItem("quickvideosaver-theme");
    const dark = stored === "dark" || (stored !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInit}
        </Script>
        {ADSENSE_CLIENT ? (
          <Script
            async
            id="adsense-script"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        ) : null}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
