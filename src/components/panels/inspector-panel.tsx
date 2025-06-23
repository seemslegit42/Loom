
// src/components/panels/inspector-panel.tsx
import { BasePanel } from './base-panel';
import { Settings2, FileText, ShieldCheck, Tags, Type, Workflow, Save, Brain, Info, Fingerprint, Globe, Play, Loader2, MessageSquare, Trash2, AlertCircle, FunctionSquare, Binary } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { BackendSummarizeOutput, BackendExecutePromptOutput } from '@/app/page';


interface InspectorPanelProps {
  className?: string;
  onClose?: () => void;
  selectedNode: WorkflowNodeData | null;
  onNodeUpdate?: (updatedNode: WorkflowNodeData) => void;
  onNodeDelete?: (nodeId: string) => void;
  isMobile?: boolean;
  onRunNode?: (nodeId: string) => void;
  isNodeRunning?: (nodeId: string) => boolean;
  isResizable?: boolean;
  initialSize?: {width?: string; height?: string};
}

const allNodeStatuses: NodeStatus[] = ['pending', 'queued', 'running', 'completed', 'failed', 'unknown'];

export function InspectorPanel({
  className,
  onClose,
  selectedNode,
  onNodeUpdate,
  onNodeDelete,
  isMobile,
  onRunNode,
  isNodeRunning,
  isResizable,
  initialSize
}: InspectorPanelProps) {
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableStatus, setEditableStatus] = useState<NodeStatus | undefined>(undefined);
  const [editableConfig, setEditableConfig] = useState<WorkflowNodeData['config']>({});

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
        config: editableConfig,
      });
    }
  };

  const handleDelete = () => {
    if (selectedNode && onNodeDelete) {
        onNodeDelete(selectedNode.id);
    }
  };

  const handleConfigChange = (field: keyof NonNullable<WorkflowNodeData['config']>, value: string) => {
    setEditableConfig(prev => ({ ...prev, [field]: value }));
  };

  const panelKey = selectedNode ? `inspector-${selectedNode.id}` : 'inspector-no-node-selected';

  const formatDisplayValue = (value: string = '') => {
    if (!value) return '';
    return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const nodeIsCurrentlyRunning = selectedNode && isNodeRunning ? isNodeRunning(selectedNode.id) : false;

  const nodeCanRun = selectedNode && onRunNode && (
    selectedNode.type === 'web-summarizer' ||
    selectedNode.type === 'prompt' ||
    selectedNode.type === 'agent-call' ||
    selectedNode.type === 'custom' ||
    selectedNode.type === 'data-transform' ||
    selectedNode.type === 'conditional'
  );

  const output = selectedNode?.config?.output;

  let runDisabledReason = '';
  if (selectedNode) {
      if (selectedNode.type === 'web-summarizer' && !editableConfig?.url) {
          runDisabledReason = "URL is required for Web Summarizer.";
      } else if (selectedNode.type === 'prompt' && !editableConfig?.promptText) {
          runDisabledReason = "Prompt Text is required for Prompt Node.";
      } else if (selectedNode.type === 'data-transform' && !editableConfig?.transformationLogic) {
          runDisabledReason = "Transformation Logic is required for Data Transform node.";
      } else if (selectedNode.type === 'conditional' && !editableConfig?.condition) {
          runDisabledReason = "Condition expression is required for Conditional Logic node.";
      }
  }
  const isRunDisabledByConfig = Boolean(runDisabledReason);
  const isRunButtonDisabled = nodeIsCurrentlyRunning || isRunDisabledByConfig;


  return (
    <BasePanel
      key={panelKey}
      title="Inspector"
      icon={<Settings2 className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      isResizable={isResizable}
      initialSize={initialSize}
      contentClassName="space-y-3"
    >
      {selectedNode ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`${panelKey}-nodeName`} className="text-xs flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary/80"/> Node Name
            </Label>
            <Input
              id={`${panelKey}-nodeName`}
              placeholder="Node name"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${panelKey}-nodeId`} className="text-xs flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-primary/80"/> Node ID
            </Label>
            <Input
              id={`${panelKey}-nodeId`}
              value={selectedNode.id}
              className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground"
              readOnly
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${panelKey}-nodeType`} className="text-xs flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-primary/80"/> Node Type
            </Label>
            <Input
              id={`${panelKey}-nodeType`}
              value={formatDisplayValue(selectedNode.type)}
              className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground"
              readOnly
            />
          </div>
           <div className="space-y-1">
            <Label htmlFor={`${panelKey}-nodeStatus`} className="text-xs flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5 text-primary/80"/> Status
            </Label>
            <Select
              value={editableStatus}
              onValueChange={(value: NodeStatus) => setEditableStatus(value)}
            >
              <SelectTrigger id={`${panelKey}-nodeStatus`} className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring">
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
            <Label htmlFor={`${panelKey}-nodeDescription`} className="text-xs flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary/80"/> Description
            </Label>
            <Textarea
              id={`${panelKey}-nodeDescription`}
              placeholder="Node description"
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              rows={3}
              className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
            />
          </div>

          {/* Node Specific Configuration Inputs */}
          {selectedNode.type === 'web-summarizer' && (
            <div className="space-y-3 p-3 border border-dashed border-border/50 rounded-md bg-card/50">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-primary">
                <Globe className="h-4 w-4" /> Web Summarizer Config
              </h4>
              <div className="space-y-1">
                <Label htmlFor={`${panelKey}-summarizerUrl`} className="text-xs">URL to Summarize</Label>
                <Input
                  id={`${panelKey}-summarizerUrl`}
                  placeholder="https://example.com"
                  value={editableConfig?.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {selectedNode.type === 'prompt' && (
             <div className="space-y-3 p-3 border border-dashed border-border/50 rounded-md bg-card/50">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-primary">
                <MessageSquare className="h-4 w-4" /> Prompt Node Config
              </h4>
              <div className="space-y-1">
                <Label htmlFor={`${panelKey}-promptText`} className="text-xs">Prompt Text</Label>
                <Textarea
                  id={`${panelKey}-promptText`}
                  placeholder="Enter your prompt here..."
                  value={editableConfig?.promptText || ''}
                  onChange={(e) => handleConfigChange('promptText', e.target.value)}
                  rows={4}
                  className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${panelKey}-modelName`} className="text-xs">Model / Agent ID (Optional)</Label>
                <Input
                  id={`${panelKey}-modelName`}
                  placeholder="e.g., gemini-pro, specific_agent_id"
                  value={editableConfig?.modelName || ''}
                  onChange={(e) => handleConfigChange('modelName', e.target.value)}
                  className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                />
                 <p className="text-xs text-muted-foreground">The backend will determine its use.</p>
              </div>
            </div>
          )}

          {selectedNode.type === 'data-transform' && (
            <div className="space-y-3 p-3 border border-dashed border-border/50 rounded-md bg-card/50">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-primary">
                <FunctionSquare className="h-4 w-4" /> Data Transform Config
              </h4>
              <div className="space-y-1">
                <Label htmlFor={`${panelKey}-transformLogic`} className="text-xs">Transformation Logic/Rules</Label>
                <Textarea
                  id={`${panelKey}-transformLogic`}
                  placeholder="e.g., Convert to JSON, Extract field 'x', Map values..."
                  value={editableConfig?.transformationLogic || ''}
                  onChange={(e) => handleConfigChange('transformationLogic', e.target.value)}
                  rows={3}
                  className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Describe the data transformation. The backend will interpret and execute this.</p>
              </div>
            </div>
          )}

          {selectedNode.type === 'conditional' && (
            <div className="space-y-3 p-3 border border-dashed border-border/50 rounded-md bg-card/50">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-primary">
                <Binary className="h-4 w-4" /> Conditional Logic Config
              </h4>
              <div className="space-y-1">
                <Label htmlFor={`${panelKey}-conditionExpression`} className="text-xs">Condition Expression</Label>
                <Textarea
                  id={`${panelKey}-conditionExpression`}
                  placeholder="e.g., {{input.value}} > 10 OR {{input.text}} CONTAINS 'error'"
                  value={editableConfig?.condition || ''}
                  onChange={(e) => handleConfigChange('condition', e.target.value)}
                  rows={3}
                  className="bg-input/70 backdrop-blur-sm border-input/70 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Define the condition. The backend will interpret this. Output implies 'true'/'false' paths.</p>
              </div>
            </div>
          )}

          {(selectedNode.type !== 'prompt' && selectedNode.type !== 'web-summarizer' && selectedNode.type !== 'data-transform' && selectedNode.type !== 'conditional') && (
            <div className="space-y-1 p-3 border border-dashed border-border/50 rounded-md bg-card/50">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-primary">
                 Generic Node Configuration
              </h4>
              <p className="text-xs text-muted-foreground">Configuration for '{formatDisplayValue(selectedNode.type)}' nodes will be handled by the backend.</p>
            </div>
          )}

          {/* Centralized Output/Error Display Section */}
          {output && (
            <div className="mt-3 space-y-2 p-3 border border-dashed border-border/30 rounded-md bg-card/40">
              <h4 className="text-xs font-medium text-primary flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Last Output
              </h4>
              {typeof output === 'object' && output !== null && 'error' in output && typeof output.error === 'string' ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Task Error</AlertTitle>
                  <AlertDescription className="text-xs whitespace-pre-wrap">
                    {output.error}
                  </AlertDescription>
                </Alert>
              ) : selectedNode.type === 'web-summarizer' && typeof (output as BackendSummarizeOutput).summary === 'string' ? (
                <div>
                  <Label className="text-xs">Summary:</Label>
                  <Textarea value={(output as BackendSummarizeOutput).summary!} readOnly rows={4} className="bg-input/50 text-xs" />
                </div>
              ) : selectedNode.type === 'prompt' && typeof (output as BackendExecutePromptOutput).responseText === 'string' ? (
                <div>
                  <Label className="text-xs">LLM Response:</Label>
                  <Textarea value={(output as BackendExecutePromptOutput).responseText!} readOnly rows={4} className="bg-input/50 text-xs" />
                </div>
              ) : (
                <div>
                  <Label className="text-xs">Output Data:</Label>
                  <Textarea value={JSON.stringify(output, null, 2)} readOnly rows={4} className="bg-input/50 text-xs" />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {nodeCanRun && (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Wrap the button in a span if it's conditionally disabled, for Tooltip to work reliably on disabled elements */}
                <span tabIndex={isRunButtonDisabled ? 0 : undefined}>
                  <Button
                    onClick={() => onRunNode!(selectedNode.id)}
                    className="w-full mt-1"
                    size="sm"
                    disabled={isRunButtonDisabled}
                  >
                    {nodeIsCurrentlyRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {nodeIsCurrentlyRunning ? 'Running...' : `Run ${formatDisplayValue(selectedNode.type)} Node`}
                  </Button>
                </span>
              </TooltipTrigger>
              {isRunDisabledByConfig && !nodeIsCurrentlyRunning && (
                <TooltipContent>
                  <p>{runDisabledReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor={`${panelKey}-sandboxed`} className="text-xs flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary/80" />
              Sandboxed Execution
            </Label>
            <Switch id={`${panelKey}-sandboxed`} defaultChecked disabled />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5 text-primary/80"/>
              Tags
            </Label>
            <Input placeholder="e.g., data-processing, validation" className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-muted-foreground" readOnly />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {onNodeUpdate && (
              <Button onClick={handleSaveChanges} className="w-full" size="sm" disabled={nodeIsCurrentlyRunning}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            )}
            {onNodeDelete && (
                <Button onClick={handleDelete} variant="destructive" className="w-full" size="sm" disabled={nodeIsCurrentlyRunning}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Node
                </Button>
            )}
          </div>
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
