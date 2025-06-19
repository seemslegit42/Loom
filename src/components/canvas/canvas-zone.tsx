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

    const nodeRect = nodeEl.getBoundingClientRect();
    const canvasRect = canvasEl.getBoundingClientRect();
    
    // Attempt to find the viewport for more accurate scroll offset calculations if needed
    const viewportEl = canvasEl.querySelector('[data-radix-scroll-area-viewport=""]') || canvasEl;
    const scrollLeft = viewportEl.scrollLeft;
    const scrollTop = viewportEl.scrollTop;
    
    const portEl = nodeEl.querySelector(`[data-port-type="${portType}"]`) as HTMLElement;
    let x, y;

    if (portEl) {
      const portRect = portEl.getBoundingClientRect();
      // Calculate position relative to the canvas, accounting for canvas scroll
      x = portRect.left + portRect.width / 2 - canvasRect.left + scrollLeft;
      y = portRect.top + portRect.height / 2 - canvasRect.top + scrollTop;
    } else {
      // Fallback if port element not found (should not happen with current WorkflowNode structure)
      // This fallback needs to be carefully considered if ports can be truly absent.
      // For now, assuming ports are always there based on WorkflowNode.tsx structure.
      x = (portType === 'input' ? nodeRect.left : nodeRect.right) - canvasRect.left + scrollLeft;
      if (portType === 'input') { // specific adjustment for input port horizontal center
         x = nodeRect.left + (portEl ? portEl.offsetWidth / 2 : 0) - canvasRect.left + scrollLeft;
      } else { // output
         x = nodeRect.right - (portEl ? portEl.offsetWidth / 2 : 0) - canvasRect.left + scrollLeft;
      }
      y = nodeRect.top + nodeRect.height / 2 - canvasRect.top + scrollTop;
    }

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
    if (connectingState && connectingState.fromNodeId && mousePosition) {
        const fromPos = getPortPosition(connectingState.fromNodeId, 'output');
        if (fromPos && canvasRef.current) {
            // Adjust mousePosition to be relative to the scrolled content for temporary line
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const viewportEl = canvasRef.current.querySelector('[data-radix-scroll-area-viewport=""]') || canvasRef.current;
            const scrollLeft = viewportEl.scrollLeft;
            const scrollTop = viewportEl.scrollTop;

            const relativeMouseX = mousePosition.x - canvasRect.left + scrollLeft;
            const relativeMouseY = mousePosition.y - canvasRect.top + scrollTop;

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
    event.preventDefault(); // Essential for allowing drop
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false); 
    const nodeInfo = event.dataTransfer.getData('application/json');
    if (nodeInfo) {
      try {
        const { name, type } = JSON.parse(nodeInfo) as { name: string; type: NodeType };
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const canvasRect = canvasEl.getBoundingClientRect();
        // Crucially, get scroll from the Viewport element, not the ScrollArea root.
        const viewportEl = canvasEl.querySelector('[data-radix-scroll-area-viewport=""]');
        const scrollLeft = viewportEl?.scrollLeft || canvasEl.scrollLeft || 0;
        const scrollTop = viewportEl?.scrollTop || canvasEl.scrollTop || 0;
        
        const position = {
          x: event.clientX - canvasRect.left + scrollLeft - 125, // 125 is approx node width / 2
          y: event.clientY - canvasRect.top + scrollTop - 50,  // 50 is approx node height / 2
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
    // Check if the click is on the canvas background itself or the immediate content div.
    if (target === canvasRef.current || 
        target.classList.contains('scroll-area-viewport-content') ||
        (target.parentElement && target.parentElement.classList.contains('scroll-area-viewport-content') && !target.closest('.workflow-node-card')) || // click on the inner relative div
        target.closest('.workflow-node-card') === null // General check: not on a node
       ) {
      onNodeSelected(null); 
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // Store mouse position relative to viewport for temp line drawing
    setMousePosition({
        x: event.clientX,
        y: event.clientY,
    });
  };


  const displayedNodes = nodes.map(node => ({
    ...node,
    status: nodeExecutionStatus[node.id] || node.status || 'queued',
  }));

  // This is the div that contains the nodes and acts as their relative positioning context.
  // It needs to be large enough to encompass all nodes and allow scrolling.
  const nodesContainerRelativeParentStyle = "relative min-h-[800px] min-w-[1200px]"; 
  // The direct child of ScrollArea, which is also the viewport's direct child.
  const viewportContentStyle = "p-8 min-h-full relative scroll-area-viewport-content";

  return (
    <ScrollArea
      className={cn(
        "h-full w-full rounded-lg border border-border/30 iridescent-aurora-bg relative transition-all duration-150",
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
      <div className={viewportContentStyle}> 
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
        {/* This div is the direct positioning context for the absolute positioned WorkflowNodes */}
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
            <Sparkles className="h-16 w-16 mb-4 text-primary/50" /> 
            <h2 className="text-2xl font-headline mb-2 text-foreground/90">Your Creative Canvas Awaits</h2>
            <p className="max-w-md text-sm">
              Drag elements from the Palette or use AI to generate a new workflow.
              Connect nodes to bring your ideas to life.
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
            <MousePointer2 className="h-5 w-5 text-accent absolute pointer-events-none z-30" style={{ transform: `translate(${mousePosition.x - canvasRef.current!.getBoundingClientRect().left + (canvasRef.current!.querySelector('[data-radix-scroll-area-viewport=""]') || canvasRef.current!).scrollLeft -2}px, ${mousePosition.y - canvasRef.current!.getBoundingClientRect().top + (canvasRef.current!.querySelector('[data-radix-scroll-area-viewport=""]') || canvasRef.current!).scrollTop -2}px)` }}/>
        )}
      </div>
    </ScrollArea>
  );
}
