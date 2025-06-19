
// src/components/panels/agent-hub-panel.tsx
'use client';

import { useState, useEffect } from 'react';
import { BasePanel } from './base-panel';
import { Bot, ShieldCheck, ListChecks, UserPlus, PlayCircle, PauseCircle, Globe, MessageSquare, Edit3, Save, XCircle, Play, Pause } from 'lucide-react';
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

// Removed initialAgents. Agent list will be populated from a real backend or remain empty.
const initialAgents: Agent[] = [];

const agentProfiles = [
  { namePrefix: "Web Intellect Agent", permissions: "Web Search, Summarization, Fact Checking", baseWorkload: "10%" },
  { namePrefix: "Task Orchestrator Agent", permissions: "Code Execution, API Calls, File Management", baseWorkload: "5%" },
  { namePrefix: "Content Synthesizer Agent", permissions: "Text Generation, Image Generation, Translation", baseWorkload: "15%" },
  { namePrefix: "Data Cruncher Agent", permissions: "Data Analysis, Report Generation, Trend Identification", baseWorkload: "8%" },
  { namePrefix: "Support Responder Agent", permissions: "FAQ Lookup, Ticket Creation, Basic Chat", baseWorkload: "12%" },
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
  isResizable?: boolean;
  initialSize?: {width?: string; height?: string};
}

