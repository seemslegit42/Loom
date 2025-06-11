// src/components/panels/console-panel.tsx
import { BasePanel } from './base-panel';
import { Terminal, AlertCircle, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConsolePanelProps {
  className?: string;
  onClose?: () => void;
}

const consoleMessages = [
  { type: "info", message: "Loom Studio initialized. Version 1.0.0" },
  { type: "log", message: "Agent 'DataCleaner' connected." },
  { type: "log", message: "Executing workflow 'Customer Data Cleanup'..." },
  { type: "warn", message: "API rate limit approaching for 'geocode_service'." },
  { type: "error", message: "Failed to process record ID: 12345. Reason: Invalid email format." },
];

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

export function ConsolePanel({ className, onClose }: ConsolePanelProps) {
  return (
    <BasePanel
      title="Console"
      icon={<Terminal className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      initialSize={{ width: 'auto', height: '250px' }}
      contentClassName="font-code text-xs p-0"
    >
      <ScrollArea className="h-full w-full">
        <div className="p-2 space-y-1">
        {consoleMessages.map((msg, index) => (
          <div key={index} className={`flex items-start ${getTextColorForType(msg.type)}`}>
            {getIconForType(msg.type)}
            <span className="whitespace-pre-wrap break-all">{`[${new Date().toLocaleTimeString()}] ${msg.message}`}</span>
          </div>
        ))}
        <div className="flex items-start text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
          <span>&gt; Waiting for commands or output...</span>
          <span className="animate-ping ml-1">_</span>
        </div>
        </div>
      </ScrollArea>
    </BasePanel>
  );
}
