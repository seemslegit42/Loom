
// src/components/panels/agent-hub-panel.tsx
'use client';

import { BasePanel } from './base-panel';
import { Bot, ShieldCheck, ListChecks, UserPlus, PlayCircle, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface AgentHubPanelProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
}

const agents = [
  { name: "DataScribe Alpha", status: "active", tasks: 5, permissions: "Read/Write", workload: "75%" },
  { name: "InsightGen Beta", status: "idle", tasks: 0, permissions: "Read-Only", workload: "10%" },
  { name: "AutoResponder Gamma", status: "error", tasks: 2, permissions: "Write", workload: "N/A" },
  { name: "WorkflowOrchestrator", status: "active", tasks: 12, permissions: "Admin", workload: "30%" },
];

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/50",
  idle: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  error: "bg-destructive/20 text-destructive border-destructive/50",
};

export function AgentHubPanel({ className, onClose, isMobile }: AgentHubPanelProps) {
  const { toast } = useToast();

  const handleSpawnAgent = () => {
    toast({ title: "Action", description: "Spawn New Agent clicked." });
  };

  const handleResumeAll = () => {
    toast({ title: "Action", description: "Resume All clicked." });
  };

  const handlePauseAll = () => {
    toast({ title: "Action", description: "Pause All (Safe Mode) clicked.", variant: "destructive" });
  };

  return (
    <BasePanel
      title="Agent Hub"
      icon={<Bot className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      initialSize={{ width: '380px', height: 'auto' }}
      contentClassName="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Connected Agents</h3>
        <Button variant="outline" size="sm" className="text-xs" onClick={handleSpawnAgent}>
          <UserPlus className="h-3 w-3 mr-1.5" />
          Spawn New Agent
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="text-xs flex-1" onClick={handleResumeAll}>
            <PlayCircle className="h-3 w-3 mr-1.5" />
            Resume All
        </Button>
        <Button variant="destructive" size="sm" className="text-xs flex-1" onClick={handlePauseAll}>
            <PauseCircle className="h-3 w-3 mr-1.5" />
            Pause All (Safe Mode)
        </Button>
      </div>
      <ScrollArea className="h-[200px] pr-2">
        <ul className="space-y-2">
          {agents.map((agent) => (
            <li key={agent.name} className="p-2.5 rounded-md bg-card/60 border border-border/40 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground/90">{agent.name}</span>
                <Badge className={`text-[0.65rem] px-1.5 py-0.5 ${statusColors[agent.status] || 'bg-muted'}`}>{agent.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="flex items-center gap-1"><ListChecks className="h-3 w-3 text-primary/70" /> Tasks: {agent.tasks} | Workload: {agent.workload}</p>
                <p className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary/70" /> Permissions: {agent.permissions}</p>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </BasePanel>
  );
}
