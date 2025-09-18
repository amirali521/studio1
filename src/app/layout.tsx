
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ShopSettingsProvider } from "@/contexts/shop-settings-context";

export const metadata: Metadata = {
  title: "Stockpile Scan",
  description: "A modern inventory management and sales tracking application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ShopSettingsProvider>
            <CurrencyProvider>
              <SidebarProvider>
                <div className="flex min-h-screen">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col h-screen">
                    <div className="flex-1 overflow-y-auto">
                      {children}
                    </div>
                  </div>
                </div>
                <Toaster />
              </SidebarProvider>
            </CurrencyProvider>
          </ShopSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
