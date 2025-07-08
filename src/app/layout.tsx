import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "솔 에르다조각 폰지사기방",
  description: "솔 에르다조각 폰지사기방",
  icons: {
    icon: "/image/sol.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-maplestory antialiased pt-16">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navigation />
          <ClientProviders>{children}</ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
