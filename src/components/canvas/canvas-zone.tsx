
// src/components/canvas/canvas-zone.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WorkflowNode, type WorkflowNodeData, type NodeType, type NodeStatus } from '@/components/workflow/workflow-node';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, MousePointer2 } from 'lucide-react'; 
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
  onInputPortClick: (nodeId: string) => void; 
  onOutputPortClick: (nodeId: string, portElement: HTMLDivElement) => void; 
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
  const [isDragActive, setIsDragActive] = useState(false); // For palette item drag over canvas

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
    
    const viewportEl = canvasEl.querySelector('[data-radix-scroll-area-viewport=""]') || canvasEl;
    const canvasRect = viewportEl.getBoundingClientRect(); // Use viewport for relative calculations
    const scrollLeft = viewportEl.scrollLeft;
    const scrollTop = viewportEl.scrollTop;
    
    const portEl = nodeEl.querySelector(`[data-port-type="${portType}"]`) as HTMLElement;
    let x, y;

    if (portEl) {
      const portRect = portEl.getBoundingClientRect();
      x = portRect.left + portRect.width / 2 - canvasRect.left; // Relative to viewport
      y = portRect.top + portRect.height / 2 - canvasRect.top;  // Relative to viewport
    } else {
      // Fallback if specific port element isn't found (less accurate)
      const nodeRect = nodeEl.getBoundingClientRect();
      x = (portType === 'input' ? nodeRect.left : nodeRect.right) - canvasRect.left;
      y = nodeRect.top + nodeRect.height / 2 - canvasRect.top;
    }

    // The getPortPosition should return positions relative to the SVG container,
    // which is inside the scrolled viewport. The SVG itself is not scrolled.
    // So, we don't add scrollLeft/scrollTop here as the SVG coordinate system starts at (0,0) of its parent.
    return { x, y };
  }, []); 


  useEffect(() => {
    const paths: string[] = [];
    connections.forEach(conn => {
      const fromPos = getPortPosition(conn.from, 'output');
      const toPos = getPortPosition(conn.to, 'input');

      if (fromPos && toPos) {
        const c1x = fromPos.x + Math.abs(toPos.x - fromPos.x) * 0.5;
        const c1y = fromPos.y;
        const c2x = toPos.x - Math.abs(toPos.x - fromPos.x) * 0.5;
        const c2y = toPos.y;
        paths.push(`M ${fromPos.x} ${fromPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toPos.x} ${toPos.y}`);
      }
    });
    setLinePathData(paths);
  }, [connections, nodes, getPortPosition, nodeExecutionStatus]); 

  useEffect(() => {
    if (connectingState && connectingState.fromNodeId && mousePosition && canvasRef.current) {
        const fromPos = getPortPosition(connectingState.fromNodeId, 'output');
        const viewportEl = canvasRef.current.querySelector('[data-radix-scroll-area-viewport=""]') || canvasRef.current;
        const canvasRect = viewportEl.getBoundingClientRect();
        
        if (fromPos) {
            // Mouse position is global, needs to be relative to the SVG container (viewportEl)
            const relativeMouseX = mousePosition.x - canvasRect.left;
            const relativeMouseY = mousePosition.y - canvasRect.top;

            const c1x = fromPos.x + Math.abs(relativeMouseX - fromPos.x) * 0.3;
            const c1y = fromPos.y;
            const c2x = relativeMouseX - Math.abs(relativeMouseX - fromPos.x) * 0.3;
            const c2y = relativeMouseY;
            setTempLinePath(`M ${fromPos.x} ${fromPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${relativeMouseX} ${relativeMouseY}`);
        }
    } else {
        setTempLinePath(null);
    }
  }, [connectingState, mousePosition, getPortPosition]);


  const handleDragEnterCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const isPaletteItem = event.dataTransfer.types.includes('application/json');
    if (isPaletteItem) {
      setIsDragActive(true);
    }
  };

  const handleDragLeaveCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragActive(false);
  };

  const handleDragOverCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); 
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false); 
    const nodeInfo = event.dataTransfer.getData('application/json');
    if (nodeInfo) {
      try {
        const { name, type } = JSON.parse(nodeInfo) as { name: string; type: NodeType };
        const canvasEl = canvasRef.current; // This is the ScrollArea
        if (!canvasEl) return;

        const viewportEl = canvasEl.querySelector('[data-radix-scroll-area-viewport=""]') || canvasEl;
        const canvasRect = viewportEl.getBoundingClientRect(); // Use viewport for drop calculation

        const scrollLeft = viewportEl.scrollLeft;
        const scrollTop = viewportEl.scrollTop;
        
        // Position relative to the viewport's content area (inside p-8 if grid respects content-box)
        const position = {
          x: event.clientX - canvasRect.left + scrollLeft - 125, // Adjust for node width
          y: event.clientY - canvasRect.top + scrollTop - 50,    // Adjust for node height
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
    const target = e.target as HTMLElement;
    // Check if click is on the viewport content div or its direct parent if it's the scroll area itself
    if (target.classList.contains('scroll-area-viewport-content') ||
        target === canvasRef.current?.querySelector('[data-radix-scroll-area-viewport]') ||
        (target === canvasRef.current && !e.target.closest('.workflow-node-card'))
       ) {
      onNodeSelected(null); 
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({
        x: event.clientX,
        y: event.clientY,
    });
  };


  const displayedNodes = nodes.map(node => ({
    ...node,
    status: nodeExecutionStatus[node.id] || node.status || 'queued',
  }));

  const nodesContainerRelativeParentStyle = "relative min-h-[800px] min-w-[1200px]"; 
  // Moved grid-background to viewportContentStyle for background-origin: content-box to work with p-8
  const viewportContentStyle = "p-8 min-h-full relative scroll-area-viewport-content grid-background";

  return (
    <ScrollArea
      className={cn(
        "h-full w-full rounded-lg border border-border/30 iridescent-aurora-bg relative transition-all duration-150", // Removed grid-background from here
        isDragActive && "ring-2 ring-accent ring-offset-2 ring-offset-background"
        )}
      onDragEnter={handleDragEnterCanvas}
      onDragLeave={handleDragLeaveCanvas}
      onDragOver={handleDragOverCanvas}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove} 
      ref={canvasRef}
    >
      <div className={viewportContentStyle}> {/* Added grid-background here */}
        {workflowName && (
          <div className="mb-8 p-4 bg-card/80 rounded-lg shadow backdrop-blur-md sticky top-0 z-20"> {/* Adjusted top to 0 due to p-8 on parent */}
            <h2 className="text-xl font-headline mb-2 text-primary">
              Workflow: {workflowName || "Untitled Flow"}
            </h2>
             <p className="text-xs text-muted-foreground">
              {nodes.length} nodes, {connections.length} connections.
              {connectingState && <span className="text-accent ml-2">Connecting from: {nodes.find(n=>n.id === connectingState.fromNodeId)?.title || '...'}</span>}
            </p>
          </div>
        )}
        <div className={nodesContainerRelativeParentStyle}> 
            {displayedNodes.map((node) => (
              <WorkflowNode
                key={node.id}
                ref={el => { nodeRefs.current[node.id] = el; }} 
                node={node}
                onClick={(e, n) => { e.stopPropagation(); onNodeSelected(n);}}
                isSelected={selectedNode?.id === node.id}
                onInputPortClick={(nodeId, _e) => onInputPortClick(nodeId)} 
                onOutputPortClick={onOutputPortClick} 
                isConnectingFrom={connectingState?.fromNodeId === node.id}
                connectingState={connectingState}
                className="workflow-node-card" 
              />
            ))}
        </div>
        {!workflowName && displayedNodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground py-20 pointer-events-none">
            <Sparkles className="h-16 w-16 mb-4 text-primary/50 opacity-50" />
            <h2 className="text-2xl font-headline mb-2 text-foreground/90">Your Creative Canvas Awaits</h2>
            <p className="max-w-md text-sm">
              Use the <span className="font-semibold text-primary/90">AI prompt</span> to generate a new workflow,
              <br />or drag nodes from the <span className="font-semibold text-primary/90">Palette</span> to start building.
            </p>
          </div>
        )}

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
          <defs>
            <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
             <marker id="arrowhead-temp" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--accent))" />
            </marker>
          </defs>
          {linePathData.map((d, i) => (
            <path key={`conn-${i}`} d={d} stroke="url(#connection-gradient)" strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" />
          ))}
          {tempLinePath && (
            <path d={tempLinePath} stroke="hsl(var(--accent))" strokeWidth="2.5" strokeDasharray="5,5" fill="none" markerEnd="url(#arrowhead-temp)" />
          )}
        </svg>
        {connectingState && mousePosition && canvasRef.current && (
            <MousePointer2 
              className="h-5 w-5 text-accent absolute pointer-events-none z-30" 
              style={{ 
                transform: `translate(${mousePosition.x - (canvasRef.current.querySelector('[data-radix-scroll-area-viewport=""]') || canvasRef.current).getBoundingClientRect().left -2}px, ${mousePosition.y - (canvasRef.current.querySelector('[data-radix-scroll-area-viewport=""]') || canvasRef.current).getBoundingClientRect().top -2}px)` 
              }}
            />
        )}
      </div>
    </ScrollArea>
  );
}
