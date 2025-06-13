
// src/components/panels/inspector-panel.tsx
import { BasePanel } from './base-panel';
import { Settings2, FileText, ShieldCheck, Tags, Type, Workflow, Save, Brain, Info, Fingerprint, Globe, Play, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { WorkflowNodeData, NodeStatus } from '@/components/workflow/workflow-node';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InspectorPanelProps {
  className?: string;
  onClose?: () => void;
  selectedNode: WorkflowNodeData | null;
  onNodeUpdate?: (updatedNode: WorkflowNodeData) => void;
  isMobile?: boolean;
  onRunNode?: (nodeId: string) => void; // New prop for running a node
  isNodeRunning?: (nodeId: string) => boolean; // New prop to check if node is running
}

const allNodeStatuses: NodeStatus[] = ['queued', 'running', 'completed', 'failed', 'unknown'];

export function InspectorPanel({ className, onClose, selectedNode, onNodeUpdate, isMobile, onRunNode, isNodeRunning }: InspectorPanelProps) {
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableStatus, setEditableStatus] = useState<NodeStatus | undefined>(undefined);
  const [editableConfig, setEditableConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setEditableTitle(selectedNode.title);
      setEditableDescription(selectedNode.description);
      setEditableStatus(selectedNode.status || 'unknown');
      setEditableConfig(selectedNode.config || {});
    } else {
      setEditableTitle('');
      setEditableDescription('');
      setEditableStatus(undefined);
      setEditableConfig({});
    }
  }, [selectedNode]);

  const handleSaveChanges = () => {
    if (selectedNode && onNodeUpdate && editableStatus) {
      onNodeUpdate({
        ...selectedNode,
        title: editableTitle,
        description: editableDescription,
        status: editableStatus,
        config: { ...selectedNode.config, ...editableConfig },
      });
    }
  };

  const handleConfigChange = (field: string, value: string) => {
    setEditableConfig(prev => ({ ...prev, [field]: value }));
  };
  
  const panelKey = selectedNode ? selectedNode.id : 'no-node-selected';

  const formatDisplayValue = (value: string = '') => {
    if (!value) return '';
    return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const nodeIsCurrentlyRunning = selectedNode && isNodeRunning ? isNodeRunning(selectedNode.id) : false;

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
            <Label htmlFor="nodeId" className="text-xs flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-primary/80"/> Node ID
            </Label>
            <Input 
              id="nodeId" 
              value={selectedNode.id} 
              className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" 
              readOnly 
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
            <Select
              value={editableStatus}
              onValueChange={(value: NodeStatus) => setEditableStatus(value)}
            >
              <SelectTrigger id="nodeStatus" className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {allNodeStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {formatDisplayValue(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Node-specific config */}
          {selectedNode.type === 'web-summarizer' && (
            <div className="space-y-3 p-3 border border-dashed border-border/50 rounded-md bg-card/50">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-primary">
                <Globe className="h-4 w-4" /> Web Summarizer Config
              </h4>
              <div className="space-y-1">
                <Label htmlFor="summarizerUrl" className="text-xs">URL to Summarize</Label>
                <Input
                  id="summarizerUrl"
                  placeholder="https://example.com"
                  value={editableConfig.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                />
              </div>
              {onRunNode && (
                <Button 
                  onClick={() => onRunNode(selectedNode.id)} 
                  className="w-full mt-1" 
                  size="sm"
                  disabled={!editableConfig.url || nodeIsCurrentlyRunning}
                >
                  {nodeIsCurrentlyRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  {nodeIsCurrentlyRunning ? 'Running...' : 'Run Summarizer'}
                </Button>
              )}
              {selectedNode.config?.output?.summary && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs">Summary Output:</Label>
                  <Textarea value={selectedNode.config.output.summary} readOnly rows={4} className="bg-input/50 backdrop-blur-sm border-input/50 text-xs" />
                </div>
              )}
              {selectedNode.config?.output?.error && (
                 <Alert variant="destructive" className="mt-2">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle className="text-xs">Summarization Error</AlertTitle>
                   <AlertDescription className="text-xs">{selectedNode.config.output.error}</AlertDescription>
                 </Alert>
              )}
            </div>
          )}

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
          
          {onNodeUpdate && (
            <Button onClick={handleSaveChanges} className="w-full mt-2" size="sm" disabled={nodeIsCurrentlyRunning}>
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
          </p>
        </div>
      )}
    </BasePanel>
  );
}
