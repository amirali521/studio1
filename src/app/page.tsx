
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart, LayoutGrid, QrCode, ShoppingCart, ScanLine, FilePenLine, AreaChartIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";
import LandingHero from "@/components/landing-hero";

const features = [
  {
    icon: LayoutGrid,
    title: "Inventory Management",
    description: "Easily add, edit, and track products. Know your stock levels at all times.",
  },
  {
    icon: ShoppingCart,
    title: "Point of Sale (POS)",
    description: "A simple and fast POS system. Scan items with your camera to finalize sales.",
  },
  {
    icon: BarChart,
    title: "Sales Analytics",
    description: "Track revenue, profit, and inventory value with powerful, easy-to-read charts.",
  },
  {
    icon: QrCode,
    title: "QR Code Generation",
    description: "Generate and print unique QR codes for your items for easy scanning and tracking.",
  },
];


export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-headline text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
              Effortless Inventory, Powerful Sales
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Stockpile Scan turns your device into a powerful inventory management and point-of-sale system. Scan, sell, and track your products with ease.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Hero Graphic */}
        <section className="container max-w-5xl">
            <LandingHero className="rounded-xl border bg-card shadow-lg"/>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="container space-y-6 bg-slate-50/50 py-8 dark:bg-transparent md:py-12 lg:py-24"
        >
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              Everything You Need
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              From scanning your first product to analyzing sales trends, Stockpile Scan provides a seamless workflow to manage your business.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="relative overflow-hidden rounded-lg border bg-background p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <feature.icon className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

         {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container space-y-12 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">How It Works</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  A simple 3-step process to get you up and running.
                </p>
              </div>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-3 md:gap-12 lg:max-w-5xl">
              <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <ScanLine className="h-8 w-8 text-primary"/>
                </div>
                <h3 className="text-lg font-bold">1. Scan & Add</h3>
                <p className="text-sm text-muted-foreground">
                  Use your device's camera to scan barcodes and automatically add products to your inventory.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <ShoppingCart className="h-8 w-8 text-primary"/>
                </div>
                <h3 className="text-lg font-bold">2. Sell & Process</h3>
                <p className="text-sm text-muted-foreground">
                  The Point-of-Sale system makes it easy to scan items, process payments, and print receipts.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <AreaChartIcon className="h-8 w-8 text-primary"/>
                </div>
                <h3 className="text-lg font-bold">3. Track & Analyze</h3>
                <p className="text-sm text-muted-foreground">
                  Gain insights into your sales, revenue, and profit with our simple analytics dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                &copy; 2024 Stockpile Scan. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}
