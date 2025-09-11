import { ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ScanBarcode className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold font-headline text-foreground whitespace-nowrap">
        Stockpile Scan
      </h1>
    </div>
  );
}
