// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  BrainCircuit,
  Home,
  ChevronDown,
  Search,
  Bell,
  LayoutGrid,
  UserCircle,
  Clock,
  Cpu,
  MemoryStick,
  Users,
  HardDrive,
  Network,
  Rocket,
  Sparkles,
  Bot,
  GitBranch,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const systemSnapshotData = [
  { name: 'CPU Load', value: 35, color: 'bg-cyan-400', icon: <Cpu className="h-5 w-5" /> },
  { name: 'Memory Usage', value: 62, color: 'bg-cyan-400', icon: <MemoryStick className="h-5 w-5" /> },
  { name: 'Active Agents', value: 5, color: 'bg-amber-400', icon: <Users className="h-5 w-5" /> },
  { name: 'Disk Usage', value: 45, valueText: '450GB / 1TB', color: 'bg-cyan-400', icon: <HardDrive className="h-5 w-5" /> },
  { name: 'Network Sent', valueText: '1.2 GB', icon: <Network className="h-5 w-5" /> },
  { name: 'Network Received', valueText: '8.5 GB', icon: <Network className="h-5 w-5" /> },
  { name: 'System Uptime', valueText: '12d 4h 32m', icon: <Clock className="h-5 w-5" /> },
];

const agentPresenceData = [
    { name: 'OrionCore_7B', description: 'Optimizing dynamic resource allocation...', status: 'Processing', time: 'Now', statusColor: 'text-cyan-400' },
    { name: 'NexusGuard_Alpha', description: 'Actively monitoring inbound/outbound netwo...', status: 'Idle', time: '2m ago', statusColor: 'text-green-400' },
    { name: 'Helios_Stream_Processor', description: 'Continuously analyzing high-volume sen...', status: 'Processing', time: 'Now', statusColor: 'text-cyan-400' },
    { name: 'NovaSys_QueryEngine', description: 'Awaiting complex user queries and data retri...', status: 'Idle', time: '10s ago', statusColor: 'text-green-400' },
    { name: 'Cygnus_BackupAgent', description: 'Scheduled integrity check failed on target...', status: 'Error', time: '5m ago', statusColor: 'text-red-400' },
];

const orchestrationFeedData = [
    { name: 'Agent Task: Analyze User Sentiment', time: '0 seconds ago', status: 'failure' },
    { name: 'Agent Task: Deploy Microservice v1.2', time: '3 minutes ago', status: 'success' },
    { name: 'Agent Task: Backup Database Cluster', time: '15 minutes ago', status: 'success' },
];

const statusBadgeVariant : Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  success: 'default',
  failure: 'destructive',
}

const statusBadgeText: Record<string, string> = {
    success: "Success",
    failure: "Failure",
}

export default function DashboardPage() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-background/60 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-8 w-8 text-white" />
          <h1 className="font-headline text-xl font-semibold text-white hidden md:block">
            AEVON OS
          </h1>
          <Separator orientation="vertical" className="h-6 bg-white/10 hidden md:block" />
          <Button variant="ghost" className="gap-2 text-white hover:bg-white/10 hover:text-white">
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Home Dashboard</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 px-4 lg:px-12">
            <Button variant="outline" className="w-full max-w-lg mx-auto justify-between bg-black/20 border-white/20 text-muted-foreground hover:bg-black/30 hover:text-muted-foreground pr-2">
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Command or Search (Ctrl+K)...</span>
                </div>
                <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-muted-foreground/50" />
                    <Separator orientation='vertical' className='h-5 bg-white/20' />
                    <span className="text-xs">⌘K</span>
                </div>
            </Button>
        </div>


        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <div className="flex items-center gap-2 text-sm text-white">
            <Clock className="h-5 w-5" />
            <span>{formatTime(time)} UTC</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <UserCircle className="h-8 w-8 text-white" />
            <div className="text-xs">
              <p className="font-semibold text-white">Admin User</p>
              <p className="text-green-400">Session: Active</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 auto-rows-min gap-6">
        <Card className="col-span-12 lg:col-span-5 row-span-2 flex flex-col bg-primary/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-accent" /> AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
              <Image src="https://placehold.co/200x200.png" alt="AI Orb" data-ai-hint="abstract orb" width={192} height={192} className="relative rounded-full" />
            </div>
            <p className="text-lg text-muted-foreground max-w-xs">
              Analyze product sales, compare revenue, or ask for insights.
            </p>
          </CardContent>
          <div className="p-4 mt-auto">
            <Textarea placeholder="Ask the AI assistant..." className="bg-black/20 border-white/10 mb-2 focus:border-accent" />
            <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">Send Prompt</Button>
          </div>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bg-primary/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="h-5 w-5 text-accent" /> System Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemSnapshotData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {item.icon}
                    {item.name}
                  </span>
                  <span className={cn('font-semibold', item.color && 'text-white')}>{item.valueText || `${item.value}%`}</span>
                </div>
                {item.value && <Progress value={item.value} className={cn('h-2', item.color)} />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-3 row-span-2 bg-primary/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-accent" /> Agent Presence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentPresenceData.map((agent, index) => (
              <div key={index} className="p-3 rounded-lg bg-black/20">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm text-white">{agent.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className={cn('w-2 h-2 rounded-full', agent.statusColor.replace('text-', 'bg-'))}></div>
                    <span className={agent.statusColor}>{agent.status}</span>
                    <span className="text-muted-foreground">({agent.time})</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-5 bg-primary/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AppWindow className="h-5 w-5 text-accent" /> Micro-Apps
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 bg-black/20 border-accent/30 text-accent hover:bg-accent/10">
              <Rocket className="h-6 w-6" /> Launch
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 bg-black/20 border-accent/30 text-accent hover:bg-accent/10">
              <Rocket className="h-6 w-6" /> Launch
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 bg-black/20 border-accent/30 text-accent hover:bg-accent/10">
              <Rocket className="h-6 w-6" /> Launch
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-7 bg-primary/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-5 w-5 text-accent" /> Live Orchestration Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orchestrationFeedData.map((item, index) => (
               <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                <div className="flex items-center gap-3">
                    {item.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    <div>
                        <p className="text-sm text-white">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                </div>
                <Badge variant={statusBadgeVariant[item.status]}>{statusBadgeText[item.status]}</Badge>
               </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
