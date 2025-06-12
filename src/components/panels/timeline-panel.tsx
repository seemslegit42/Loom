// src/components/panels/timeline-panel.tsx
'use client';

import { BasePanel } from './base-panel';
import { ListOrdered, BarChart3, Bug } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TimelinePanelProps {
  className?: string;
  onClose?: () => void;
}

const timelineEvents = [
  { time: "0.0s", event: "Workflow Started", details: "Trigger: Manual" },
  { time: "0.1s", event: "Prompt Node 1 Queued", details: "Agent: Alpha" },
  { time: "0.3s", event: "Prompt Node 1 Running", details: "Tokens: 150" },
  { time: "1.2s", event: "Prompt Node 1 Completed", details: "Output: Short summary" },
  { time: "1.3s", event: "Decision Node Queued", details: "Condition: Output length > 10" },
];

export function TimelinePanel({ className, onClose }: TimelinePanelProps) {
  const { toast } = useToast();

  const handleTokenUsage = () => {
    toast({ title: "Timeline Action", description: "Token Usage clicked." });
  };

  const handleDebugPath = () => {
    toast({ title: "Timeline Action", description: "Debug Path clicked." });
  };

  return (
    <BasePanel
      title="Timeline"
      icon={<ListOrdered className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      initialSize={{ width: 'auto', height: '250px' }}
    >
      <div className="flex gap-2 mb-2 border-b pb-2">
        <Button variant="ghost" size="sm" className="text-xs" onClick={handleTokenUsage}><BarChart3 className="mr-1 h-3 w-3"/>Token Usage</Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={handleDebugPath}><Bug className="mr-1 h-3 w-3"/>Debug Path</Button>
      </div>
      <ScrollArea className="h-[calc(100%-40px)] pr-2">
        <ul className="space-y-2">
          {timelineEvents.map((item, index) => (
            <li key={index} className="text-xs p-2 rounded-md bg-card/50 border border-border/30">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground/90">{item.event}</span>
                <span className="text-muted-foreground">{item.time}</span>
              </div>
              <p className="text-muted-foreground/80 text-[0.7rem]">{item.details}</p>
            </li>
          ))}
           <li className="text-xs p-2 rounded-md border border-dashed border-border/30 text-center text-muted-foreground">
              Waiting for more events...
            </li>
        </ul>
      </ScrollArea>
    </BasePanel>
  );
}
