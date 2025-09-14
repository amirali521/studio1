
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
import Image from "next/image";


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
        
        {/* New Feature Showcase Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-50/50 dark:bg-transparent">
            <div className="container px-4 md:px-6">
                <div className="grid gap-12 md:gap-16">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">All-in-One Business Command Center</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Manage your entire operation, from stockroom to storefront, with our intuitive and powerful suite of tools.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
                        <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                            <h3 className="text-2xl font-bold">Intuitive Dashboard</h3>
                            <p className="text-muted-foreground">
                                Get a bird's-eye view of your inventory at a glance. Track stock levels, see your top-selling products, and manage everything from one simple, clean interface. No more guesswork.
                            </p>
                        </div>
                        <Image
                            src="https://picsum.photos/seed/101/600/400"
                            width={600}
                            height={400}
                            alt="Dashboard"
                            data-ai-hint="dashboard analytics"
                            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                        />
                    </div>
                    <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
                        <div className="flex flex-col justify-center space-y-4 text-center lg:order-last lg:text-left">
                            <h3 className="text-2xl font-bold">Lightning-Fast Point of Sale</h3>
                            <p className="text-muted-foreground">
                                Turn any device into a powerful POS. Scan barcodes with your camera, process sales in seconds, and automatically update your inventory. Checkout has never been smoother.
                            </p>
                        </div>
                        <Image
                             src="https://picsum.photos/seed/102/600/400"
                             width={600}
                             height={400}
                            alt="POS"
                            data-ai-hint="point sale"
                            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* New CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container flex flex-col items-center justify-center gap-4 px-4 text-center md:px-6">
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">Ready to Take Control?</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                    Stop letting inventory manage you. Start your free account today and see how simple running your business can be.
                </p>
                <Button asChild size="lg">
                    <Link href="/signup">
                        Sign Up Now
                        <ArrowRight className="ml-2" />
                    </Link>
                </Button>
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
