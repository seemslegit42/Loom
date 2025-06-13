
// src/components/panels/console-panel.tsx
import { BasePanel } from './base-panel';
import { Terminal, AlertCircle, Info, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConsoleMessage {
  type: 'info' | 'log' | 'warn' | 'error';
  text: string;
  timestamp: Date;
}

interface ConsolePanelProps {
  className?: string;
  onClose?: () => void;
  messages: ConsoleMessage[];
  filters: Record<ConsoleMessage['type'], boolean>;
  onToggleFilter: (type: ConsoleMessage['type']) => void;
  isMobile?: boolean;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'error': return <AlertCircle className="h-3.5 w-3.5 text-destructive mr-2 shrink-0" />;
    case 'warn': return <AlertCircle className="h-3.5 w-3.5 text-yellow-500 mr-2 shrink-0" />;
    case 'info': return <Info className="h-3.5 w-3.5 text-blue-400 mr-2 shrink-0" />;
    default: return <Terminal className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />;
  }
};

const getTextColorForType = (type: string) => {
  switch (type) {
    case 'error': return "text-destructive";
    case 'warn': return "text-yellow-400";
    case 'info': return "text-blue-300";
    default: return "text-foreground/80";
  }
};

const filterableMessageTypes: ConsoleMessage['type'][] = ['info', 'log', 'warn', 'error'];

export function ConsolePanel({ className, onClose, messages, filters, onToggleFilter, isMobile }: ConsolePanelProps) {
  const allFiltersEnabled = Object.values(filters).every(Boolean);
  
  return (
    <BasePanel
      title="Console"
      icon={<Terminal className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      initialSize={{ width: 'auto', height: '250px' }}
      contentClassName="font-code text-xs p-0 flex flex-col"
    >
      <div className="p-2 border-b border-border/30 flex items-center gap-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        {filterableMessageTypes.map((type) => (
          <Button
            key={type}
            variant={filters[type] ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "text-xs h-6 px-1.5 py-0.5",
              filters[type] && "border border-primary/50"
            )}
            onClick={() => onToggleFilter(type)}
            title={`${filters[type] ? 'Hide' : 'Show'} ${type} messages`}
          >
            {getIconForType(type)}
            <span className="ml-0.5">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </Button>
        ))}
      </div>
      <ScrollArea className="h-full w-full flex-grow">
        <div className="p-2 space-y-1">
        {messages.length === 0 && (
            <div className="flex items-start text-muted-foreground">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
                <span>
                  {allFiltersEnabled
                    ? "Loom Studio initialized. Waiting for events..." 
                    : "No messages match current filters."}
                </span>
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start ${getTextColorForType(msg.type)}`}>
            {getIconForType(msg.type)}
            <span className="whitespace-pre-wrap break-all">{`[${msg.timestamp.toLocaleTimeString()}] ${msg.text}`}</span>
          </div>
        ))}
        {messages.length > 0 && (
          <div className="flex items-start text-muted-foreground pt-1 mt-1 border-t border-border/20">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
            <span>&gt; Listening for new events...</span>
            <span className="animate-ping ml-1">_</span>
          </div>
        )}
        </div>
      </ScrollArea>
    </BasePanel>
  );
}
