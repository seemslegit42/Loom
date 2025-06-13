
// src/components/panels/inspector-panel.tsx
import { BasePanel } from './base-panel';
import { Settings2, FileText, ShieldCheck, Tags, Type, Workflow, Save } from 'lucide-react';
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
}

export function InspectorPanel({ className, onClose, selectedNode, onNodeUpdate }: InspectorPanelProps) {
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
  
  // Use a key derived from selectedNode.id to force re-render of inputs when node changes,
  // or to reset the component if no node is selected.
  const panelKey = selectedNode ? selectedNode.id : 'no-node-selected';

  return (
    <BasePanel
      key={panelKey} // Add key here for proper reset if needed, though internal state handles it now
      title="Inspector"
      icon={<Settings2 className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      initialSize={{ width: '320px', height: 'auto' }}
      contentClassName="space-y-3"
    >
      {selectedNode ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nodeName" className="text-xs">Node Name</Label>
            <Input 
              id="nodeName" 
              placeholder="Node name" 
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring" 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nodeType" className="text-xs flex items-center gap-1">
              <Type className="h-3 w-3 text-primary/80"/> Node Type
            </Label>
            <Input 
              id="nodeType" 
              value={selectedNode.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
              className="bg-input/70 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" 
              readOnly 
            />
          </div>
           <div className="space-y-1">
            <Label htmlFor="nodeStatus" className="text-xs flex items-center gap-1">
                <Workflow className="h-3 w-3 text-primary/80"/> Status
            </Label>
            <Input 
              id="nodeStatus" 
              value={selectedNode.status?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'} 
              className="bg-input/70 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" 
              readOnly 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nodeDescription" className="text-xs">Description</Label>
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
            <Label htmlFor="sandboxed" className="text-xs flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Sandboxed Execution
            </Label>
            <Switch id="sandboxed" defaultChecked disabled />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary"/>
              Tags
            </Label>
            <Input placeholder="e.g., data-processing, validation" className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring" readOnly />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary"/>
              Configuration / Metadata
            </Label>
            <Textarea placeholder="JSON configuration for this node" rows={3} className="font-code text-xs bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring" readOnly />
          </div>
          {onNodeUpdate && (
            <Button onClick={handleSaveChanges} className="w-full mt-2" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-10">
          <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Select a node on the canvas to inspect its properties.
        </div>
      )}
    </BasePanel>
  );
}
