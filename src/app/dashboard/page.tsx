// src/app/dashboard/page.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Workflow, CheckCircle2, AlertCircle, Bot, Activity, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

// Mock data for demonstration
const kpiData = {
  totalWorkflows: 12,
  successfulRuns: 138,
  failedRuns: 14,
  activeAgents: 5,
};

const chartData = [
  { name: 'Jan', runs: 40, failed: 5 },
  { name: 'Feb', runs: 30, failed: 3 },
  { name: 'Mar', runs: 55, failed: 8 },
  { name: 'Apr', runs: 48, failed: 4 },
  { name: 'May', runs: 62, failed: 6 },
  { name: 'Jun', runs: 50, failed: 2 },
];

const recentActivities = [
    { id: 'act_1', description: 'Web Summarization for example.com completed.', type: 'Workflow Success', timestamp: '5m ago', status: 'completed' },
    { id: 'act_2', description: 'Agent "Web Intellect" provisioned.', type: 'Agent Action', timestamp: '1h ago', status: 'info' },
    { id: 'act_3', description: 'Generic prompt "Quantum Computing" failed.', type: 'Workflow Failure', timestamp: '2h ago', status: 'failed' },
    { id: 'act_4', description: 'User manually ran "Prompt Node".', type: 'Manual Action', timestamp: '3h ago', status: 'info' },
    { id: 'act_5', description: 'Workflow "My Custom Flow" saved.', type: 'User Action', timestamp: '1d ago', status: 'info' },
];

const statusBadgeVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    completed: 'default', // Using default for success to make it stand out
    failed: 'destructive',
    info: 'secondary',
};

const statusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
    failed: <AlertCircle className="h-4 w-4 text-destructive shrink-0" />,
    info: <Activity className="h-4 w-4 text-muted-foreground shrink-0" />,
};


export default function DashboardPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
         <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 shadow-sm backdrop-blur-lg sm:px-6 lg:px-8">
             <div className="flex items-center gap-2 md:gap-4">
                <Link href="/" className="flex items-center gap-2">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    <h1 className="font-headline text-xl md:text-2xl font-semibold text-foreground">
                    Loom Studio
                    </h1>
                </Link>
            </div>
             <nav>
                <Link href="/dashboard" className="text-sm font-medium text-primary ring-offset-background transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Dashboard</Link>
             </nav>
        </header>

        <main className="flex-1 p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-6">Dashboard</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                        <Workflow className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.totalWorkflows}</div>
                        <p className="text-xs text-muted-foreground">+2 since last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Successful Runs</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.successfulRuns}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Runs</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.failedRuns}</div>
                        <p className="text-xs text-muted-foreground">-5 since last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.activeAgents}</div>
                         <p className="text-xs text-muted-foreground">+1 since last hour</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Workflow Runs Overview</CardTitle>
                        <CardDescription>Monthly successful vs failed runs.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--background))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                    }}
                                />
                                <Legend wrapperStyle={{fontSize: "12px"}} />
                                <Bar dataKey="runs" name="Successful" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failed" name="Failed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                         <CardDescription>A log of recent events in your studio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivities.map((activity) => (
                                    <TableRow key={activity.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {statusIcon[activity.status] || <Activity className="h-4 w-4 text-muted-foreground shrink-0" />}
                                                <span className="font-medium">{activity.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadgeVariant[activity.status] || 'secondary'}>{activity.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{activity.timestamp}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}
