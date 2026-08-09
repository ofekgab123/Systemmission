import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { he } from "@/lib/i18n/he";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${he.app.name} — ${he.app.tagline}`,
  description: he.app.description,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: he.app.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("mission-font-scale");if(l!==null){var m={"-2":0.85,"-1":0.925,"0":1,"1":1.075,"2":1.15,"3":1.25};var n=parseInt(l,10);if(!isNaN(n)&&m[n]!=null){document.documentElement.style.setProperty("--font-scale",String(m[n]));document.documentElement.dataset.fontScale=String(n);}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <TooltipProvider>
              <AppShell>{children}</AppShell>
              <Toaster
                position="bottom-center"
                dir="rtl"
                toastOptions={{ className: "mb-[calc(4.5rem+env(safe-area-inset-bottom))] md:mb-0" }}
              />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
