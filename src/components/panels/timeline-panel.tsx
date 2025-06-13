
// src/components/panels/timeline-panel.tsx
'use client';

import { BasePanel } from './base-panel';
import { ListOrdered, BarChart3, Bug, Workflow, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface TimelineEvent {
  id: string;
  nodeId?: string;
  nodeTitle?: string;
  type: 'workflow_start' | 'node_queued' | 'node_running' | 'node_completed' | 'node_failed' | 'info';
  message: string;
  timestamp: Date;
}

interface TimelinePanelProps {
  className?: string;
  onClose?: () => void;
  events: TimelineEvent[];
  isMobile?: boolean;
}

const getIconForEventType = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'workflow_start': return <Workflow className="h-3.5 w-3.5 text-primary mr-2 shrink-0" />;
    case 'node_queued': return <Clock className="h-3.5 w-3.5 text-blue-400 mr-2 shrink-0" />;
    case 'node_running': return <Workflow className="h-3.5 w-3.5 text-yellow-400 mr-2 shrink-0 animate-pulse" />;
    case 'node_completed': return <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-2 shrink-0" />;
    case 'node_failed': return <AlertTriangle className="h-3.5 w-3.5 text-destructive mr-2 shrink-0" />;
    default: return <ListOrdered className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />;
  }
};

export function TimelinePanel({ className, onClose, events, isMobile }: TimelinePanelProps) {
  const { toast } = useToast();

  const handleTokenUsage = () => {
    toast({ title: "Timeline Action", description: "Token Usage: Feature coming soon!" });
  };

  const handleDebugPath = () => {
    toast({ title: "Timeline Action", description: "Debug Path: Feature coming soon!" });
  };

  return (
    <BasePanel
      title="Timeline"
      icon={<ListOrdered className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      initialSize={{ width: 'auto', height: '250px' }}
    >
      <div className="flex gap-2 mb-2 border-b pb-2">
        <Button variant="ghost" size="sm" className="text-xs" onClick={handleTokenUsage}><BarChart3 className="mr-1 h-3 w-3"/>Token Usage</Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={handleDebugPath}><Bug className="mr-1 h-3 w-3"/>Debug Path</Button>
      </div>
      <ScrollArea className="h-[calc(100%-40px)] pr-2">
        {events.length === 0 ? (
          <div className="text-xs p-2 rounded-md border border-dashed border-border/30 text-center text-muted-foreground">
            No workflow events yet. Generate or interact with a flow.
          </div>
        ) : (
          <ul className="space-y-2">
            {events.map((item) => (
              <li key={item.id} className="text-xs p-2 rounded-md bg-card/50 border border-border/30">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {getIconForEventType(item.type)}
                    <span className={cn(
                      "font-medium text-foreground/90",
                      item.type === 'node_failed' && "text-destructive"
                    )}>
                      {item.nodeTitle ? `Node: ${item.nodeTitle}` : item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-muted-foreground">{item.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-muted-foreground/80 text-[0.7rem] ml-[22px]">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </BasePanel>
  );
}

