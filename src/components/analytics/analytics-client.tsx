
"use client";

import { useState, useMemo } from "react";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { type Sale, type Product, type SerializedProductItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Package, DollarSign, Archive, ClipboardList } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";
import { subDays } from "date-fns";
import SalesChart from "./sales-chart";
import SalesHistoryTable from "../sales/sales-history-table";

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export default function AnalyticsClient() {
  const { data: sales, loading: salesLoading } = useFirestoreCollection<Sale>("sales");
  const { data: products, loading: productsLoading } = useFirestoreCollection<Product>("products");
  const { data: serializedItems, loading: itemsLoading } = useFirestoreCollection<SerializedProductItem>("serializedItems");
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { currency } = useCurrency();

  const loading = salesLoading || productsLoading || itemsLoading;

  const timeRangeMap: Record<TimeRange, Date> = {
    '7d': subDays(new Date(), 7),
    '30d': subDays(new Date(), 30),
    '90d': subDays(new Date(), 90),
    '1y': subDays(new Date(), 365),
    'all': new Date(0),
  };

  const filteredSales = useMemo(() => {
    const startDate = timeRangeMap[timeRange];
    return sales.filter(sale => new Date(sale.date) >= startDate);
  }, [sales, timeRange]);

  const totalRevenue = useMemo(() => filteredSales.reduce((acc, sale) => acc + sale.total, 0), [filteredSales]);
  const totalProfit = useMemo(() => filteredSales.reduce((acc, sale) => acc + sale.profit, 0), [filteredSales]);
  const itemsSoldCount = useMemo(() => filteredSales.reduce((acc, sale) => acc + sale.items.filter(i => i.status !== 'returned').length, 0), [filteredSales]);

  const { inventoryCost, potentialRevenue } = useMemo(() => {
    const stockMap = serializedItems
      .filter(item => item.status === 'in_stock')
      .reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return products.reduce((acc, product) => {
      const quantity = stockMap[product.id] || 0;
      acc.inventoryCost += (quantity * product.purchasePrice);
      acc.potentialRevenue += (quantity * product.price);
      return acc;
    }, { inventoryCost: 0, potentialRevenue: 0 });
  }, [products, serializedItems]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
                <Button key={range} variant={timeRange === range ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(range)}>
                    {range.toUpperCase()}
                </Button>
            ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Inventory Cost</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(inventoryCost, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(potentialRevenue, currency)}</div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={filteredSales} />
          </CardContent>
        </Card>
        <div className="col-span-4 lg:col-span-3">
             <SalesHistoryTable sales={filteredSales} />
        </div>
      </div>
    </main>
  );
}
