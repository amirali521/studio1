
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeSalesData } from "@/ai/flows/analyze-sales-data";
import type { Product, Sale, SerializedProductItem } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";

interface AiAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  sales: Sale[];
  serializedItems: SerializedProductItem[];
}

export default function AiAnalysisDialog({
  isOpen,
  onClose,
  products,
  sales,
  serializedItems,
}: AiAnalysisDialogProps) {
  const [query, setQuery] = useState("Give me a full analysis of my sales data.");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!query) {
      toast({ variant: "destructive", title: "Query required", description: "Please enter a question to ask the AI." });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult("");
    try {
      const result = await analyzeSalesData({
        query,
        productsJson: JSON.stringify(products),
        salesJson: JSON.stringify(sales),
        serializedItemsJson: JSON.stringify(serializedItems),
      });
      setAnalysisResult(result.analysis);
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate analysis." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Analyze Data with AI</DialogTitle>
          <DialogDescription>
            Ask a question about your sales, products, and inventory to get an instant analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What was my total profit last month?"
              disabled={isAnalyzing}
            />
            <Button onClick={handleAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <Wand2 />}
            </Button>
          </div>
          <ScrollArea className="h-72 w-full rounded-md border p-4">
            {isAnalyzing && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {analysisResult && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }}
              />
            )}
            {!isAnalyzing && !analysisResult && (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    Your analysis will appear here.
                </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
