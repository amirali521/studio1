
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, eachDayOfInterval, startOfWeek, startOfMonth, getWeek, formatISO } from "date-fns";
import { useMemo } from "react";
import { type Sale } from "@/lib/types";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Card } from "../ui/card";
import { TimeGrouping } from "./analytics-client";

interface SalesChartProps {
  data: Sale[];
  dateRange?: DateRange;
  timeGrouping?: TimeGrouping;
}

export default function SalesChart({ data, dateRange, timeGrouping = 'day' }: SalesChartProps) {
  const { currency } = useCurrency();
  
  const chartData = useMemo(() => {
    if (data.length === 0 || !dateRange?.from) return [];
    
    const salesByPeriod = data.reduce((acc, sale) => {
      const saleDate = new Date(sale.date);
      let periodKey: string;
      
      switch(timeGrouping) {
        case 'week':
          periodKey = formatISO(startOfWeek(saleDate, { weekStartsOn: 1 }));
          break;
        case 'month':
          periodKey = format(saleDate, "yyyy-MM");
          break;
        case 'day':
        default:
          periodKey = format(saleDate, "yyyy-MM-dd");
          break;
      }
      
      acc[periodKey] = (acc[periodKey] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    
    return Object.entries(salesByPeriod).map(([period, total]) => {
      let name: string;
      const date = new Date(period);
      switch(timeGrouping) {
        case 'week':
          name = `W${getWeek(date, { weekStartsOn: 1 })}`;
          break;
        case 'month':
          name = format(date, "MMM yyyy");
          break;
        case 'day':
        default:
          name = format(date, "MMM d");
          break;
      }
      return { name, total };
    }).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()); // Basic sort, might need refinement for weeks

  }, [data, dateRange, timeGrouping]);
  
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
    <div className="w-full h-[300px] sm:h-[350px]">
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
