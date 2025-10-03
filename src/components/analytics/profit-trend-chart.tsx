"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, getWeek, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, formatISO } from "date-fns";
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
    if (data.length === 0 || !dateRange?.from || !dateRange.to) return [];
    
    const profitByPeriod = data.reduce((acc, sale) => {
      const saleDate = new Date(sale.date);
      let periodKey: string;

      switch(timeGrouping) {
        case 'week':
          periodKey = formatISO(startOfWeek(saleDate, { weekStartsOn: 1 }));
          break;
        case 'month':
          periodKey = formatISO(startOfMonth(saleDate));
          break;
        case 'day':
        default:
          periodKey = format(saleDate, "yyyy-MM-dd");
          break;
      }

      acc[periodKey] = (acc[periodKey] || 0) + sale.profit;
      return acc;
    }, {} as Record<string, number>);

    let allPeriods: Date[];
    switch (timeGrouping) {
        case 'week':
            allPeriods = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
            break;
        case 'month':
            allPeriods = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
            break;
        case 'day':
        default:
            allPeriods = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
            break;
    }

    return allPeriods.map(periodDate => {
        let periodKey: string;
        let name: string;

        switch (timeGrouping) {
            case 'week':
                periodKey = formatISO(periodDate);
                name = `W${getWeek(periodDate, { weekStartsOn: 1 })}`;
                break;
            case 'month':
                periodKey = formatISO(periodDate);
                name = format(periodDate, "MMM yyyy");
                break;
            case 'day':
            default:
                periodKey = format(periodDate, "yyyy-MM-dd");
                name = format(periodDate, "MMM d");
                break;
        }

        return {
            name,
            profit: profitByPeriod[periodKey] || 0,
            date: periodDate,
        };
    });

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
    <div className="w-full h-[300px] sm:h-[350px] overflow-x-auto">
      <div style={{ width: `${minWidth}px`, height: '100%'}}>
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
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
