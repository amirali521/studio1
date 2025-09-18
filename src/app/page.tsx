
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutGrid, ShoppingCart, AreaChart, QrCode, Undo2, MessageSquare } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";
import AnimatedLandingHero from "@/components/animated-landing-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedAnalyticsBackground from "@/components/animated-analytics-background";

const features = [
  {
    icon: <LayoutGrid className="h-8 w-8 text-primary" />,
    title: "Inventory Management",
    description: "Easily add, edit, and track products. Know your stock levels at all times.",
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: "Point of Sale (POS)",
    description: "A simple and fast POS system. Scan items with your device camera to finalize sales.",
  },
  {
    icon: <AreaChart className="h-8 w-8 text-primary" />,
    title: "Sales Analytics",
    description: "Track revenue, profit, and trends with powerful, easy-to-read charts.",
  },
  {
    icon: <QrCode className="h-8 w-8 text-primary" />,
    title: "QR Code Generation",
    description: "Generate and print unique QR codes for your items for easy scanning and tracking.",
  },
  {
    icon: <Undo2 className="h-8 w-8 text-primary" />,
    title: "Effortless Returns",
    description: "Process customer returns with a quick scan, automatically updating your inventory.",
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "Community Chat",
    description: "Connect with other business owners, share tips, and build your network.",
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
       <AnimatedAnalyticsBackground className="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
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
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16">
          <div className="container flex flex-col items-start gap-8 px-4 text-left">
            <h1 className="w-full font-headline text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
              Effortless Inventory, Powerful Sales
            </h1>
            <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="flex flex-col items-start gap-4 text-left">
                <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                  Stockpile Scan turns your device into an all-in-one inventory management and point-of-sale powerhouse. Seamlessly track stock levels, process sales with a quick scan, and gain valuable insights into your business performance. It's designed for simplicity and power, giving you back time to focus on what matters most: growing your business.
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
              <div className="relative mt-8 md:mt-0">
                 <AnimatedLandingHero className="rounded-xl border bg-card shadow-lg"/>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-12 md:py-24 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-8 text-center px-4">
            <div className="mx-auto max-w-3xl text-center">
                <h2 className="font-headline text-3xl font-bold sm:text-5xl">Everything You Need</h2>
                <p className="mt-4 text-muted-foreground sm:text-xl">
                    From your first product to analyzing sales trends, Stockpile Scan provides a seamless workflow to manage and grow your business.
                </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center transition-all duration-300 hover:scale-105 hover:shadow-xl">
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
            <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center px-4">
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
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                &copy; 2024 Stockpile Scan. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}
