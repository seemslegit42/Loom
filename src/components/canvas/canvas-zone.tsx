
// src/components/canvas/canvas-zone.tsx
import { WorkflowNode, type WorkflowNodeData, type NodeType } from '@/components/workflow/workflow-node';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit } from 'lucide-react';
import type React from 'react';

interface CanvasZoneProps {
  generatedFlow: GenerateFlowFormState | null;
  onNodeDropped: (nodeData: WorkflowNodeData) => void;
  selectedNode: WorkflowNodeData | null;
  onNodeSelected: (node: WorkflowNodeData | null) => void;
}

export function CanvasZone({ generatedFlow, onNodeDropped, selectedNode, onNodeSelected }: CanvasZoneProps) {
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nodeInfo = event.dataTransfer.getData('application/json');
    if (nodeInfo) {
      try {
        const { name, type } = JSON.parse(nodeInfo) as { name: string; type: NodeType };
        const newNodeData: WorkflowNodeData = {
          id: crypto.randomUUID(),
          title: name,
          type: type,
          description: `User-added ${name} node. Consider providing a default description based on type.`,
          status: 'queued', // Default status for manually added nodes
        };
        onNodeDropped(newNodeData);
      } catch (error) {
        console.error("Failed to parse dropped node data:", error);
      }
    }
  };

  const aiNodes: WorkflowNodeData[] = generatedFlow?.promptSequence?.map((prompt, index) => ({
    id: `ai-node-${index}-${generatedFlow.workflowName || 'flow'}`, // Ensure unique IDs if multiple flows can exist
    title: `${generatedFlow.workflowName || 'AI Step'} ${index + 1}`,
    description: prompt,
    type: 'prompt', // Assuming AI steps are prompts for now
    status: index === 0 ? 'running' : 'queued', // Example status logic
  })) || [];

  const manualNodes: WorkflowNodeData[] = generatedFlow?.manualNodes || [];
  const allNodes = [...aiNodes, ...manualNodes];

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is on the canvas itself (not a node), deselect any selected node.
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
