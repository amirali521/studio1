
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/layout/loading-screen";
import LandingHero from "@/components/landing-hero";
import { ScanBarcode } from "lucide-react";

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
    <div className="flex flex-col min-h-screen bg-background font-body overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl -z-10"></div>
      
      <header className="w-full">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <ScanBarcode className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline text-foreground whitespace-nowrap">Stockpile Scan</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About us</Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Work</Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Info</Link>
          </nav>
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
        <div className="container mx-auto px-4 py-12">
            <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="text-center md:text-left">
                        <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground leading-tight">
                            Inventory Management
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
    </div>
  );
}
