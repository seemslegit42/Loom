
// src/components/canvas/canvas-zone.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WorkflowNode, type WorkflowNodeData, type NodeType, type NodeStatus } from '@/components/workflow/workflow-node';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectingState } from '@/app/page';


export interface Connection {
  id: string;
  from: string; // fromNodeId
  to: string;   // toNodeId
}

interface CanvasZoneProps {
  workflowName?: string;
  nodes: WorkflowNodeData[];
  connections: Connection[];
  onNodeDropped: (nodeData: Omit<WorkflowNodeData, 'id' | 'status'> & { status?: NodeStatus }) => void;
  selectedNode: WorkflowNodeData | null;
  onNodeSelected: (node: WorkflowNodeData | null) => void;
  nodeExecutionStatus: Record<string, NodeStatus>;
  onInputPortClick: (nodeId: string) => void; // Updated signature
  onOutputPortClick: (nodeId: string, portElement: HTMLDivElement) => void; // Updated signature
  connectingState: ConnectingState | null;
}

interface PortPosition {
  x: number;
  y: number;
}

export function CanvasZone({
  workflowName,
  nodes,
  connections,
  onNodeDropped,
  selectedNode,
  onNodeSelected,
  nodeExecutionStatus,
  onInputPortClick,
  onOutputPortClick,
  connectingState,
}: CanvasZoneProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [linePathData, setLinePathData] = useState<string[]>([]);
  const [tempLinePath, setTempLinePath] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Initialize or clear nodeRefs when nodes change
  useEffect(() => {
    nodeRefs.current = nodes.reduce((acc, node) => {
      // Use the id directly for the DOM element lookup
      acc[node.id] = document.getElementById(`node-${node.id}`) as HTMLDivElement | null;
      return acc;
    }, {} as Record<string, HTMLDivElement | null>);
  }, [nodes]);


  const getPortPosition = useCallback((nodeId: string, portType: 'input' | 'output'): PortPosition | null => {
    const nodeEl = nodeRefs.current[nodeId]; // Use the ref directly
    const canvasEl = canvasRef.current;
    if (!nodeEl || !canvasEl) return null;

    const nodeRect = nodeEl.getBoundingClientRect();
    const canvasRect = canvasEl.getBoundingClientRect();

    // The port elements themselves are now what we target.
    // The WorkflowNode component will ensure these ports exist with identifiable classes or attributes.
    // For now, we'll approximate based on node edges as before, but this would be more robust
    // if we queried for child elements with specific data-port-type attributes.
    // Example: nodeEl.querySelector(`[data-port-type="${portType}"]`)
    // For simplicity in this step, stick to edge approximation.

    const x = portType === 'input'
      ? nodeRect.left - canvasRect.left + canvasEl.scrollLeft - 8 // Adjust for port width/offset from node edge
      : nodeRect.right - canvasRect.left + canvasEl.scrollLeft + 8;
    const y = nodeRect.top + nodeRect.height / 2 - canvasRect.top + canvasEl.scrollTop;

    return { x, y };
  }, []); // Removed nodeRefs dependency as it's managed by direct DOM access


  useEffect(() => {
    const paths: string[] = [];
    connections.forEach(conn => {
      const fromPos = getPortPosition(conn.from, 'output');
      const toPos = getPortPosition(conn.to, 'input');

      if (fromPos && toPos) {
        // Simple straight line for now, can be upgraded to Bezier later
        // paths.push(`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`);

        // Basic Bezier curve (horizontal)
        const c1x = fromPos.x + Math.abs(toPos.x - fromPos.x) * 0.5;
        const c1y = fromPos.y;
        const c2x = toPos.x - Math.abs(toPos.x - fromPos.x) * 0.5;
        const c2y = toPos.y;
        paths.push(`M ${fromPos.x} ${fromPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toPos.x} ${toPos.y}`);
      }
    });
    setLinePathData(paths);
  }, [connections, nodes, getPortPosition, nodeExecutionStatus]); // Rerun if nodes or connections change

  useEffect(() => {
    if (connectingState && connectingState.fromNodeId && mousePosition) {
        const fromPos = getPortPosition(connectingState.fromNodeId, 'output');
        if (fromPos) {
            // Basic Bezier for temp line as well
            const c1x = fromPos.x + Math.abs(mousePosition.x - fromPos.x) * 0.3;
            const c1y = fromPos.y;
            const c2x = mousePosition.x - Math.abs(mousePosition.x - fromPos.x) * 0.3;
            const c2y = mousePosition.y;
            setTempLinePath(`M ${fromPos.x} ${fromPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${mousePosition.x} ${mousePosition.y}`);
        }
    } else {
        setTempLinePath(null);
    }
  }, [connectingState, mousePosition, getPortPosition]);


  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nodeInfo = event.dataTransfer.getData('application/json');
    if (nodeInfo) {
      try {
        const { name, type } = JSON.parse(nodeInfo) as { name: string; type: NodeType };
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;
        const canvasRect = canvasEl.getBoundingClientRect();
        const position = {
          x: event.clientX - canvasRect.left + canvasEl.scrollLeft - 125, // Adjust for node width/2
          y: event.clientY - canvasRect.top + canvasEl.scrollTop - 50, // Adjust for node height/2
        };

        const newNodeData: Omit<WorkflowNodeData, 'id' | 'status'> & { status?: NodeStatus } = {
          title: name,
          type: type,
          description: `User-added ${name} node.`,
          position,
        };
        onNodeDropped(newNodeData);
      } catch (error) {
        console.error("Failed to parse dropped node data:", error);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ensure click is directly on canvas or its scroll area content, not a node or port.
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.classList.contains('scroll-area-viewport-content') || target.classList.contains('grid-background')) {
       if (!connectingState) { // Don't deselect if in middle of connecting
        onNodeSelected(null);
      } else {
        // If clicking canvas while connecting, cancel connection
        // setConnectingState(null); // This is handled in onNodeSelected(null) if page.tsx calls it.
        // addConsoleMessage('log', 'Connection cancelled by clicking canvas.');
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (connectingState && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setMousePosition({
            x: event.clientX - canvasRect.left + canvasRef.current.scrollLeft,
            y: event.clientY - canvasRect.top + canvasRef.current.scrollTop,
        });
    }
  };

  const displayedNodes = nodes.map(node => ({
    ...node,
    status: nodeExecutionStatus[node.id] || node.status || 'queued',
  }));

  return (
    <ScrollArea
      className="h-full w-full rounded-lg border border-dashed border-border/50 grid-background relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove} // Add mouse move listener to the ScrollArea
      ref={canvasRef}
    >
      <div className="p-8 min-h-full relative scroll-area-viewport-content">
        {workflowName && (
          <div className="mb-8 p-4 bg-card/80 rounded-lg shadow backdrop-blur-md sticky top-4 z-20">
            <h2 className="text-xl font-headline mb-2 text-primary">
              Workflow: {workflowName || "Untitled Flow"}
            </h2>
             <p className="text-xs text-muted-foreground">
              {nodes.length} nodes, {connections.length} connections.
              {connectingState && <span className="text-accent ml-2">Connecting from: {nodes.find(n=>n.id === connectingState.fromNodeId)?.title || '...'}</span>}
            </p>
          </div>
        )}
        {/* Nodes are absolutely positioned relative to this div */}
        <div className="relative min-h-[800px] min-w-[1200px]"> {/* Ensure enough space for absolute positioning and scrolling */}
            {displayedNodes.map((node) => (
              <WorkflowNode
                key={node.id}
                ref={el => { nodeRefs.current[node.id] = el; }} // Assign ref for DOM element access
                node={node}
                onClick={(e, n) => { e.stopPropagation(); onNodeSelected(n);}}
                isSelected={selectedNode?.id === node.id}
                onInputPortClick={(nodeId, _e) => onInputPortClick(nodeId)} // _e from node is not needed in page.tsx
                onOutputPortClick={onOutputPortClick} // Pass handler directly
                isConnectingFrom={connectingState?.fromNodeId === node.id}
              />
            ))}
        </div>
        {!workflowName && displayedNodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground py-20 pointer-events-none">
            <BrainCircuit className="h-16 w-16 mb-4 text-primary/50" />
            <h2 className="text-2xl font-headline mb-2">Agent Orchestration Canvas</h2>
            <p className="max-w-md">
              Visually build and manage your AI agents here.
              Generate a flow or drag components from Palette. Click a node's output port, then another's input port to connect.
            </p>
          </div>
        )}

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
             <marker id="arrowhead-temp" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--accent))" />
            </marker>
          </defs>
          {linePathData.map((d, i) => (
            <path key={`conn-${i}`} d={d} stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" />
          ))}
          {tempLinePath && (
            <path d={tempLinePath} stroke="hsl(var(--accent))" strokeWidth="2.5" strokeDasharray="5,5" fill="none" markerEnd="url(#arrowhead-temp)" />
          )}
        </svg>
        {connectingState && mousePosition && (
            <MousePointer2 className="h-5 w-5 text-accent absolute pointer-events-none z-30" style={{ transform: `translate(${mousePosition.x -2}px, ${mousePosition.y -2}px)` }}/>
        )}
      </div>
    </ScrollArea>
  );
}

    