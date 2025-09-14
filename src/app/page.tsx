
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutGrid, ShoppingCart, AreaChart, QrCode } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";
import LandingHero from "@/components/landing-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: <LayoutGrid className="h-8 w-8 text-primary" />,
    title: "Inventory Management",
    description: "Easily add, edit, and track products. Know your stock levels at all times.",
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: "Point of Sale (POS)",
    description: "A simple and fast POS system. Scan items with your camera to finalize sales.",
  },
  {
    icon: <AreaChart className="h-8 w-8 text-primary" />,
    title: "Sales Analytics",
    description: "Track revenue, profit, and inventory value with powerful, easy-to-read charts.",
  },
    {
    icon: <QrCode className="h-8 w-8 text-primary" />,
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
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-24">
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
           {/* Hero Graphic */}
          <div className="container max-w-5xl mt-12">
              <LandingHero className="rounded-xl border bg-card shadow-lg"/>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-12 md:py-24 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-8 text-center">
            <div className="mx-auto max-w-3xl text-center">
                <h2 className="font-headline text-3xl font-bold sm:text-5xl">Everything You Need</h2>
                <p className="mt-4 text-muted-foreground sm:text-xl">
                    From scanning your first product to analyzing sales trends, Stockpile Scan provides a seamless workflow to manage your business.
                </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* New CTA Section */}
        <section className="space-y-6 py-12 md:py-24 lg:py-32">
            <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                <h2 className="font-headline text-3xl font-bold sm:text-5xl">Ready to Take Control?</h2>
                <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                    Stop letting inventory manage you. Start your free account today and see how simple running your business can be.
                </p>
                <div className="space-x-4">
                    <Button asChild size="lg">
                        <Link href="/signup">
                            Sign Up Now
                            <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
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
