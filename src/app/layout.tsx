
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ShopSettingsProvider } from "@/contexts/shop-settings-context";
import { DashboardActionsProvider } from "@/contexts/dashboard-actions-context";


export const metadata: Metadata = {
  title: "Stockpile Scan - Inventory Management & POS",
  description: "Stockpile Scan is a modern, all-in-one inventory management and point-of-sale (POS) system for small businesses. Track stock, process sales, generate QR codes, and analyze performance with ease.",
  keywords: ["inventory management", "point of sale", "POS", "small business", "stock tracking", "sales analytics", "QR code inventory", "retail management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="LFrxc8MX3bfV2x9--yAcAivXcKA5eZYoB08oXs0rOm0" />
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
              <DashboardActionsProvider>
                <SidebarProvider>
                  <div className="flex min-h-screen">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col h-screen min-w-0">
                      <div className="flex-1 overflow-y-auto">
                        {children}
                      </div>
                    </div>
                  </div>
                  <Toaster />
                </SidebarProvider>
              </DashboardActionsProvider>
            </CurrencyProvider>
          </ShopSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
