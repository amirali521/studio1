
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from "recharts";
import { format, eachDayOfInterval, startOfWeek, startOfMonth, getWeek, formatISO } from "date-fns";
import { useMemo, useState } from "react";
import { type Sale } from "@/lib/types";
import { useCurrency } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Card } from "../ui/card";
import { TimeGrouping } from "./analytics-client";
import { Button } from "../ui/button";

interface ProfitTrendChartProps {
  data: Sale[];
  dateRange?: DateRange;
  timeGrouping?: TimeGrouping;
}

export default function ProfitTrendChart({ data, dateRange, timeGrouping = 'day' }: ProfitTrendChartProps) {
  const { currency } = useCurrency();
  const [zoomArea, setZoomArea] = useState<{ x1: string | number, x2: string | number } | null>(null);
  const [zoomDomain, setZoomDomain] = useState<{ left: string | number, right: string | number } | null>(null);

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
  
  const handleMouseDown = (e: any) => {
    if (!e) return;
    setZoomArea({ x1: e.activeLabel, x2: e.activeLabel });
  };
  
  const handleMouseMove = (e: any) => {
    if (zoomArea?.x1 && e) {
        setZoomArea({ ...zoomArea, x2: e.activeLabel });
    }
  };

  const handleMouseUp = () => {
    if (zoomArea) {
        const { x1, x2 } = zoomArea;
        const x1Index = chartData.findIndex(d => d.name === x1);
        const x2Index = chartData.findIndex(d => d.name === x2);

        if (x1Index !== -1 && x2Index !== -1 && x1Index !== x2Index) {
            const [left, right] = [Math.min(x1Index, x2Index), Math.max(x1Index, x2Index)];
            setZoomDomain({ left: chartData[left].name, right: chartData[right].name });
        }
        setZoomArea(null);
    }
  };

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
  
  const domainData = zoomDomain ? chartData.filter(d => d.name >= zoomDomain.left && d.name <= zoomDomain.right) : chartData;

  return (
    <div className="w-full h-[300px] sm:h-[350px] relative">
      {zoomDomain && (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomDomain(null)}
            className="absolute top-0 right-4 z-10"
        >
            Zoom Out
        </Button>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            allowDataOverflow
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={zoomDomain ? [zoomDomain.left, zoomDomain.right] : undefined}
          />
          <YAxis
            allowDataOverflow
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(Number(value), currency).split('.')[0]}
            domain={['dataMin', 'dataMax']}
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
          {zoomArea && (
            <ReferenceArea x1={zoomArea.x1} x2={zoomArea.x2} strokeOpacity={0.3} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
