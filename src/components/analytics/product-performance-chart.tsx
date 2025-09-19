
"use client";

import * as React from "react"
import { Label, Pie, PieChart, Sector, Cell, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"
import { type Sale, type Product, type SerializedProductItem } from "@/lib/types"
import { useCurrency } from "@/contexts/currency-context"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

interface ProductPerformanceChartProps {
  sales: Sale[];
  products: Product[];
  serializedItems: SerializedProductItem[];
}

export default function ProductPerformanceChart({ sales, products, serializedItems }: ProductPerformanceChartProps) {
  const { currency } = useCurrency();

  const chartData = useMemo(() => {
    if (sales.length === 0) return [];

    const productRevenue = sales
      .flatMap(sale => sale.items)
      .reduce((acc, item) => {
        const serialized = serializedItems.find(si => si.serialNumber === item.serialNumber);
        if (serialized) {
          const product = products.find(p => p.id === serialized.productId);
          if (product) {
            const revenue = item.price - item.discount;
            acc[product.name] = (acc[product.name] || 0) + revenue;
          }
        }
        return acc;
      }, {} as Record<string, number>);
      
    return Object.entries(productRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Take top 5 products for clarity
  }, [sales, products, serializedItems]);
  
   const totalRevenue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  if (chartData.length === 0) {
      return (
          <div className="flex justify-center items-center h-[300px] sm:h-[350px] text-muted-foreground">
              No sales data for the selected period.
          </div>
      )
  }

  return (
    <div className="h-[300px] sm:h-[350px] w-full">
         <ChartContainer
            config={{}}
            className="mx-auto h-full w-full"
        >
            <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                     <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={5}
                        >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                         <Label
                            content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    >
                                    <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="fill-foreground text-3xl font-bold"
                                    >
                                        {formatCurrency(totalRevenue, currency).split('.')[0]}
                                    </tspan>
                                    <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 24}
                                        className="fill-muted-foreground"
                                    >
                                        Revenue
                                    </tspan>
                                    </text>
                                )
                                }
                            }}
                            />
                    </Pie>
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        content={({ payload }) => (
                            <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                                {payload?.map((entry, index) => (
                                    <li key={`item-${index}`} className="flex items-center gap-2 text-sm">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span>{entry.value}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    />
                 </PieChart>
            </ResponsiveContainer>
         </ChartContainer>
    </div>
  );
}
