
"use client";

import { useState, useMemo } from "react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { type Sale, type Product, type SerializedProductItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Package, DollarSign, Calendar as CalendarIcon, ClipboardList, ShoppingBag } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency, formatNumberCompact } from "@/lib/utils";
import { subDays, startOfDay, endOfDay } from "date-fns";
import SalesChart from "./sales-chart";
import SalesHistoryTable from "../sales/sales-history-table";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfitTrendChart from "./profit-trend-chart";
import ProductPerformanceChart from "./product-performance-chart";

export default function AnalyticsClient() {
  const { data: sales, loading: salesLoading } = useFirestoreCollection<Sale>("sales");
  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  const { currency } = useCurrency();
  const loading = salesLoading || productsLoading || itemsLoading;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedProductId, setSelectedProductId] = useState<string>('all');

  const filteredSales = useMemo(() => {
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : undefined;
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : undefined;

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const dateCondition = (!fromDate || saleDate >= fromDate) && (!toDate || saleDate <= toDate);
      if (!dateCondition) return false;
      
      if (selectedProductId === 'all') return true;

      return sale.items.some(item => {
          const serialized = serializedItems.find(si => si.serialNumber === item.serialNumber);
          return serialized?.productId === selectedProductId;
      });
    });
  }, [sales, dateRange, selectedProductId, serializedItems]);
  
  const { 
      totalRevenue, 
      totalProfit, 
      totalItemsSold, 
      avgSaleValue, 
      topSellingProduct 
  } = useMemo(() => {
    const revenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const profit = filteredSales.reduce((acc, sale) => acc + sale.profit, 0);
    const itemsSoldCount = filteredSales.reduce((acc, sale) => acc + sale.items.filter(i => i.status !== 'returned').length, 0);
    const avgSale = filteredSales.length > 0 ? revenue / filteredSales.length : 0;

    const productSalesCount = filteredSales
      .flatMap(sale => sale.items)
      .reduce((acc, item) => {
        const serialized = serializedItems.find(si => si.serialNumber === item.serialNumber);
        if (serialized) {
            acc[serialized.productId] = (acc[serialized.productId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
    const topProductId = Object.keys(productSalesCount).sort((a, b) => productSalesCount[b] - a)[0];
    const topProduct = products.find(p => p.id === topProductId);
    
    return {
      totalRevenue: revenue,
      totalProfit: profit,
      totalItemsSold: itemsSoldCount,
      avgSaleValue: avgSale,
      topSellingProduct: topProduct ? `${topProduct.name} (${formatNumberCompact(productSalesCount[topProductId])} sold)` : 'N/A',
    };
  }, [filteredSales, products, serializedItems]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <Card>
        <CardHeader>
             <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit, currency)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumberCompact(totalItemsSold)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Sale Value</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgSaleValue, currency)}</div>
          </CardContent>
        </Card>
         <Card className="col-span-2 md:col-span-3 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Selling Product</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={topSellingProduct}>{topSellingProduct}</div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
            <CardDescription>Daily revenue from sales.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={filteredSales} dateRange={dateRange}/>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Sales distribution by product.</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
                 <ProductPerformanceChart sales={filteredSales} products={products} serializedItems={serializedItems}/>
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>Daily profit from sales.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitTrendChart data={filteredSales} dateRange={dateRange}/>
            </CardContent>
          </Card>
       </div>
       <div>
            <SalesHistoryTable sales={filteredSales} />
       </div>
    </div>
  );
}
