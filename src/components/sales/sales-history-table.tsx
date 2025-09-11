
"use client";

import type { Sale } from "@/lib/types";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/currency-context";
import { InvoiceDialog } from "./invoice-dialog";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";

interface SalesHistoryTableProps {
  sales: Sale[];
}

export default function SalesHistoryTable({ sales }: SalesHistoryTableProps) {
  const { currency } = useCurrency();
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Sales History</CardTitle>
        <CardDescription>
          A log of all your recorded sales transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedSales.length > 0 ? (
          <div className="rounded-md border max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items Sold</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(sale.date), "MMM d, yyyy, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {sale.items.map((item, index) => (
                          <Badge key={index} variant="secondary" className="font-normal">
                             {item.productName} (SN: {item.serialNumber})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(sale.total, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                       <InvoiceDialog sale={sale}>
                          <Button variant="ghost" size="icon">
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Print Invoice</span>
                          </Button>
                       </InvoiceDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
            <h3 className="text-xl font-semibold">No Sales Yet</h3>
            <p className="text-muted-foreground">
              Record your first sale to see it here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    