
// src/components/canvas/canvas-zone.tsx
import { WorkflowNode, type WorkflowNodeData, type NodeType, type NodeStatus } from '@/components/workflow/workflow-node';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit } from 'lucide-react';
import type React from 'react';

interface CanvasZoneProps {
  generatedFlow: GenerateFlowFormState | null;
  onNodeDropped: (nodeData: WorkflowNodeData) => void;
  selectedNode: WorkflowNodeData | null;
  onNodeSelected: (node: WorkflowNodeData | null) => void;
  nodeExecutionStatus: Record<string, NodeStatus>;
}

const generateNodeId = (type: 'ai' | 'manual', workflowName: string, index: number | string): string => {
  const safeWorkflowName = workflowName.replace(/\s+/g, '-').toLowerCase();
  return `${type}-node-${safeWorkflowName}-${index}`;
};

export function CanvasZone({ generatedFlow, onNodeDropped, selectedNode, onNodeSelected, nodeExecutionStatus }: CanvasZoneProps) {
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); 
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nodeInfo = event.dataTransfer.getData('application/json');
    if (nodeInfo) {
      try {
        const { name, type } = JSON.parse(nodeInfo) as { name: string; type: NodeType };
        // ID will be generated in LoomStudioPage's handleNodeDropped
        const newNodeData: Omit<WorkflowNodeData, 'id'> = {
          title: name,
          type: type,
          description: `User-added ${name} node. Consider providing a default description based on type.`,
          status: 'queued',
        };
        onNodeDropped(newNodeData as WorkflowNodeData); // Cast as ID is added by parent
      } catch (error) {
        console.error("Failed to parse dropped node data:", error);
      }
    }
  };

  const aiNodes: WorkflowNodeData[] = generatedFlow?.promptSequence?.map((prompt, index) => {
    const nodeId = generateNodeId('ai', generatedFlow.workflowName as string, index);
    return {
      id: nodeId,
      title: `${generatedFlow.workflowName || 'AI Step'} ${index + 1}`,
      description: prompt,
      type: 'prompt',
      status: nodeExecutionStatus[nodeId] || 'queued',
    };
  }) || [];

  const manualNodes: WorkflowNodeData[] = (generatedFlow?.manualNodes || []).map(node => ({
    ...node,
    status: nodeExecutionStatus[node.id] || node.status || 'queued',
  }));
  
  const allNodes = [...aiNodes, ...manualNodes];

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onNodeSelected(null);
    }
  };

  return (
    <ScrollArea
      className="h-full w-full rounded-lg border border-dashed border-border/50 grid-background"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      <div className="p-8 min-h-full">
        {generatedFlow && generatedFlow.workflowName && (
          <div className="mb-8 p-4 bg-card/80 rounded-lg shadow backdrop-blur-md">
            <h2 className="text-xl font-headline mb-2 text-primary">
              Workflow: {generatedFlow.workflowName || generatedFlow.userInput || "Untitled Flow"}
            </h2>
          </div>
        )}
        {allNodes.length > 0 ? (
          <div className="flex flex-wrap gap-6">
            {allNodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                onClick={() => onNodeSelected(node)}
                isSelected={selectedNode?.id === node.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20 pointer-events-none">
            <BrainCircuit className="h-16 w-16 mb-4 text-primary/50" />
            <h2 className="text-2xl font-headline mb-2">Agent Orchestration Canvas</h2>
            <p className="max-w-md">
              Visually build and manage your AI agents here.
              Generate a flow using the input above, or drag components from the Palette to start.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
