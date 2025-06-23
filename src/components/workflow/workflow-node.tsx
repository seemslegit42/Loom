
// src/components/workflow/workflow-node.tsx
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, AlertTriangle, Clock, HelpCircle, MessageSquare, GitMerge, Zap, Timer, Webhook, SlidersHorizontal, Cog, Globe, FunctionSquare, Binary } from 'lucide-react'; 
import { cn } from '@/lib/utils';
// Use Backend types for output as Genkit is removed
import type { BackendSummarizeOutput, BackendExecutePromptOutput } from '@/app/page';
import type { ConnectingState } from '@/app/page'; 


export type NodeStatus = 'queued' | 'running' | 'failed' | 'completed' | 'unknown' | 'pending';
// Node types can remain somewhat abstract, as SuperAGI will handle the specifics
export type NodeType = 'prompt' | 'decision' | 'agent-call' | 'wait' | 'api-call' | 'trigger' | 'custom' | 'web-summarizer' | 'data-transform' | 'conditional'; 

export interface WorkflowNodeData {
  id: string;
  title: string;
  type: NodeType;
  description: string;
  status?: NodeStatus;
  agentName?: string; // Could map to a SuperAGI agent ID or name
  position?: { x: number; y: number };
  config?: {
    // Common config fields
    url?: string; // For web-summarizer
    promptText?: string; // For prompt node
    modelName?: string; // Could be agent_id or model preference for SuperAGI
    transformationLogic?: string; // For data-transform
    condition?: string; // For conditional node
    
    // Output from backend (simulated or real)
    output?: BackendSummarizeOutput | BackendExecutePromptOutput | Record<string, any>; 
    
    // Other potential SuperAGI specific configs can be added here
    // e.g., agent_id, goal, specific_tool_params
    [key: string]: any; // Allow other dynamic config properties
  };
}

interface WorkflowNodeProps {
  node: WorkflowNodeData;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>, node: WorkflowNodeData) => void;
  isSelected?: boolean;
  onInputPortClick?: (nodeId: string, e: React.MouseEvent<HTMLDivElement>) => void;
  onOutputPortClick?: (nodeId: string, portElement: HTMLDivElement) => void; 
  isConnectingFrom?: boolean;
  connectingState: ConnectingState | null; 
}

const statusIcons: Record<NodeStatus, React.ReactNode> = {
  queued: <Clock className="h-4 w-4 text-blue-400" />,
  running: <Bot className="h-4 w-4 text-primary animate-pulse" />,
  failed: <AlertTriangle className="h-4 w-4 text-destructive" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
  pending: <HelpCircle className="h-4 w-4 text-muted-foreground/70" />,
};

const typeIcons: Record<NodeType, React.ReactNode> = {
  prompt: <MessageSquare className="h-4 w-4 text-purple-400" />,
  decision: <GitMerge className="h-4 w-4 text-orange-400" />,
  'agent-call': <Zap className="h-4 w-4 text-yellow-400" />, 
  wait: <Timer className="h-4 w-4 text-cyan-400" />,
  'api-call': <Webhook className="h-4 w-4 text-indigo-400" />, 
  trigger: <Cog className="h-4 w-4 text-pink-400" />, 
  custom: <SlidersHorizontal className="h-4 w-4 text-teal-400" />, 
  'web-summarizer': <Globe className="h-4 w-4 text-sky-400" />, 
  'data-transform': <FunctionSquare className="h-4 w-4 text-lime-400" />,
  conditional: <Binary className="h-4 w-4 text-orange-500" />, 
};

const badgeStyles: Record<NodeStatus, string> = {
    queued: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    running: "bg-primary/20 text-primary border-primary/50",
    failed: "bg-destructive/20 text-destructive border-destructive/50",
    completed: "bg-green-500/20 text-green-400 border-green-500/50",
    unknown: "bg-muted/20 text-muted-foreground border-muted/50",
    pending: "bg-muted/20 text-muted-foreground/70 border-muted/50",
};

