
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { format, getWeek, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, formatISO } from "date-fns";
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
    if (data.length === 0 || !dateRange?.from || !dateRange.to) return [];
    
    const salesByPeriod = data.reduce((acc, sale) => {
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
      
      acc[periodKey] = (acc[periodKey] || 0) + sale.total;
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

    const completeData = allPeriods.map(periodDate => {
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
            total: salesByPeriod[periodKey] || 0,
            date: periodDate,
        };
    });

    return completeData.map((entry, index) => {
      const prevTotal = index > 0 ? completeData[index-1].total : 0;
      return { ...entry, color: entry.total >= prevTotal ? '#22c55e' : '#ef4444' };
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
    <div className="w-full h-[300px] sm:h-[350px] overflow-x-auto">
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
                    <Cell key={`cell-${index}`} fill={entry.total > 0 ? entry.color : 'hsl(var(--muted))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
}
