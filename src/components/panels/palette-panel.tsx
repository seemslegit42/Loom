// src/components/panels/palette-panel.tsx
import { BasePanel } from './base-panel';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Zap, MessageSquare, GitBranch, Cog, ShieldQuestion } from 'lucide-react';

interface PalettePanelProps {
  className?: string;
  onClose?: () => void;
}

const paletteItems = [
  { name: 'Prompt', icon: <MessageSquare className="h-4 w-4" /> },
  { name: 'Agent Call', icon: <Zap className="h-4 w-4" /> },
  { name: 'Decision', icon: <GitBranch className="h-4 w-4" /> },
  { name: 'Trigger', icon: <Cog className="h-4 w-4" /> },
  { name: 'Custom Logic', icon: <ShieldQuestion className="h-4 w-4" /> },
];

export function PalettePanel({ className, onClose }: PalettePanelProps) {
  return (
    <BasePanel
      title="Palette"
      icon={<LayoutGrid className="h-4 w-4" />}
      className={className}
      onClose={onClose}
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
          onDragStart={(e) => e.dataTransfer.setData('text/plain', item.name)}
        >
          {item.icon}
          {item.name}
        </Button>
      ))}
    </BasePanel>
  );
}
