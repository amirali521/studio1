
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { format, eachDayOfInterval, startOfDay } from "date-fns";
import { useMemo } from "react";
import { type Sale } from "@/lib/types";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";

interface SalesChartProps {
  data: Sale[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const { currency } = useCurrency();
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    
    const sortedSales = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstSaleDate = new Date(sortedSales[0].date);
    const lastSaleDate = new Date(sortedSales[sortedSales.length - 1].date);
    
    const interval = eachDayOfInterval({
      start: firstSaleDate,
      end: lastSaleDate,
    });

    const salesByDay = sortedSales.reduce((acc, sale) => {
      const day = format(new Date(sale.date), "yyyy-MM-dd");
      acc[day] = (acc[day] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    return interval.map(day => {
      const dayString = format(day, "yyyy-MM-dd");
      return {
        name: format(day, "MMM d"),
        total: salesByDay[dayString] || 0,
      };
    });

  }, [data]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {label}
              </span>
              <span className="font-bold text-muted-foreground">
                {formatCurrency(payload[0].value, currency)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value, currency).split('.')[0]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))', radius: 4 }}/>
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
