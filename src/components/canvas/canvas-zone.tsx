
// src/components/canvas/canvas-zone.tsx
import { WorkflowNode, type WorkflowNodeData, type NodeType, type NodeStatus } from '@/components/workflow/workflow-node';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit } from 'lucide-react';
import type React from 'react';

interface CanvasZoneProps {
  workflowName?: string; 
  nodes: WorkflowNodeData[]; 
  onNodeDropped: (nodeData: Omit<WorkflowNodeData, 'id' | 'status'> & { status?: NodeStatus }) => void;
  selectedNode: WorkflowNodeData | null;
  onNodeSelected: (node: WorkflowNodeData | null) => void;
  nodeExecutionStatus: Record<string, NodeStatus>;
}

export function CanvasZone({
  workflowName,
  nodes,
  onNodeDropped,
  selectedNode,
  onNodeSelected,
  nodeExecutionStatus
}: CanvasZoneProps) {
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nodeInfo = event.dataTransfer.getData('application/json');
    if (nodeInfo) {
      try {
        const { name, type } = JSON.parse(nodeInfo) as { name: string; type: NodeType };
        const newNodeData: Omit<WorkflowNodeData, 'id' | 'status'> & { status?: NodeStatus } = {
          title: name,
          type: type,
          description: `User-added ${name} node. Consider providing a default description based on type.`,
        };
        onNodeDropped(newNodeData);
      } catch (error) {
        console.error("Failed to parse dropped node data:", error);
      }
    }
  };

  const displayedNodes = nodes.map(node => ({
    ...node,
    status: nodeExecutionStatus[node.id] || node.status || 'queued',
  }));

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('grid-background') || (e.target as HTMLElement).closest('.grid-background')) {
      onNodeSelected(null);
    }
  };

  const handleNodeClick = (event: React.MouseEvent<HTMLDivElement>, node: WorkflowNodeData) => {
    event.stopPropagation(); // Prevent canvas click when a node is clicked
    onNodeSelected(node);
  };


  return (
    <ScrollArea
      className="h-full w-full rounded-lg border border-dashed border-border/50 grid-background"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick} 
    >
      <div className="p-8 min-h-full"> 
        {workflowName && (
          <div className="mb-8 p-4 bg-card/80 rounded-lg shadow backdrop-blur-md">
            <h2 className="text-xl font-headline mb-2 text-primary">
              Workflow: {workflowName || "Untitled Flow"}
            </h2>
          </div>
        )}
        {displayedNodes.length > 0 ? (
          <div className="flex flex-wrap gap-6">
            {displayedNodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                onClick={handleNodeClick}
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
