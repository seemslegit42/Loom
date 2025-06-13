// src/components/workflow/workflow-node.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, AlertTriangle, Clock, HelpCircle, MessageSquare, GitMerge, Zap, Timer, Webhook, SlidersHorizontal, Cog } from 'lucide-react';

interface WorkflowNodeProps {
  title: string;
  type?: 'prompt' | 'decision' | 'agent-call' | 'wait' | 'api-call' | 'trigger' | 'custom';
  status?: 'queued' | 'running' | 'failed' | 'completed' | 'unknown';
  description?: string;
  agentName?: string;
  className?: string;
}

const statusIcons: Record<NonNullable<WorkflowNodeProps['status']>, React.ReactNode> = {
  queued: <Clock className="h-4 w-4 text-blue-400" />,
  running: <Bot className="h-4 w-4 text-primary animate-pulse" />,
  failed: <AlertTriangle className="h-4 w-4 text-destructive" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
};

const typeIcons: Record<NonNullable<WorkflowNodeProps['type']>, React.ReactNode> = {
  prompt: <MessageSquare className="h-4 w-4 text-purple-400" />,
  decision: <GitMerge className="h-4 w-4 text-orange-400" />,
  'agent-call': <Zap className="h-4 w-4 text-yellow-400" />,
  wait: <Timer className="h-4 w-4 text-cyan-400" />,
  'api-call': <Webhook className="h-4 w-4 text-indigo-400" />,
  trigger: <Cog className="h-4 w-4 text-pink-400" />,
  custom: <SlidersHorizontal className="h-4 w-4 text-teal-400" />,
};

const statusColors: Record<string, string> = {
    queued: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    running: "bg-primary/20 text-primary border-primary/50 animate-pulse",
    failed: "bg-destructive/20 text-destructive border-destructive/50",
    completed: "bg-green-500/20 text-green-400 border-green-500/50",
    unknown: "bg-muted/20 text-muted-foreground border-muted/50",
};


export function WorkflowNode({
  title,
  type = 'custom',
  status = 'unknown',
  description,
  agentName,
  className,
}: WorkflowNodeProps) {
  const currentTypeIcon = typeIcons[type] || typeIcons.custom;
  const currentStatusIcon = statusIcons[status] || statusIcons.unknown;

  return (
    <Card className={`min-w-[250px] max-w-xs bg-card/80 backdrop-blur-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] ${className}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentTypeIcon}
            <CardTitle className="text-md font-headline">{title}</CardTitle>
          </div>
          {currentStatusIcon}
        </div>
        <CardDescription className="text-xs text-muted-foreground capitalize ml-6">{type.replace('-', ' ')}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
        {agentName && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Bot className="h-3 w-3" />
            <span>{agentName}</span>
          </div>
        )}
        <Badge variant="outline" className={`mt-2 text-xs ${statusColors[status] || statusColors.unknown}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </CardContent>
    </Card>
  );
}
