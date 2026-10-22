import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { AppProviders } from "@/components/providers/app-providers";
import { BRAND } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — In-store teleconsultation`, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

/** Applies the saved light/dark theme before first paint. */
const themeScript = `try{var t=localStorage.getItem("mc.theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
