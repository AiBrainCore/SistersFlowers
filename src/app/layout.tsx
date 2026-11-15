import type { Metadata } from "next";
import { Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";
import {
  GoogleTagManagerBody,
  GoogleTagManagerHead,
} from "@/components/google-tag-manager";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Sisters Flowers | Flower Delivery Da Nang & Da Lat, Vietnam",
    template: "%s · Sisters Flowers",
  },
  description:
    "Handcrafted bouquets and gifts from Sisters Flowers. Flower delivery in Da Nang and Da Lat, Vietnam — English & Vietnamese.",
  verification: {
    google: "x2A3Uc3EjoMkvBm5FWlpKvh1egvj4pJ0xrIiCIpF2-c",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    images: [
      {
        url: "/brand/og-default.png",
        width: 1024,
        height: 1024,
        alt: "Sisters Flowers",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        <GoogleTagManagerHead />
      </head>
      <body className="min-h-full bg-paper font-sans text-ink">
        <GoogleTagManagerBody />
        {children}
      </body>
    </html>
  );
}
