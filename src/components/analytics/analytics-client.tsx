
"use client";

import { useState, useMemo } from "react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { type Sale, type Product, type SerializedProductItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Package, DollarSign, Calendar as CalendarIcon, ClipboardList, ShoppingBag, Wand2, Archive, BarChart, Banknote, Check } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency, formatNumberCompact, formatCurrencyCompact } from "@/lib/utils";
import { subDays, startOfDay, endOfDay } from "date-fns";
import SalesChart from "./sales-chart";
import SalesHistoryTable from "../sales/sales-history-table";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProfitTrendChart from "./profit-trend-chart";
import ProductPerformanceChart from "./product-performance-chart";
import AiAnalysisDialog from "./ai-analysis-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type TimeGrouping = 'day' | 'week' | 'month';

export default function AnalyticsClient() {
  const { data: sales, loading: salesLoading } = useFirestoreCollection<Sale>("sales");
  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  const { currency } = useCurrency();
  const loading = salesLoading || productsLoading || itemsLoading;

  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(['all']);
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>('day');


  const handleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
        if (productId === 'all') {
            return prev.includes('all') ? [] : ['all'];
        }

        const newSelection = prev.filter(id => id !== 'all');
        
        if (newSelection.includes(productId)) {
            const filtered = newSelection.filter(id => id !== productId);
            return filtered.length === 0 ? ['all'] : filtered;
        } else {
            return [...newSelection, productId];
        }
    });
  };

  const isAllSelected = selectedProductIds.includes('all');
  
  const getSelectedProductsText = () => {
    if (isAllSelected || selectedProductIds.length === 0) {
      return "All Products";
    }
    if (selectedProductIds.length === 1) {
      const productName = products.find(p => p.id === selectedProductIds[0])?.name;
      return productName || "1 selected";
    }
    return `${selectedProductIds.length} products selected`;
  };


  const filteredSales = useMemo(() => {
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : undefined;
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : undefined;

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const dateCondition = (!fromDate || saleDate >= fromDate) && (!toDate || saleDate <= toDate);
      if (!dateCondition) return false;
      
      if (isAllSelected) return true;

      if (selectedProductIds.length === 0) return false;

      return sale.items.some(item => {
          const serialized = serializedItems.find(si => si.serialNumber === item.serialNumber);
          return serialized && selectedProductIds.includes(serialized.productId);
      });
    });
  }, [sales, dateRange, selectedProductIds, serializedItems, isAllSelected]);
  
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

  const {
      inventoryCost,
      potentialRevenue,
      potentialProfit
  } = useMemo(() => {
      const inStockItems = serializedItems.filter(i => i.status === 'in_stock');
      const cost = inStockItems.reduce((acc, item) => {
          const product = products.find(p => p.id === item.productId);
          return acc + (product?.purchasePrice || 0);
      }, 0);
      const revenue = inStockItems.reduce((acc, item) => {
          const product = products.find(p => p.id === item.productId);
          return acc + (product?.price || 0);
      }, 0);
      return {
          inventoryCost: cost,
          potentialRevenue: revenue,
          potentialProfit: revenue - cost,
      }
  }, [products, serializedItems]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
             <CardTitle>Filters</CardTitle>
             <Button variant="outline" size="sm" onClick={() => setIsAiDialogOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" />
                Ask AI
             </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                         <span>{getSelectedProductsText()}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                    <DropdownMenuLabel>Filter by Product</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuCheckboxItem
                        checked={isAllSelected}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={() => handleProductSelection('all')}
                    >
                        All Products
                    </DropdownMenuCheckboxItem>
                    {products.map(p => (
                        <DropdownMenuCheckboxItem
                            key={p.id}
                            checked={selectedProductIds.includes(p.id)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={() => handleProductSelection(p.id)}
                        >
                            {p.name}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
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
            <RadioGroup
                defaultValue="day"
                onValueChange={(value: TimeGrouping) => setTimeGrouping(value)}
                className="flex items-center space-x-2"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="day" id="day" />
                    <Label htmlFor="day">Day</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week">Week</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month">Month</Label>
                </div>
            </RadioGroup>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {/* Sales Stats */}
        <Card>
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
        {/* Inventory Stats */}
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Cost</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyCompact(inventoryCost, currency)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyCompact(potentialRevenue, currency)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyCompact(potentialProfit, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Selling</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={topSellingProduct}>{topSellingProduct}</div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
        <Card className="flex flex-col lg:col-span-3">
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
            <CardDescription>Revenue from sales aggregated by {timeGrouping}. Drag on the chart to zoom.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pl-2 min-w-0">
            <SalesChart data={filteredSales} dateRange={dateRange} timeGrouping={timeGrouping} />
          </CardContent>
        </Card>
        <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Sales distribution by product.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pl-2 min-w-0">
                 <ProductPerformanceChart sales={filteredSales} products={products} serializedItems={serializedItems}/>
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>Profit from sales aggregated by {timeGrouping}. Drag on the chart to zoom.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-w-0 pl-2">
              <ProfitTrendChart data={filteredSales} dateRange={dateRange} timeGrouping={timeGrouping} />
            </CardContent>
          </Card>
       </div>
       <div>
            <SalesHistoryTable sales={filteredSales} />
       </div>
    </div>
    <AiAnalysisDialog
      isOpen={isAiDialogOpen}
      onClose={() => setIsAiDialogOpen(false)}
      products={products}
      sales={sales}
      serializedItems={serializedItems}
    />
    </>
  );
}
