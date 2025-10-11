
"use client";

import { useState } from "react";
import type { Sale } from "@/lib/types";
import { format, startOfDay, endOfDay } from "date-fns";
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
import { Printer, Calendar as CalendarIcon, Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";


interface SalesHistoryTableProps {
  sales: Sale[];
}

export default function SalesHistoryTable({ sales }: SalesHistoryTableProps) {
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExport = (format: 'pdf' | 'csv') => {
    if (!exportDateRange?.from || !exportDateRange?.to) {
      toast({
        variant: "destructive",
        title: "Date Range Required",
        description: "Please select a date range to export.",
      });
      return;
    }
    
    const fromDate = startOfDay(exportDateRange.from);
    const toDate = endOfDay(exportDateRange.to);

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= fromDate && saleDate <= toDate;
    });

    if (filteredSales.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There are no sales in the selected date range.",
      });
      return;
    }

    if (format === 'pdf') {
      exportToPdf(filteredSales);
    } else {
      exportToCsv(filteredSales);
    }
  }

  const exportToPdf = (data: Sale[]) => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Products", "Subtotal", "Discount", "Tax", "Total"];
    const tableRows: any[][] = [];

    data.forEach(sale => {
      const saleData = [
        format(new Date(sale.date), "yyyy-MM-dd HH:mm"),
        sale.items.map(i => `${i.productName} (${i.status})`).join(', '),
        formatCurrency(sale.subtotal, currency),
        formatCurrency(sale.discount, currency),
        formatCurrency(sale.tax, currency),
        formatCurrency(sale.total, currency),
      ];
      tableRows.push(saleData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.text("Sales Report", 14, 15);
    doc.save(`sales_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
     toast({ title: "PDF Exported", description: "Your sales report has been downloaded." });
  };
  
  const exportToCsv = (data: Sale[]) => {
      const flatData = data.flatMap(sale => 
        sale.items.map(item => ({
            saleId: sale.saleId,
            saleDate: format(new Date(sale.date), "yyyy-MM-dd HH:mm:ss"),
            productName: item.productName,
            serialNumber: item.serialNumber,
            status: item.status,
            price: item.price,
            discount: item.discount,
            tax: item.tax,
            saleSubtotal: sale.subtotal,
            saleDiscount: sale.discount,
            saleTax: sale.tax,
            saleTotal: sale.total,
            saleProfit: sale.profit,
        }))
    );
    const csv = Papa.unparse(flatData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Exported", description: "Your sales report has been downloaded." });
  };

  return (
    <Card id="sales-history">
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="font-headline">Sales History</CardTitle>
          <CardDescription>
            A log of all your recorded sales transactions.
          </CardDescription>
        </div>
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className="w-full sm:w-auto justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {exportDateRange?.from ? (
                    exportDateRange.to ? (
                        <>
                        {format(exportDateRange.from, "LLL dd, y")} -{" "}
                        {format(exportDateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(exportDateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date range</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={exportDateRange?.from}
                    selected={exportDateRange}
                    onSelect={setExportDateRange}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                        Download as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        Download as PDF
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {sortedSales.length > 0 ? (
          <div className="rounded-md border max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items Sold</TableHead>
                  <TableHead className="hidden sm:table-cell">Profit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{format(new Date(sale.date), "MMM d, yyyy")}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(sale.date), "h:mm a")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {sale.items.map((item, index) => (
                          <Badge 
                            key={index} 
                            variant={item.status === 'returned' ? 'destructive' : 'secondary'} 
                            className="font-normal whitespace-nowrap"
                          >
                             {item.productName} {item.status === 'returned' && '(Returned)'}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-green-600 hidden sm:table-cell">{formatCurrency(sale.profit, currency)}</TableCell>
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
