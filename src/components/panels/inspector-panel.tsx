
// src/components/panels/inspector-panel.tsx
import { BasePanel } from './base-panel';
import { Settings2, FileText, ShieldCheck, Tags, Type, Workflow, Save, Brain, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { WorkflowNodeData } from '@/components/workflow/workflow-node';
import { useState, useEffect } from 'react';

interface InspectorPanelProps {
  className?: string;
  onClose?: () => void;
  selectedNode: WorkflowNodeData | null;
  onNodeUpdate?: (updatedNode: WorkflowNodeData) => void;
  isMobile?: boolean;
}

export function InspectorPanel({ className, onClose, selectedNode, onNodeUpdate, isMobile }: InspectorPanelProps) {
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setEditableTitle(selectedNode.title);
      setEditableDescription(selectedNode.description);
    } else {
      setEditableTitle('');
      setEditableDescription('');
    }
  }, [selectedNode]);

  const handleSaveChanges = () => {
    if (selectedNode && onNodeUpdate) {
      onNodeUpdate({
        ...selectedNode,
        title: editableTitle,
        description: editableDescription,
      });
    }
  };
  
  const panelKey = selectedNode ? selectedNode.id : 'no-node-selected';

  const formatDisplayValue = (value: string = '') => {
    return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <BasePanel
      key={panelKey} 
      title="Inspector"
      icon={<Settings2 className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      initialSize={{ width: '320px', height: 'auto' }}
      contentClassName="space-y-3"
    >
      {selectedNode ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nodeName" className="text-xs flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary/80"/> Node Name
            </Label>
            <Input 
              id="nodeName" 
              placeholder="Node name" 
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring" 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nodeType" className="text-xs flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-primary/80"/> Node Type
            </Label>
            <Input 
              id="nodeType" 
              value={formatDisplayValue(selectedNode.type)} 
              className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" 
              readOnly 
            />
          </div>
           <div className="space-y-1">
            <Label htmlFor="nodeStatus" className="text-xs flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5 text-primary/80"/> Status
            </Label>
            <Input 
              id="nodeStatus" 
              value={formatDisplayValue(selectedNode.status)} 
              className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" 
              readOnly 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nodeDescription" className="text-xs flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary/80"/> Description
            </Label>
            <Textarea 
              id="nodeDescription" 
              placeholder="Node description" 
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              rows={3} 
              className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring" 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sandboxed" className="text-xs flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary/80" />
              Sandboxed Execution
            </Label>
            <Switch id="sandboxed" defaultChecked disabled />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5 text-primary/80"/>
              Tags
            </Label>
            <Input placeholder="e.g., data-processing, validation" className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" readOnly />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary/80"/>
              Configuration / Metadata
            </Label>
            <Textarea placeholder="JSON configuration for this node" rows={3} className="font-code text-xs bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" readOnly />
          </div>
          {onNodeUpdate && (
            <Button onClick={handleSaveChanges} className="w-full mt-2" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 h-full">
          <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-30 text-primary" />
          <h3 className="font-headline text-lg mb-1 text-foreground/90">Node Inspector</h3>
          <p className="text-sm max-w-xs">
            Select a node on the canvas to view and edit its properties.
            The Inspector Panel allows you to fine-tune the behavior of individual workflow components.
          </p>
        </div>
      )}
    </BasePanel>
  );
}