const cardDynamicStyles: Record<NodeStatus, string> = {
  queued: 'border-blue-500/60',
  running: 'border-primary/60 animate-pulse',
  failed: 'border-destructive/70',
  completed: 'border-green-500/60',
  unknown: 'border-border',
  pending: 'border-border/70',
};

const formatDisplayValue = (value: string = '') => {
  if (!value) return '';
  return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const WorkflowNode = React.forwardRef<HTMLDivElement, WorkflowNodeProps>(
  ({ node, className, onClick, isSelected, onInputPortClick, onOutputPortClick, isConnectingFrom, connectingState }, ref) => {
    const { id, title, type, status = 'unknown', description, agentName, position } = node;
    const currentTypeIcon = typeIcons[type] || typeIcons.custom;
    const currentStatusIcon = statusIcons[status] || statusIcons.unknown;

    const outputPortRef = useRef<HTMLDivElement>(null);
    const inputPortRef = useRef<HTMLDivElement>(null);

    const handleNodeClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('.node-port')) {
        return;
      }
      if (onClick) {
        e.stopPropagation(); 
        onClick(e, node);
      }
    };

    const handleInputClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      onInputPortClick?.(id, e);
    };

    const handleOutputClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (outputPortRef.current) {
        onOutputPortClick?.(id, outputPortRef.current);
      }
    };

    const portBaseStyle = "node-port absolute w-4 h-4 bg-card border-2 border-primary rounded-full cursor-pointer hover:bg-primary/50 transition-all flex items-center justify-center z-10";
    const outputPortConnectingStyle = isConnectingFrom ? "ring-2 ring-accent ring-offset-1 ring-offset-card animate-pulse" : "";
    
    // Highlight input port if a connection is in progress from another node and this node is selected
    const inputPortTargetableStyle = connectingState && connectingState.fromNodeId !== id && isSelected ? "bg-accent/80 border-accent animate-pulse-accent" : "";


    return (
      <Card
        ref={ref}
        id={`node-${id}`} 
        className={cn(
          'absolute min-w-[250px] max-w-xs bg-card backdrop-blur-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] group',
          'border-2',
          cardDynamicStyles[status] || cardDynamicStyles.unknown,
          isSelected && !isConnectingFrom && 'ring-2 ring-offset-2 ring-offset-background ring-accent shadow-lg shadow-accent/20 scale-[1.02]',
          className
        )}
        style={{
          left: position?.x || 0,
          top: position?.y || 0,
          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
         }}
        onClick={handleNodeClick}
      >
        {onInputPortClick && (
          <div
            ref={inputPortRef}
            data-port-type="input"
            className={cn(portBaseStyle, "left-[-9px] top-1/2 -translate-y-1/2", inputPortTargetableStyle)}
            onClick={handleInputClick}
            title={`Input to ${title}`}
          >
          </div>
        )}

        {onOutputPortClick && (
          <div
            ref={outputPortRef}
            data-port-type="output"
            className={cn(portBaseStyle, "right-[-9px] top-1/2 -translate-y-1/2", outputPortConnectingStyle)}
            onClick={handleOutputClick}
            title={`Output from ${title}`}
          >
          </div>
        )}

        <CardHeader className="pb-2 pt-4 px-4 cursor-grab select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentTypeIcon}
              <CardTitle className="text-md font-headline">{title}</CardTitle>
            </div>
            {currentStatusIcon}
          </div>
          <CardDescription className="text-xs text-muted-foreground ml-6">{formatDisplayValue(type)}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 cursor-grab select-none">
          {description && <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{description}</p>}
          {agentName && ( // This could display the SuperAGI agent name/ID
            <div className="flex items-center gap-1 text-xs text-primary">
              <Bot className="h-3 w-3" />
              <span>{agentName}</span>
            </div>
          )}
          <Badge variant="outline" className={`mt-2 text-xs ${badgeStyles[status] || badgeStyles.unknown}`}>
            {formatDisplayValue(status)}
          </Badge>
        </CardContent>
      </Card>
    );
  }
);

WorkflowNode.displayName = 'WorkflowNode';
