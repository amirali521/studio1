
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";
import { ScanBarcode, AreaChart, QrCode, ShoppingCart, Undo2, Facebook, Twitter, Instagram, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedLandingHero from "@/components/animated-landing-hero";
import { useWebView } from "@/hooks/use-webview";

const features = [
    {
        icon: ScanBarcode,
        title: "Effortless Inventory",
        description: "Track stock levels with a simple, intuitive interface. Add products, manage quantities, and never lose track of your inventory again."
    },
    {
        icon: ShoppingCart,
        title: "Powerful POS",
        description: "A fast and reliable Point of Sale system. Scan items, process sales, and generate receipts with just a few clicks."
    },
    {
        icon: QrCode,
        title: "QR Code Generation",
        description: "Generate and print unique QR codes for each item. Streamline your sales and returns process with quick scans."
    },
    {
        icon: AreaChart,
        title: "Insightful Analytics",
        description: "Gain valuable insights into your business performance with our detailed analytics and customizable sales reports."
    },
    {
        icon: Undo2,
        title: "Easy Returns",
        description: "Handle customer returns smoothly. Scan a sold item's QR code to instantly process a return and restock it."
    }
]

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isWebView = useWebView();

  useEffect(() => {
    if (isWebView) {
      router.push("/signup");
      return;
    }
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router, isWebView]);

  if (loading || user || isWebView) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background font-body">
      <header className="w-full fixed top-0 left-0 z-20 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <ScanBarcode className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline text-foreground whitespace-nowrap">Stockpile Scan</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-20">
        <section className="w-full flex-1 flex flex-col justify-center">
            <div className="container mx-auto px-4 py-16">
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="flex flex-col items-center">
                        <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground leading-tight">
                            Smart & Powerful Inventory
                        </h1>
                        <p className="mt-6 max-w-xl mx-auto text-muted-foreground text-center md:text-lg">
                           Stockpile Scan is the all-in-one solution for small businesses. Seamlessly track stock levels, process sales, and gain valuable insights with our intuitive platform.
                        </p>
                        <Button asChild size="lg" className="mt-8">
                            <Link href="/signup">
                                Learn More
                            </Link>
                        </Button>
                    </div>
                    <AnimatedLandingHero className="w-full h-auto max-w-2xl mx-auto mt-8"/>
                </div>
            </div>
        </section>

        <section className="py-16 sm:py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">All-in-One Business Solution</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                        From inventory tracking to sales analytics, Stockpile Scan provides all the tools you need to run your business efficiently.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="bg-card transform hover:-translate-y-2 transition-transform duration-300">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                   <feature.icon className="h-6 w-6 text-primary" />
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

        {!isWebView && (
          <section className="py-16 sm:py-20">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                      <h2 className="font-headline text-3xl md:text-4xl font-bold">Download Our App</h2>
                      <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                          Manage your inventory on the go with our mobile apps for Android and iOS.
                      </p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                      <Button asChild size="lg">
                          <a href="https://drive.google.com/uc?export=download&id=1j42DXVobfu8poI4-d9gb_FbEXHr_E6ZG" download>
                             <Download className="mr-2 h-5 w-5" />
                             Download for Android
                          </a>
                      </Button>
                       <Button asChild size="lg" variant="outline">
                          <a href="https://drive.google.com/uc?export=download&id=12B6Rr8i1OM4T3qm1pRju2gnOMu5vNj9d" download>
                             <Download className="mr-2 h-5 w-5" />
                             Download for iOS
                          </a>
                      </Button>
                  </div>
              </div>
          </section>
        )}
      </main>

      <footer className="bg-card">
          <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
              <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Stockpile Scan. All rights reserved.</p>
               <div className="flex gap-4 mt-4 sm:mt-0">
                  <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook /></Link>
                  <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter /></Link>
                  <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram /></Link>
              </div>
          </div>
      </footer>
    </div>
  );
}
