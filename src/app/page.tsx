
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart, LayoutGrid, QrCode, ShoppingCart } from "lucide-react";
import { Logo } from "@/components/logo";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";

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
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed w-full z-10">
        <Link href="/" className="flex items-center justify-center">
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-24 md:pt-32 lg:pt-40 border-y bg-primary/5">
          <div className="px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline">
                  The Modern Solution for Inventory Management
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                  Stockpile Scan combines powerful inventory tracking, a simple point-of-sale system, and insightful analytics. All powered by your device's camera.
                </p>
                <div className="space-x-4 mt-6">
                  <Button asChild size="lg">
                    <Link href="/signup">
                      Get Started <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                 <Image
                    src="https://picsum.photos/seed/dashboard/600/400"
                    width="600"
                    height="400"
                    alt="App Screenshot"
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="app dashboard analytics"
                  />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container space-y-12 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">Everything You Need. Nothing You Don't.</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From scanning your first product to analyzing sales trends, Stockpile Scan provides a seamless workflow to manage your business.
                </p>
              </div>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="h-6 w-6 text-primary"/>
                    <h3 className="text-lg font-bold">Inventory Management</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Easily add, edit, and track products. Generate unique QR codes for serialized items and always know your stock levels.
                </p>
              </div>
              <div className="grid gap-1">
                 <div className="flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6 text-primary"/>
                    <h3 className="text-lg font-bold">Point of Sale (POS)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  A simple and fast POS system. Use your camera to scan items and finalize sales in seconds. Print receipts for your customers.
                </p>
              </div>
              <div className="grid gap-1">
                 <div className="flex items-center gap-2">
                    <BarChart className="h-6 w-6 text-primary"/>
                    <h3 className="text-lg font-bold">Sales Analytics</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Understand your business with powerful analytics. Track revenue, profit, and inventory value over time.
                </p>
              </div>
               <div className="grid gap-1">
                 <div className="flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-primary"/>
                    <h3 className="text-lg font-bold">AI-Powered Scanning</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Prefill product details instantly by scanning a product's existing barcode using your device's camera.
                </p>
              </div>
               <div className="grid gap-1">
                 <div className="flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-primary"/>
                    <h3 className="text-lg font-bold">QR Code Generation</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate and print unique QR codes for each item in your inventory for easy tracking and sales processing.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Stockpile Scan. All rights reserved.</p>
      </footer>
    </div>
  );
}
