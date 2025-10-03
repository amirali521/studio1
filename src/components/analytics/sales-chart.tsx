
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
    if (data.length === 0 || !dateRange?.from || !dateRange.to) return [];
    
    const salesByDay = data.reduce((acc, sale) => {
      const day = format(new Date(sale.date), "yyyy-MM-dd");
      acc[day] = (acc[day] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

    return allDays.map(day => {
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
    <div className="w-full h-[350px]">
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }}/>
          <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

    