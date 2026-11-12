import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ElectionVerify – check election news before you share it",
    template: "%s · ElectionVerify",
  },
  description:
    "Submit election news links, messages or images. AI gathers evidence and a human reviewer publishes the verdict.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <DemoBanner />
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
