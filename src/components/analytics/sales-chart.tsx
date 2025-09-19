
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, eachDayOfInterval } from "date-fns";
import { useMemo } from "react";
import { type Sale } from "@/lib/types";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Card } from "../ui/card";

interface SalesChartProps {
  data: Sale[];
  dateRange?: DateRange;
}

export default function SalesChart({ data, dateRange }: SalesChartProps) {
  const { currency } = useCurrency();
  
  const chartData = useMemo(() => {
    if (data.length === 0 || !dateRange?.from) return [];
    
    const interval = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to || dateRange.from,
    });

    const salesByDay = data.reduce((acc, sale) => {
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

  }, [data, dateRange]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 shadow-lg">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-sm text-primary">
            Revenue: {formatCurrency(payload[0].value, currency)}
          </p>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
            tickFormatter={(value) => formatCurrency(Number(value), currency).split('.')[0]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))', radius: 4 }}/>
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
