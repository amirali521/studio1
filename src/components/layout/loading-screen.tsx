"use client";

import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function LoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your application...</p>
        </div>
      </div>
    </div>
  );
}
