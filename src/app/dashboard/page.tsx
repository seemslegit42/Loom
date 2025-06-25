
// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  GitBranch,
  XCircle,
  CheckCircle,
  Settings,
  Bot,
  MoreHorizontal,
  Minus,
  Maximize,
  AppWindow,
  Zap,
  TowerControl,
} from 'lucide-react';
import { cn } from '@/lib/utils';


const systemSnapshotData = [
  { name: 'CPU Load', value: 35, color: 'bg-green-400', icon: <Cpu className="h-5 w-5 text-muted-foreground" /> },
  { name: 'Memory Usage', value: 62, color: 'bg-green-400', icon: <MemoryStick className="h-5 w-5 text-muted-foreground" /> },
  { name: 'Active Agents', value: 5, color: 'text-amber-400', icon: <Users className="h-5 w-5 text-muted-foreground" /> },
];

const agentPresenceData = [
    { name: 'OrionCore_7B', description: 'Optimizing dynamic resource allocation across Kubernetes clusters u...', status: 'Processing', time: 'Now', statusColor: 'text-cyan-400' },
    { name: 'NexusGuard_Alpha', description: 'Actively monitoring inbound/outbound network patterns for anomalies ba...', status: 'Idle', time: '2m ago', statusColor: 'text-green-400' },
    { name: 'Helios_Stream_Processor', description: 'Continuously analyzing high-volume sentiment data streams for eme...', status: 'Processing', time: 'Now', statusColor: 'text-cyan-400' },
    { name: 'NovaSys_QueryEngine', description: 'Awaiting complex user queries and data retrieval tasks from the primary...', status: 'Idle', time: '10s ago', statusColor: 'text-green-400' },
    { name: 'Cygnus_BackupAgent', description: 'Scheduled integrity check failed on target DB. Initiating rollback.', status: 'Error', time: '5m ago', statusColor: 'text-red-400' },
];

const orchestrationFeedData = [
    { name: 'Agent Task: Analyze User Sentiment', time: '0 seconds ago', status: 'failure', details: 'Failure Details' },
    { name: 'Agent Task: Deploy Microservice v1.2', time: '3 minutes ago', status: 'success', details: 'Success Details' },
    { name: 'Agent Task: Backup Database Cluster', time: '15 minutes ago', status: 'success', details: 'Success Details' },
];

const statusBadgeVariant : Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  success: 'secondary',
  failure: 'destructive',
}

const statusBadgeText: Record<string, string> = {
    success: "SUCCESS",
    failure: "FAILURE",
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
      hour12: true,
    });
  };

  const CardActions = () => (
    <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/70 hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/70 hover:text-foreground">
            <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/70 hover:text-foreground">
            <Maximize className="h-4 w-4" />
        </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-background/60 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-8 w-8 text-white" />
          <h1 className="font-headline text-xl font-semibold text-white hidden md:block">
            AEVOS
          </h1>
          <Separator orientation="vertical" className="h-6 bg-white/10 hidden md:block" />
          <Button variant="ghost" className="gap-2 text-white bg-white/5 hover:bg-white/10 hover:text-white rounded-md">
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
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </Button>
        </div>


        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Zap className="h-5 w-5" />
          </Button>
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
              <p className="text-muted-foreground">Session: 28m</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex gap-6">
        {/* Left Column */}
        <div className="w-4/12 flex flex-col gap-6">
            <Card className="bg-primary/5 border-white/10">
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                    <LayoutGrid className="h-5 w-5 text-accent" /> System Snapshot
                    </CardTitle>
                    <CardActions />
                </CardHeader>
                <CardContent className="space-y-4">
                    {systemSnapshotData.map((item, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-center text-sm mb-1">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            {item.icon}
                            {item.name}
                        </span>
                        <span className={cn('font-semibold', item.color && (item.name === 'Active Agents' ? item.color : 'text-white'))}>{item.value}{item.name !== 'Active Agents' && '%'}</span>
                        </div>
                        {item.name !== 'Active Agents' && <Progress value={item.value} className={cn('h-2 bg-black/30', item.color)} />}
                    </div>
                    ))}
                </CardContent>
            </Card>
            
            <Card className="bg-primary/5 border-white/10">
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                    <Bot className="h-5 w-5 text-accent" /> Agent Presence
                    </CardTitle>
                    <CardActions />
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

            <Card className="bg-primary/5 border-white/10">
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                        <AppWindow className="h-5 w-5 text-accent" /> Micro-Apps
                    </CardTitle>
                    <CardActions />
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-black/20 rounded-lg border border-dashed border-white/10"></div>
                    <div className="h-24 bg-black/20 rounded-lg border border-dashed border-white/10"></div>
                    <div className="h-24 bg-black/20 rounded-lg border border-dashed border-white/10"></div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="w-8/12 flex flex-col gap-6">
            <Card className="bg-primary/5 border-white/10 flex-grow">
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                        <TowerControl className="h-5 w-5 text-accent" /> Live Orchestration Feed
                    </CardTitle>
                    <CardActions />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Accordion type="single" collapsible className="w-full space-y-3">
                        {orchestrationFeedData.map((item, index) => (
                            <AccordionItem 
                                value={`item-${index}`} 
                                key={index} 
                                className={cn(
                                    "bg-black/20 rounded-lg px-4 border-l-4",
                                    item.status === 'success' ? 'border-green-500' : 'border-red-500'
                                )}
                            >
                                <AccordionTrigger className="py-3 text-left hover:no-underline">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            {item.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                            <div>
                                                <p className="text-sm text-white font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.time}</p>
                                            </div>
                                        </div>
                                        <Badge variant={statusBadgeVariant[item.status]} className="font-bold">{statusBadgeText[item.status]}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3 text-xs pl-8 text-muted-foreground">
                                   <p>{item.details}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card className="bg-primary/5 border-white/10">
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                        <LayoutGrid className="h-5 w-5 text-accent" /> Application View
                    </CardTitle>
                    <CardActions />
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-white">No micro-app launched.</h3>
                    <p className="text-sm text-muted-foreground">Select an app from the 'Micro-Apps' launcher.</p>
                </CardContent>
            </Card>
        </div>
      </main>
      <footer className="fixed bottom-4 right-4 text-xs">
        <div className='bg-black/30 text-muted-foreground px-3 py-1 rounded-md backdrop-blur-sm'>
            <span className='font-bold text-white'>AEVOS</span> v1.0 | SILENT AUTOMATION
        </div>
      </footer>
    </div>
  );
}
