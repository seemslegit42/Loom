// src/components/panels/inspector-panel.tsx
import { BasePanel } from './base-panel';
import { Settings2, FileText, ShieldCheck, Tags } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface InspectorPanelProps {
  className?: string;
  onClose?: () => void;
}

export function InspectorPanel({ className, onClose }: InspectorPanelProps) {
  return (
    <BasePanel
      title="Inspector"
      icon={<Settings2 className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      initialSize={{ width: '320px', height: 'auto' }}
      contentClassName="space-y-4"
    >
      <div className="space-y-1">
        <Label htmlFor="nodeName" className="text-xs">Node Name</Label>
        <Input id="nodeName" placeholder="Enter node name" defaultValue="Prompt Step 1" className="bg-card/50 backdrop-blur-sm border-input/70" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nodeDescription" className="text-xs">Description</Label>
        <Textarea id="nodeDescription" placeholder="Optional description" rows={3} className="bg-card/50 backdrop-blur-sm border-input/70" />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="sandboxed" className="text-xs flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Sandboxed Execution
        </Label>
        <Switch id="sandboxed" defaultChecked />
      </div>
      <div className="space-y-1">
        <Label className="text-xs flex items-center gap-2">
          <Tags className="h-4 w-4 text-primary"/>
          Tags
        </Label>
        <Input placeholder="Add tags, comma separated" className="bg-card/50 backdrop-blur-sm border-input/70" />
      </div>
       <div className="space-y-1">
        <Label className="text-xs flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary"/>
          Metadata
        </Label>
        <Textarea placeholder="JSON metadata" rows={3} className="font-code text-xs bg-card/50 backdrop-blur-sm border-input/70"/>
      </div>
    </BasePanel>
  );
}
