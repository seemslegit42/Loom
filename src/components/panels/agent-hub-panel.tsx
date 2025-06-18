
// src/components/panels/agent-hub-panel.tsx
'use client';

import { useState, useEffect } from 'react';
import { BasePanel } from './base-panel';
import { Bot, ShieldCheck, ListChecks, UserPlus, PlayCircle, PauseCircle, Globe, MessageSquare, Edit3, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { WebpageSummarizerForm } from '@/components/ai/webpage-summarizer-form';
import { PromptExecutorForm } from '@/components/ai/prompt-executor-form';
import type { ConsoleMessage } from '@/components/panels/console-panel';
import type { TimelineEvent } from '@/components/panels/timeline-panel';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'paused';
  tasks: number;
  permissions: string;
  workload: string;
}

const initialAgents: Agent[] = [
  { id: 'superagi-agent-1', name: "Web Research Agent", status: "active", tasks: 3, permissions: "Web Search, Summarization", workload: "60%" },
  { id: 'superagi-agent-2', name: "Task Execution Agent", status: "idle", tasks: 0, permissions: "Code Execution, API Calls", workload: "5%" },
  { id: 'superagi-agent-3', name: "Content Creation Agent", status: "paused", tasks: 1, permissions: "Text Generation, Image Generation", workload: "N/A" },
];

const agentProfiles = [
  { namePrefix: "Web Intellect", permissions: "Web Search, Summarization, Fact Checking", baseWorkload: "10%" },
  { namePrefix: "Task Orchestrator", permissions: "Code Execution, API Calls, File Management", baseWorkload: "5%" },
  { namePrefix: "Content Synthesizer", permissions: "Text Generation, Image Generation, Translation", baseWorkload: "15%" },
  { namePrefix: "Data Cruncher", permissions: "Data Analysis, Report Generation, Trend Identification", baseWorkload: "8%" },
  { namePrefix: "Support Responder", permissions: "FAQ Lookup, Ticket Creation, Basic Chat", baseWorkload: "12%" },
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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editableAgentName, setEditableAgentName] = useState('');
  const [editableAgentPermissions, setEditableAgentPermissions] = useState('');
  const [spawnProfileIndex, setSpawnProfileIndex] = useState(0);

  useEffect(() => {
    if (selectedAgent) {
      setEditableAgentName(selectedAgent.name);
      setEditableAgentPermissions(selectedAgent.permissions);
    } else {
      setEditableAgentName('');
      setEditableAgentPermissions('');
    }
  }, [selectedAgent]);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    addConsoleMessage('log', `Agent "${agent.name}" selected for configuration.`);
  };

  const handleUpdateAgent = () => {
    if (!selectedAgent) return;

    const updatedAgents = agents.map(agent =>
      agent.id === selectedAgent.id
        ? { ...agent, name: editableAgentName, permissions: editableAgentPermissions }
        : agent
    );
    setAgents(updatedAgents);
    const updatedSelectedAgent = updatedAgents.find(a => a.id === selectedAgent.id) || null;
    setSelectedAgent(updatedSelectedAgent); 

    toast({ title: "Agent Updated (Simulated)", description: `Agent "${editableAgentName}" details saved.` });
    addConsoleMessage('info', `Agent "${editableAgentName}" (ID: ${selectedAgent.id}) configuration updated (simulated).`);
  };

  const handleCancelEdit = () => {
    setSelectedAgent(null);
    addConsoleMessage('log', `Agent configuration cancelled.`);
  };


  const handleSpawnAgent = () => {
    const profile = agentProfiles[spawnProfileIndex];
    const newAgentId = `superagi-agent-${Date.now()}`;
    // Count existing agents with the same prefix to create a unique number
    const agentCountForPrefix = agents.filter(a => a.name.startsWith(profile.namePrefix)).length + 1;
    const newAgentName = `${profile.namePrefix} #${agentCountForPrefix}`;

    const newAgent: Agent = {
      id: newAgentId,
      name: newAgentName,
      status: 'idle',
      tasks: 0,
      permissions: profile.permissions,
      workload: profile.baseWorkload,
    };
    setAgents(prev => [...prev, newAgent]);
    setSpawnProfileIndex((prevIndex) => (prevIndex + 1) % agentProfiles.length);

    toast({ title: "Agent Spawned (Simulated)", description: `Agent "${newAgentName}" with capabilities "${profile.permissions}" is now available (simulation).` });
    addConsoleMessage('info', `Agent "${newAgentName}" (type: ${profile.namePrefix}) spawned (simulation for SuperAGI).`);
  };

  const handleResumeAll = () => {
    setAgents(prev =>
      prev.map(agent =>
        agent.status === 'paused' || agent.status === 'idle' ? { ...agent, status: 'active' } : agent
      )
    );
    toast({ title: "Agent Hub Action (Simulated)", description: "Attempting to resume all eligible agents (simulation for SuperAGI)." });
    addConsoleMessage('info', 'Agent Hub: Resume all action triggered (simulation for SuperAGI).');
  };

  const handlePauseAll = () => {
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
            Spawn Next Agent (Sim)
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
        <ScrollArea className="pr-2 max-h-40">
          {agents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No SuperAGI agents connected. Spawn one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {agents.map((agent) => (
                <li
                  key={agent.id}
                  className={cn(
                    "p-2.5 rounded-md bg-card/60 border border-border/40 hover:border-primary/50 transition-colors cursor-pointer group",
                    selectedAgent?.id === agent.id && "border-primary ring-1 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleSelectAgent(agent)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground/90 group-hover:text-primary">{agent.name}</span>
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

      {selectedAgent && (
        <>
          <Separator className="my-2" />
          <div className="space-y-3 p-2.5 border border-dashed border-border/50 rounded-md bg-card/40">
            <h4 className="text-sm font-medium flex items-center gap-1.5 text-primary">
              <Edit3 className="h-4 w-4" /> Configure Agent: {selectedAgent.name}
            </h4>
            <div className="space-y-1">
              <Label htmlFor="agentNameEdit" className="text-xs">Agent Name</Label>
              <Input
                id="agentNameEdit"
                value={editableAgentName}
                onChange={(e) => setEditableAgentName(e.target.value)}
                className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agentPermissionsEdit" className="text-xs">Agent Capabilities (Simulated)</Label>
              <Input
                id="agentPermissionsEdit"
                value={editableAgentPermissions}
                onChange={(e) => setEditableAgentPermissions(e.target.value)}
                className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                placeholder="e.g., Web Search, File IO, Code Execution"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button onClick={handleUpdateAgent} size="sm" className="flex-1">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes (Sim)
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" size="sm" className="flex-1">
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel
              </Button>
            </div>
          </div>
        </>
      )}

      <Separator className="my-3" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-primary/80" /> Web Agent Utilities (Simulated)
        </h3>
        <WebpageSummarizerForm
          addConsoleMessage={addConsoleMessage}
          addTimelineEvent={addTimelineEvent}
        />
      </div>

      <Separator className="my-3" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-primary/80" /> LLM Utilities (Simulated)
        </h3>
        <PromptExecutorForm
          addConsoleMessage={addConsoleMessage}
          addTimelineEvent={addTimelineEvent}
        />
      </div>
    </BasePanel>
  );
}

