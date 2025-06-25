// src/components/dashboard/workflow-efficiency-chart.tsx
"use client"

import { Line, LineChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";


const chartData = [
  { month: "January", successRate: 86, avgDuration: 120 },
  { month: "February", successRate: 88, avgDuration: 110 },
  { month: "March", successRate: 92, avgDuration: 95 },
  { month: "April", successRate: 90, avgDuration: 105 },
  { month: "May", successRate: 94, avgDuration: 90 },
  { month: "June", successRate: 95, avgDuration: 85 },
];

const chartConfig = {
  successRate: {
    label: "Success Rate",
    color: "hsl(var(--accent))",
  },
  avgDuration: {
    label: "Avg. Duration (s)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function WorkflowEfficiencyChart() {
  return (
    <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
            data={chartData}
            margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 0,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
            />
            <Tooltip
                cursor={false}
                content={<ChartTooltipContent 
                    indicator="line" 
                    labelClassName='text-background'
                    className='bg-foreground text-background'
                />}
            />
            <Line
                dataKey="successRate"
                type="monotone"
                stroke="var(--color-successRate)"
                strokeWidth={2}
                dot={true}
            />
            <Line
                dataKey="avgDuration"
                type="monotone"
                stroke="var(--color-avgDuration)"
                strokeWidth={2}
                dot={true}
            />
            </LineChart>
        </ResponsiveContainer>
    </div>
  )
}