export function AgentHubPanel({
  className,
  onClose,
  isMobile,
  addConsoleMessage,
  addTimelineEvent,
  isResizable,
  initialSize
}: AgentHubPanelProps) {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editableAgentName, setEditableAgentName] = useState('');
  const [editableAgentPermissions, setEditableAgentPermissions] = useState('');
  const [spawnProfileIndex, setSpawnProfileIndex] = useState(0);

  useEffect(() => {
    // Fetch real agents from backend here if applicable
    // For now, it remains empty as per "no mock data"
  }, []);

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
    // Removed local state update: setAgents, setSelectedAgent
    toast({ title: "Agent Update Requested", description: `Request to update agent "${editableAgentName}" sent to backend. (Backend interaction not yet fully implemented).` });
    addConsoleMessage('info', `User requested update for agent "${editableAgentName}" (ID: ${selectedAgent.id}). Backend call pending implementation.`);
    setSelectedAgent(null); // Clear selection as local state isn't authoritative
  };

  const handleCancelEdit = () => {
    setSelectedAgent(null);
    addConsoleMessage('log', `Agent configuration cancelled.`);
  };


  const handleSpawnAgent = () => {
    const profile = agentProfiles[spawnProfileIndex];
    const newAgentName = `${profile.namePrefix} #${Date.now().toString().slice(-4)}`; // Example name
    // Removed local state update: setAgents
    setSpawnProfileIndex((prevIndex) => (prevIndex + 1) % agentProfiles.length);

    toast({ title: "Agent Provisioning Requested", description: `Request to provision agent "${newAgentName}" with capabilities "${profile.permissions}" sent to backend. (Backend interaction not yet fully implemented).` });
    addConsoleMessage('info', `User requested provisioning of new agent: "${newAgentName}" (type: ${profile.namePrefix}). Backend call pending implementation.`);
    addTimelineEvent({ type: 'info', message: `Agent provisioning requested for "${newAgentName}".` });
  };

  const handleResumeAll = () => {
    // Removed local state update: setAgents
    toast({ title: "Agent Hub Action", description: "Request to resume all eligible agents sent to backend. (Backend interaction not yet fully implemented)." });
    addConsoleMessage('info', 'Agent Hub: Request to resume all agents triggered. Backend call pending implementation.');
    addTimelineEvent({ type: 'info', message: 'Resume all agents action requested.' });
  };

  const handlePauseAll = () => {
    // Removed local state update: setAgents
    toast({ title: "Agent Hub Action", description: "Request to pause all active agents (Safe Mode) sent to backend. (Backend interaction not yet fully implemented).", variant: "secondary" });
    addConsoleMessage('warn', 'Agent Hub: Request to pause all agents triggered. Backend call pending implementation.');
    addTimelineEvent({ type: 'info', message: 'Pause all agents action requested.' });
  };

  const handleToggleAgentStatus = (agentId: string) => {
    const agentToToggle = agents.find(a => a.id === agentId);
    if (!agentToToggle) return;
    const agentName = agentToToggle.name;
    const currentStatus = agentToToggle.status;
    const action = (currentStatus === 'active' || currentStatus === 'running') ? 'pause' : 'resume';

    // Removed local state update: setAgents
    toast({ title: `Agent Status Change Requested`, description: `Request to ${action} agent "${agentName}" sent to backend. (Backend interaction not yet fully implemented).` });
    addConsoleMessage('info', `User requested to ${action} agent "${agentName}" (ID: ${agentId}). From status: ${currentStatus}. Backend call pending implementation.`);
    addTimelineEvent({ type: 'info', message: `Request to ${action} agent "${agentName}".` });
  };


  return (
    <BasePanel
      title="Agent Hub (Managed)"
      icon={<Bot className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      isResizable={isResizable}
      initialSize={initialSize}
      contentClassName="space-y-3 flex flex-col"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Connected Agents ({agents.length})</h3>
          <Button variant="outline" size="sm" className="text-xs" onClick={handleSpawnAgent}>
            <UserPlus className="h-3 w-3 mr-1.5" />
            Provision New Agent
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs flex-1" onClick={handleResumeAll}>
            <PlayCircle className="h-3 w-3 mr-1.5" />
            Resume All Agents
          </Button>
          <Button variant="secondary" size="sm" className="text-xs flex-1" onClick={handlePauseAll}>
            <PauseCircle className="h-3 w-3 mr-1.5" />
            Pause All Agents
          </Button>
        </div>
        <ScrollArea className="pr-2"> 
          {agents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No agents currently provisioned or backend connection pending. Click "Provision New Agent" to request one.</p>
          ) : (
            <ul className="space-y-2">
              {agents.map((agent) => (
                <li
                  key={agent.id}
                  className={cn(
                    "p-2.5 rounded-md bg-card/60 border border-border/40 hover:border-primary/50 transition-colors group",
                    selectedAgent?.id === agent.id && "border-primary ring-1 ring-primary bg-primary/5 shadow-md"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-sm font-medium text-foreground/90 group-hover:text-primary cursor-pointer"
                      onClick={() => handleSelectAgent(agent)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectAgent(agent)}
                    >
                      {agent.name}
                    </span>
                    <div className="flex items-center gap-2">
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={() => handleToggleAgentStatus(agent.id)}
                          title={agent.status === 'active' ? "Request Pause Agent" : "Request Resume Agent"}
                        >
                          {agent.status === 'active' ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                       </Button>
                       <Badge className={`text-[0.65rem] px-1.5 py-0.5 ${statusColors[agent.status] || 'bg-muted border-muted-foreground/30'}`}>{formatStatusText(agent.status)}</Badge>
                    </div>
                  </div>
                  <div
                    className="text-xs text-muted-foreground space-y-0.5 cursor-pointer"
                    onClick={() => handleSelectAgent(agent)}
                    role="button"
                    tabIndex={-1} 
                  >
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
              <Label htmlFor="agentPermissionsEdit" className="text-xs">Agent Capabilities (Backend Config)</Label>
              <Input
                id="agentPermissionsEdit"
                value={editableAgentPermissions}
                onChange={(e) => setEditableAgentPermissions(e.target.value)}
                className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                placeholder="e.g., Web Search, File IO, Code Execution"
              />
              <p className="text-xs text-muted-foreground">Requests update to backend agent configuration.</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button onClick={handleUpdateAgent} size="sm" className="flex-1">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Request Save
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
          <Globe className="h-4 w-4 text-primary/80" /> Web Agent Utilities
        </h3>
        <WebpageSummarizerForm
          addConsoleMessage={addConsoleMessage}
          addTimelineEvent={addTimelineEvent}
        />
      </div>

      <Separator className="my-3" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-primary/80" /> LLM Utilities
        </h3>
        <PromptExecutorForm
          addConsoleMessage={addConsoleMessage}
          addTimelineEvent={addTimelineEvent}
        />
      </div>
    </BasePanel>
  );
}
    

    

