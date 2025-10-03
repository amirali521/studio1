
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { format, getWeek, formatISO, startOfWeek, startOfMonth } from "date-fns";
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

    
    const sortedPeriods = Object.entries(salesByPeriod)
      .map(([period, total]) => ({ period, total }))
      .sort((a,b) => new Date(a.period).getTime() - new Date(b.period).getTime());

    return sortedPeriods.map((entry, index) => {
      let name: string;
      const date = new Date(entry.period);
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
      const prevTotal = index > 0 ? sortedPeriods[index-1].total : 0;

      return { name, total: entry.total, color: entry.total >= prevTotal ? '#22c55e' : '#ef4444' };
    });

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
  
  const minWidth = chartData.length * (timeGrouping === 'day' ? 50 : (timeGrouping === 'week' ? 60 : 100));

  return (
    <div className="w-full h-[300px] sm:h-[350px] relative overflow-x-auto">
       <div style={{ width: '100%', height: '100%', minWidth: `${minWidth}px`}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(Number(value), currency).split('.')[0]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }}/>
              <Bar dataKey="total">
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
}
