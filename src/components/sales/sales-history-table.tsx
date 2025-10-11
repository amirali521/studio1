
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
import { Printer, Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import { Invoice } from "./invoice";


interface SalesHistoryTableProps {
  sales: Sale[];
}

export default function SalesHistoryTable({ sales }: SalesHistoryTableProps) {
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const [isDownloadingReceipts, setIsDownloadingReceipts] = useState(false);
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getFilteredSales = () => {
    if (!exportDateRange?.from || !exportDateRange?.to) {
      return sortedSales; // Return all sales if no range is selected
    }
    const fromDate = startOfDay(exportDateRange.from);
    const toDate = endOfDay(exportDateRange.to);

    return sortedSales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= fromDate && saleDate <= toDate;
    });
  }

  const handleExport = (format: 'pdf' | 'csv') => {
    const filteredSales = getFilteredSales();

    if (filteredSales.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There are no sales in the selected date range to export.",
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
  
  const handleDownloadAllReceipts = async () => {
    const filteredSales = getFilteredSales();
     if (filteredSales.length === 0) {
      toast({
        variant: "destructive",
        title: "No Receipts",
        description: "There are no sales in the selected period to download receipts for.",
      });
      return;
    }
    setIsDownloadingReceipts(true);

    try {
        const doc = new jsPDF('p', 'px', 'a4'); // Use pixels for easier coordination with canvas
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // A4 aspect ratio
        const a4Ratio = Math.sqrt(2);
        
        for (let i = 0; i < filteredSales.length; i++) {
            const sale = filteredSales[i];
            
            // Create a temporary div to render the invoice for canvas capture
            const invoiceContainer = document.createElement('div');
            invoiceContainer.style.position = 'absolute';
            invoiceContainer.style.left = '-9999px';
            const invoiceRoot = document.createElement('div');
            invoiceContainer.appendChild(invoiceRoot);
            document.body.appendChild(invoiceContainer);

            // This is a trick to use React's rendering to get the HTML
            const { createRoot } = await import('react-dom/client');
            const root = createRoot(invoiceRoot);
            root.render(<Invoice sale={sale} />);
            
            // Give it a moment to render
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const canvas = await html2canvas(invoiceRoot.firstChild as HTMLElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            if (i > 0) {
                doc.addPage();
            }

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;

            // Fit the image to the page width
            let finalWidth = pageWidth - 20; // with margin
            let finalHeight = finalWidth / ratio;

            if(finalHeight > pageHeight - 20) {
                finalHeight = pageHeight - 20;
                finalWidth = finalHeight * ratio;
            }

            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;
            
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, finalWidth, finalHeight);

            // Cleanup
            root.unmount();
            document.body.removeChild(invoiceContainer);
        }

        doc.save(`receipts_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast({ title: "Receipts PDF Downloaded", description: "A multi-page PDF with receipts has been saved." });

    } catch (error) {
        console.error("Error generating receipts PDF:", error);
        toast({ variant: "destructive", title: "PDF Error", description: "Could not generate receipts PDF." });
    } finally {
        setIsDownloadingReceipts(false);
    }
  }

  const getItemsSoldDisplay = (items: Sale['items']) => {
    if (items.length === 1) {
      const item = items[0];
      const isReturned = item.status === 'returned';
      return (
         <Badge 
            variant={isReturned ? 'destructive' : 'secondary'} 
            className="font-normal whitespace-nowrap"
          >
            {item.productName} {isReturned && '(Returned)'}
          </Badge>
      )
    }
    
    const returnedCount = items.filter(i => i.status === 'returned').length;
    const soldCount = items.length - returnedCount;
    
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge variant="secondary" className="font-normal whitespace-nowrap">
          {items.length} items
        </Badge>
        <span className="text-xs text-muted-foreground">
          ({soldCount} sold, {returnedCount} returned)
        </span>
      </div>
    );
  }

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
            <div className="flex gap-2">
               <Button variant="outline" onClick={handleDownloadAllReceipts} disabled={isDownloadingReceipts} className="w-full">
                 {isDownloadingReceipts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                 Receipts
              </Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                          <Download className="mr-2 h-4 w-4" /> Data
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
                      {getItemsSoldDisplay(sale.items)}
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
