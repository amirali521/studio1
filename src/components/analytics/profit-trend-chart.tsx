
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, getWeek, formatISO, startOfWeek, startOfMonth } from "date-fns";
import { useMemo } from "react";
import { type Sale } from "@/lib/types";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Card } from "../ui/card";
import { TimeGrouping } from "./analytics-client";

interface ProfitTrendChartProps {
  data: Sale[];
  dateRange?: DateRange;
  timeGrouping?: TimeGrouping;
}

export default function ProfitTrendChart({ data, dateRange, timeGrouping = 'day' }: ProfitTrendChartProps) {
  const { currency } = useCurrency();

  const chartData = useMemo(() => {
    if (data.length === 0 || !dateRange?.from) return [];
    
    const profitByPeriod = data.reduce((acc, sale) => {
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

      acc[periodKey] = (acc[periodKey] || 0) + sale.profit;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(profitByPeriod).map(([period, profit], index) => {
      const date = new Date(period);
      let name: string;
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
      return { name, profit, index };
    }).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  }, [data, dateRange, timeGrouping]);
  

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
  
  const minWidth = chartData.length * (timeGrouping === 'day' ? 50 : (timeGrouping === 'week' ? 60 : 100));

  return (
    <div className="w-full h-[300px] sm:h-[350px] relative overflow-x-auto">
      <div style={{ width: '100%', height: '100%', minWidth: `${minWidth}px`}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
    </div>
  );
}
