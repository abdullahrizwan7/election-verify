import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Naskh_Arabic, Noto_Sans_Devanagari } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense, ViewTransition } from "react";
import { DemoBanner } from "@/components/layout/demo-banner";
import { LanguageSync } from "@/components/i18n";
import { Presenter } from "@/components/presenter/presenter";
import { ServiceWorker } from "@/components/service-worker";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Fonts for Hindi and Urdu text. Only downloaded by browsers that need those letters.
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], preload: false });
const naskh = Noto_Naskh_Arabic({ variable: "--font-naskh", subsets: ["arabic"], preload: false });

export const metadata: Metadata = {
  // Needed so link previews use full URLs for images.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "ElectionVerify – check election news before you share it",
    template: "%s · ElectionVerify",
  },
  description:
    "Submit election news links, messages or images. AI gathers evidence and a human reviewer publishes the verdict.",
};

/** The browser and phone status bar take the app's colors. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes sets the "dark" class before the page shows, so the browser's HTML can differ from the server's.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${devanagari.variable} ${naskh.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <DemoBanner />
            <SiteHeader />
            <div className="flex-1">
              {/* Pages fade and lift in when you navigate (see globals.css) */}
              <ViewTransition default="page-fade">{children}</ViewTransition>
            </div>
            <SiteFooter />
            <Toaster richColors position="top-center" />
            <ServiceWorker />
            {/* Reads the current address, so it loads on its own */}
            <Suspense fallback={null}>
              <Presenter />
            </Suspense>
            <LanguageSync />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
