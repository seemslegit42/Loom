
// src/components/workflow/workflow-node.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, AlertTriangle, Clock, HelpCircle, MessageSquare, GitMerge, Zap, Timer, Webhook, SlidersHorizontal, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeStatus = 'queued' | 'running' | 'failed' | 'completed' | 'unknown';
export type NodeType = 'prompt' | 'decision' | 'agent-call' | 'wait' | 'api-call' | 'trigger' | 'custom';

export interface WorkflowNodeData {
  id: string;
  title: string;
  type: NodeType;
  description: string;
  status?: NodeStatus;
  agentName?: string;
  // Add other relevant fields like inputSchema, outputSchema, config values etc.
}

interface WorkflowNodeProps {
  node: WorkflowNodeData;
  className?: string;
  onClick?: (node: WorkflowNodeData) => void;
  isSelected?: boolean;
}

const statusIcons: Record<NodeStatus, React.ReactNode> = {
  queued: <Clock className="h-4 w-4 text-blue-400" />,
  running: <Bot className="h-4 w-4 text-primary animate-pulse" />, // Icon can still pulse for header
  failed: <AlertTriangle className="h-4 w-4 text-destructive" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
};

const typeIcons: Record<NodeType, React.ReactNode> = {
  prompt: <MessageSquare className="h-4 w-4 text-purple-400" />,
  decision: <GitMerge className="h-4 w-4 text-orange-400" />,
  'agent-call': <Zap className="h-4 w-4 text-yellow-400" />,
  wait: <Timer className="h-4 w-4 text-cyan-400" />,
  'api-call': <Webhook className="h-4 w-4 text-indigo-400" />,
  trigger: <Cog className="h-4 w-4 text-pink-400" />,
  custom: <SlidersHorizontal className="h-4 w-4 text-teal-400" />,
};

// Styles for the Badge component
const badgeStyles: Record<NodeStatus, string> = {
    queued: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    running: "bg-primary/20 text-primary border-primary/50", // Pulse removed from badge if card pulses
    failed: "bg-destructive/20 text-destructive border-destructive/50",
    completed: "bg-green-500/20 text-green-400 border-green-500/50",
    unknown: "bg-muted/20 text-muted-foreground border-muted/50",
};

// Styles for the Card component's border and overall animation
const cardDynamicStyles: Record<NodeStatus, string> = {
  queued: 'border-blue-500/60',
  running: 'border-primary/60 animate-pulse', // Card itself pulses
  failed: 'border-destructive/70', 
  completed: 'border-green-500/60',
  unknown: 'border-border', // Default card border from globals.css
};


const formatDisplayValue = (value: string = '') => {
  if (!value) return '';
  return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


export function WorkflowNode({ node, className, onClick, isSelected }: WorkflowNodeProps) {
  const { title, type, status = 'unknown', description, agentName } = node;
  const currentTypeIcon = typeIcons[type] || typeIcons.custom; 
  const currentStatusIcon = statusIcons[status] || statusIcons.unknown;

  const handleNodeClick = () => {
    if (onClick) {
      onClick(node);
    }
  };

  return (
    <Card
      className={cn(
        'min-w-[250px] max-w-xs bg-card/80 backdrop-blur-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer',
        'border-2', // Base border width for consistent appearance
        cardDynamicStyles[status] || cardDynamicStyles.unknown,
        isSelected && 'ring-2 ring-offset-2 ring-offset-background ring-accent shadow-accent/30',
        className
      )}
      onClick={handleNodeClick}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentTypeIcon}
            <CardTitle className="text-md font-headline">{title}</CardTitle>
          </div>
          {currentStatusIcon}
        </div>
        <CardDescription className="text-xs text-muted-foreground ml-6">{formatDisplayValue(type)}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {description && <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{description}</p>}
        {agentName && (
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

