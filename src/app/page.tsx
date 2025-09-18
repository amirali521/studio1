
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";
import { ScanBarcode, AreaChart, QrCode, ShoppingCart, Undo2, MessageSquare, Facebook, Twitter, Instagram } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedLandingHero from "@/components/animated-landing-hero";

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl" />
      </div>
       <div className="absolute bottom-0 left-0 translate-x-[-20%] translate-y-[20%]">
          <div className="w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl" />
      </div>
       <div className="absolute top-0 right-0 -translate-y-[20%] translate-x-[20%]">
          <div className="w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>
      
      <header className="w-full absolute top-0 left-0 z-20">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
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

      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center min-h-screen">
            <div className="container mx-auto px-4 py-6 sm:py-8">
                <div className="relative bg-card/10 backdrop-blur-lg rounded-2xl shadow-lg p-8 md:p-12 overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                        <div>
                            <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground leading-tight">
                                Smart & Powerful Inventory
                            </h1>
                            <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-center md:text-lg font-semibold">
                               Stockpile Scan is the all-in-one solution for small businesses. Seamlessly track stock levels, process sales, and gain valuable insights with our intuitive platform.
                            </p>
                            <Button asChild size="lg" className="mt-4">
                                <Link href="/signup">
                                    Learn More
                                </Link>
                            </Button>
                        </div>
                        <AnimatedLandingHero className="w-full h-auto max-w-2xl mx-auto"/>
                    </div>
                </div>
            </div>
        </section>

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
      </main>

      <footer className="bg-card mt-20">
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
