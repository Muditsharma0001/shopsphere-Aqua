import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HydraFlow Aqua - Premium Computational Hydration",
  description: "Experience the convergence of computational thermal engineering, luxury double-wall insulation, and clean, fluid aesthetics.",
  metadataBase: new URL("https://hydraflow-aqua.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "HydraFlow Aqua - Premium Computational Hydration",
    description: "Double-wall copper vacuum insulation bottles for athletes, travelers, and design enthusiasts.",
    url: "/",
    siteName: "HydraFlow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HydraFlow Showcase",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HydraFlow Aqua - Premium Hydration",
    description: "Experience modern computational thermal containers with lifetime warranty coverage.",
    images: ["/og-image.png"],
  },
};

import MiniCart from "../components/MiniCart";
import AIAssistant from "../components/AIAssistant";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#030304]">
        {children}
        <MiniCart />
        <AIAssistant />
      </body>
    </html>
  );
}
