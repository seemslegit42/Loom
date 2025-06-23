// src/components/panels/palette-panel.tsx
import { BasePanel } from './base-panel';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Zap, MessageSquare, GitMerge, Cog, Timer, Webhook, SlidersHorizontal, Globe, FunctionSquare, Binary } from 'lucide-react'; // Added Binary

interface PalettePanelProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
}

const paletteItems = [
  { name: 'Prompt', type: 'prompt', icon: <MessageSquare className="h-4 w-4" /> },
  { name: 'Agent Call', type: 'agent-call', icon: <Zap className="h-4 w-4" /> },
  { name: 'Decision', type: 'decision', icon: <GitMerge className="h-4 w-4" /> }, // Often used for conditional-like splits
  { name: 'Conditional Logic', type: 'conditional', icon: <Binary className="h-4 w-4" /> },
  { name: 'Web Summarizer', type: 'web-summarizer', icon: <Globe className="h-4 w-4" /> },
  { name: 'Data Transform', type: 'data-transform', icon: <FunctionSquare className="h-4 w-4" /> },
  { name: 'API Call', type: 'api-call', icon: <Webhook className="h-4 w-4" /> },
  { name: 'Trigger', type: 'trigger', icon: <Cog className="h-4 w-4" /> },
  { name: 'Wait', type: 'wait', icon: <Timer className="h-4 w-4" /> },
  { name: 'Custom Logic', type: 'custom', icon: <SlidersHorizontal className="h-4 w-4" /> },
];

export function PalettePanel({ className, onClose, isMobile }: PalettePanelProps) {
  return (
    <BasePanel
      title="Palette"
      icon={<LayoutGrid className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      isResizable={true}
      initialSize={{ width: '280px', height: 'auto' }}
      contentClassName="space-y-2"
    >
      <p className="text-xs text-muted-foreground px-1">Drag blocks to the canvas:</p>
      {paletteItems.map((item) => (
        <Button
          key={item.name}
          variant="outline"
          className="w-full justify-start gap-2 bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ name: item.name, type: item.type }));
          }}
        >
          {item.icon}
          {item.name}
        </Button>
      ))}
    </BasePanel>
  );
}
