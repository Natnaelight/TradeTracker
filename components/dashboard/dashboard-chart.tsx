"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { format } from "date-fns";

interface Trade {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

interface DashboardChartProps {
  data: Trade[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    if (data && data.length) {
      // Process data for chart
      const processedData = data.map(trade => ({
        date: format(new Date(trade.date), "MMM dd"),
        amount: trade.amount,
      })).reverse(); // Show oldest to newest
      
      setChartData(processedData);
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 bg-muted/20 rounded-md">
        <p className="text-sm text-muted-foreground">No trade data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))' 
          }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area 
          type="monotone" 
          dataKey="amount" 
          stroke="hsl(var(--chart-2))" 
          fillOpacity={1} 
          fill="url(#colorAmount)" 
          strokeWidth={2} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}