"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SalesHistoryTable from "./sales-history-table";
import { Sale } from "@/lib/types";
import { History } from "lucide-react";

interface SalesHistoryDialogProps {
    sales: Sale[];
}

export default function SalesHistoryDialog({ sales }: SalesHistoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
            <History className="mr-2"/>
            View Sales History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Sales History</DialogTitle>
        </DialogHeader>
        <SalesHistoryTable sales={sales} />
      </DialogContent>
    </Dialog>
  );
}
