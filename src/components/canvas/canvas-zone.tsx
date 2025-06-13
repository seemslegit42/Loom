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
  onInputPortClick: (nodeId: string, e: React.MouseEvent<HTMLDivElement>) => void;
  onOutputPortClick: (nodeId: string, e: React.MouseEvent<HTMLDivElement>) => void;
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
      acc[node.id] = document.getElementById(`node-${node.id}`) as HTMLDivElement | null;
      return acc;
    }, {} as Record<string, HTMLDivElement | null>);
  }, [nodes]);


  const getPortPosition = useCallback((nodeId: string, portType: 'input' | 'output'): PortPosition | null => {
    const nodeEl = nodeRefs.current[nodeId];
    const canvasEl = canvasRef.current;
    if (!nodeEl || !canvasEl) return null;

    const nodeRect = nodeEl.getBoundingClientRect();
    const canvasRect = canvasEl.getBoundingClientRect();
    
    // Find the specific port element, assuming it has a data attribute or specific class
    // For simplicity, we'll use the node's edges.
    // Input port: left middle. Output port: right middle.
    const x = portType === 'input' 
      ? nodeRect.left - canvasRect.left + canvasEl.scrollLeft -8 // Adjust for port width/offset
      : nodeRect.right - canvasRect.left + canvasEl.scrollLeft +8; // Adjust for port width/offset
    const y = nodeRect.top + nodeRect.height / 2 - canvasRect.top + canvasEl.scrollTop;
    
    return { x, y };
  }, [nodeRefs, canvasRef]);


  useEffect(() => {
    const paths: string[] = [];
    connections.forEach(conn => {
      const fromPos = getPortPosition(conn.from, 'output');
      const toPos = getPortPosition(conn.to, 'input');

      if (fromPos && toPos) {
        // Simple straight line, can be changed to Bezier curves later
        paths.push(`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`);
      }
    });
    setLinePathData(paths);
  }, [connections, nodes, getPortPosition, nodeExecutionStatus]); // Rerun if nodes or connections change

  useEffect(() => {
    if (connectingState && connectingState.fromNodeId && mousePosition) {
        const fromPos = getPortPosition(connectingState.fromNodeId, 'output');
        if (fromPos) {
            setTempLinePath(`M ${fromPos.x} ${fromPos.y} L ${mousePosition.x} ${mousePosition.y}`);
        }
    } else {
        setTempLinePath(null);
    }
  }, [connectingState, mousePosition, getPortPosition]);


  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nodeInfo = event.dataTransfer.getData('application/json');
    if (nodeInfo) {
      try {
        const { name, type } = JSON.parse(nodeInfo) as { name: string; type: NodeType };
        // For now, drop at a fixed offset or center of view. Later, use event.clientX/Y
        const position = { x: Math.random() * 300, y: Math.random() * 200 };
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
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('grid-background') || (e.target as HTMLElement).closest('.scroll-area-viewport-content')) {
      if (!connectingState) { // Don't deselect if in middle of connecting
        onNodeSelected(null);
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
      className="h-full w-full rounded-lg border border-dashed border-border/50 grid-background relative" // Added relative
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      ref={canvasRef}
    >
      {/* This inner div is important for correct clientX/clientY calculations relative to scroll */}
      <div className="p-8 min-h-full relative scroll-area-viewport-content"> 
        {workflowName && (
          <div className="mb-8 p-4 bg-card/80 rounded-lg shadow backdrop-blur-md">
            <h2 className="text-xl font-headline mb-2 text-primary">
              Workflow: {workflowName || "Untitled Flow"}
            </h2>
             <p className="text-xs text-muted-foreground">
              {nodes.length} nodes, {connections.length} connections.
              {connectingState && <span className="text-accent ml-2">Connecting from: {nodes.find(n=>n.id === connectingState.fromNodeId)?.title || '...'}</span>}
            </p>
          </div>
        )}
        {displayedNodes.length > 0 ? (
          <div className="flex flex-wrap gap-6"> {/* Using flex-wrap for basic layout, consider absolute positioning for draggable nodes later */}
            {displayedNodes.map((node) => (
              <WorkflowNode
                key={node.id}
                ref={el => { nodeRefs.current[node.id] = el; }} // Assign ref
                node={node}
                onClick={(e, n) => { e.stopPropagation(); onNodeSelected(n);}}
                isSelected={selectedNode?.id === node.id}
                onInputPortClick={onInputPortClick}
                onOutputPortClick={onOutputPortClick}
                isConnectingFrom={connectingState?.fromNodeId === node.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20 pointer-events-none">
            <BrainCircuit className="h-16 w-16 mb-4 text-primary/50" />
            <h2 className="text-2xl font-headline mb-2">Agent Orchestration Canvas</h2>
            <p className="max-w-md">
              Visually build and manage your AI agents here.
              Generate a flow or drag components from Palette. Click a node's output port, then another's input port to connect.
            </p>
          </div>
        )}
        
        {/* SVG Overlay for Connections */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
          </defs>
          {linePathData.map((d, i) => (
            <path key={`conn-${i}`} d={d} stroke="hsl(var(--primary))" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
          ))}
          {tempLinePath && (
            <path d={tempLinePath} stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="5,5" fill="none" markerEnd="url(#arrowhead)" />
          )}
        </svg>
        {connectingState && mousePosition && (
            <MousePointer2 className="h-5 w-5 text-accent absolute pointer-events-none" style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}/>
        )}
      </div>
    </ScrollArea>
  );
}
