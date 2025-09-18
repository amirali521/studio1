
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";
import LandingHero from "@/components/landing-hero";
import { ScanBarcode, AreaChart, QrCode, ShoppingCart, Undo2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    },
    {
        icon: MessageSquare,
        title: "Community Chat",
        description: "Connect with other business owners, ask questions, and share insights in the community chat platform."
    }
]

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
    <div className="flex flex-col min-h-[100dvh] bg-background font-body overflow-x-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl -z-10"></div>
      
      <header className="w-full">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <ScanBarcode className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline text-foreground whitespace-nowrap">Stockpile Scan</span>
          </Link>
          <div className="flex items-center gap-4">
             <Button asChild variant="ghost" className="hidden md:inline-flex">
                 <Link href="/login">Sign In</Link>
             </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="text-center md:text-left">
                        <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground leading-tight">
                            Smart Inventory, Seamless Sales
                        </h1>
                        <p className="mt-4 max-w-md mx-auto md:mx-0 text-muted-foreground md:text-lg">
                           Stockpile Scan is the all-in-one solution for small businesses. Seamlessly track stock levels, process sales, and gain valuable insights.
                        </p>
                        <Button asChild size="lg" className="mt-8">
                            <Link href="/signup">
                                Learn More
                            </Link>
                        </Button>
                    </div>
                    <div>
                        <LandingHero className="w-full h-auto max-w-lg mx-auto"/>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <section className="py-12 sm:py-20">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="font-headline text-3xl md:text-4xl font-bold">All-in-One Business Solution</h2>
                  <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                      From inventory tracking to sales analytics, Stockpile Scan provides all the tools you need to run your business efficiently.
                  </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                      <Card key={index} className="bg-card/80 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300">
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

      <footer className="bg-card mt-20">
          <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
              <p className="text-sm">&copy; {new Date().getFullYear()} Stockpile Scan. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
}
