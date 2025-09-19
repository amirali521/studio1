
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, eachDayOfInterval } from "date-fns";
import { useMemo } from "react";
import { type Sale } from "@/lib/types";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Card } from "../ui/card";

interface ProfitTrendChartProps {
  data: Sale[];
  dateRange?: DateRange;
}

export default function ProfitTrendChart({ data, dateRange }: ProfitTrendChartProps) {
  const { currency } = useCurrency();
  
  const chartData = useMemo(() => {
    if (data.length === 0 || !dateRange?.from) return [];
    
    const interval = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to || dateRange.from,
    });

    const profitByDay = data.reduce((acc, sale) => {
      const day = format(new Date(sale.date), "yyyy-MM-dd");
      acc[day] = (acc[day] || 0) + sale.profit;
      return acc;
    }, {} as Record<string, number>);

    return interval.map(day => {
      const dayString = format(day, "yyyy-MM-dd");
      return {
        name: format(day, "MMM d"),
        profit: profitByDay[dayString] || 0,
      };
    });

  }, [data, dateRange]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 shadow-lg">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-sm text-green-600">
            Profit: {formatCurrency(payload[0].value, currency)}
          </p>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}/>
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2} 
            dot={{ r: 4, fill: "hsl(var(--chart-2))" }}
            activeDot={{ r: 6, stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
