
// src/components/panels/agent-hub-panel.tsx
'use client';

import { useState } from 'react';
import { BasePanel } from './base-panel';
import { Bot, ShieldCheck, ListChecks, UserPlus, PlayCircle, PauseCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { WebpageSummarizerForm } from '@/components/ai/webpage-summarizer-form';
import type { ConsoleMessage } from '@/components/panels/console-panel';
import type { TimelineEvent } from '@/components/panels/timeline-panel';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'paused'; // These statuses would come from SuperAGI
  tasks: number; // Number of active tasks/goals
  permissions: string; // Could represent capabilities
  workload: string; // Could represent resource usage or queue length
}

// Placeholder agents; in a real app, this would be fetched from SuperAGI
const initialAgents: Agent[] = [
  { id: 'superagi-agent-1', name: "Web Research Agent", status: "active", tasks: 3, permissions: "Web Search, Summarization", workload: "60%" },
  { id: 'superagi-agent-2', name: "Task Execution Agent", status: "idle", tasks: 0, permissions: "Code Execution, API Calls", workload: "5%" },
  { id: 'superagi-agent-3', name: "Content Creation Agent", status: "paused", tasks: 1, permissions: "Text Generation, Image Generation", workload: "N/A" },
];

const statusColors: Record<Agent['status'], string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/50",
  idle: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  error: "bg-destructive/20 text-destructive border-destructive/50",
  paused: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
};

const formatStatusText = (status: string) => {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

interface AgentHubPanelProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
  addConsoleMessage: (type: ConsoleMessage['type'], text: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
}

export function AgentHubPanel({ className, onClose, isMobile, addConsoleMessage, addTimelineEvent }: AgentHubPanelProps) {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  const handleSpawnAgent = () => {
    // This would eventually be an API call to SuperAGI to provision/create a new agent
    const newAgentId = `superagi-agent-${Date.now()}`;
    const newAgentName = `New SuperAGI Agent ${agents.length + 1}`;
    const newAgent: Agent = {
      id: newAgentId,
      name: newAgentName,
      status: 'idle',
      tasks: 0,
      permissions: 'Basic',
      workload: '0%',
    };
    setAgents(prev => [...prev, newAgent]);
    toast({ title: "Agent Spawned (Simulated)", description: `Agent "${newAgentName}" is now available (simulation).` });
    addConsoleMessage('info', `Agent "${newAgentName}" spawned (simulation for SuperAGI).`);
  };

  const handleResumeAll = () => {
    // This would be an API call to SuperAGI to resume agents
    setAgents(prev => 
      prev.map(agent => 
        agent.status === 'paused' || agent.status === 'idle' ? { ...agent, status: 'active' } : agent
      )
    );
    toast({ title: "Agent Hub Action (Simulated)", description: "Attempting to resume all eligible agents (simulation for SuperAGI)." });
    addConsoleMessage('info', 'Agent Hub: Resume all action triggered (simulation for SuperAGI).');
  };

  const handlePauseAll = () => {
    // This would be an API call to SuperAGI to pause agents
    setAgents(prev =>
      prev.map(agent => 
        agent.status === 'active' ? { ...agent, status: 'paused' } : agent
      )
    );
    toast({ title: "Agent Hub Action (Simulated)", description: "Activating Safe Mode: Pausing all active agents (simulation for SuperAGI).", variant: "secondary" });
    addConsoleMessage('warn', 'Agent Hub: Pause all action triggered (simulation for SuperAGI).');
  };

  return (
    <BasePanel
      title="Agent Hub (SuperAGI)"
      icon={<Bot className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      initialSize={{ width: '380px', height: 'auto' }} 
      contentClassName="space-y-3 flex flex-col"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Connected SuperAGI Agents ({agents.length})</h3>
          <Button variant="outline" size="sm" className="text-xs" onClick={handleSpawnAgent}>
            <UserPlus className="h-3 w-3 mr-1.5" />
            Spawn Agent (Sim)
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs flex-1" onClick={handleResumeAll}>
              <PlayCircle className="h-3 w-3 mr-1.5" />
              Resume All (Sim)
          </Button>
          <Button variant="secondary" size="sm" className="text-xs flex-1" onClick={handlePauseAll}>
              <PauseCircle className="h-3 w-3 mr-1.5" />
              Pause All (Sim)
          </Button>
        </div>
        <ScrollArea className="pr-2 max-h-60"> {/* Added max-h for better layout control */}
          {agents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No SuperAGI agents connected. Spawn one to get started.</p>
          ) : (
          <ul className="space-y-2">
            {agents.map((agent) => (
              <li key={agent.id} className="p-2.5 rounded-md bg-card/60 border border-border/40 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground/90">{agent.name}</span>
                  <Badge className={`text-[0.65rem] px-1.5 py-0.5 ${statusColors[agent.status] || 'bg-muted border-muted-foreground/30'}`}>{formatStatusText(agent.status)}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1"><ListChecks className="h-3 w-3 text-primary/70" /> Active Tasks: {agent.tasks} | Workload: {agent.workload}</p>
                  <p className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary/70" /> Capabilities: {agent.permissions}</p>
                </div>
              </li>
            ))}
          </ul>
          )}
        </ScrollArea>
      </div>
      
      <Separator className="my-3" />

      <div className="space-y-2">
         <h3 className="text-sm font-medium flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-primary/80" /> Web Agent Utilities (Simulated)
          </h3>
        <WebpageSummarizerForm 
          addConsoleMessage={addConsoleMessage} 
          addTimelineEvent={addTimelineEvent} 
        />
      </div>
    </BasePanel>
  );
}

