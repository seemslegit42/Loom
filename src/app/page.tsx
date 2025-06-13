
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { BottomBar } from '@/components/layout/bottom-bar';
import { CanvasZone } from '@/components/canvas/canvas-zone';
import { PalettePanel } from '@/components/panels/palette-panel';
import { InspectorPanel } from '@/components/panels/inspector-panel';
import { TimelinePanel, type TimelineEvent } from '@/components/panels/timeline-panel';
import { ConsolePanel, type ConsoleMessage } from '@/components/panels/console-panel';
import { AgentHubPanel } from '@/components/panels/agent-hub-panel';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import type { WorkflowNodeData, NodeStatus } from '@/components/workflow/workflow-node';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

export interface PanelVisibility {
  palette: boolean;
  inspector: boolean;
  timeline: boolean;
  console: boolean;
  agentHub: boolean;
}

const generateNodeId = (type: 'ai' | 'manual', workflowName: string, index: number | string): string => {
  const safeWorkflowName = workflowName.replace(/\s+/g, '-').toLowerCase();
  return `${type}-node-${safeWorkflowName}-${index}`;
};


export default function LoomStudioPage() {
  const [generatedFlow, setGeneratedFlow] = useState<GenerateFlowFormState | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    palette: true,
    inspector: true,
    timeline: true,
    console: true,
    agentHub: true,
  });
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, NodeStatus>>({});
  const [consoleFilters, setConsoleFilters] = useState<Record<ConsoleMessage['type'], boolean>>({
    info: true,
    log: true,
    warn: true,
    error: true,
  });

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const addConsoleMessage = (type: ConsoleMessage['type'], text: string) => {
    setConsoleMessages(prev => [{ type, text, timestamp: new Date() }, ...prev.slice(0, 49)]);
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setTimelineEvents(prev => [...prev, { ...event, id: crypto.randomUUID(), timestamp: new Date() }].slice(-50));
  };

  useEffect(() => {
    if (isMobile === undefined) return; 
    if (isMobile) {
      setPanelVisibility({
        palette: false,
        inspector: false,
        timeline: false,
        console: false,
        agentHub: false,
      });
    } else {
      setPanelVisibility({
        palette: true,
        inspector: true,
        timeline: true,
        console: true,
        agentHub: true,
      });
    }
  }, [isMobile]);


  const simulateFlowExecution = (flow: GenerateFlowFormState) => {
    if (!flow.promptSequence || !flow.workflowName) return;

    setTimelineEvents([]); // Clear previous timeline
    setNodeExecutionStatus({}); // Clear previous statuses
    let currentDelay = 0;

    addConsoleMessage('info', `Simulating execution for workflow: "${flow.workflowName}".`);
    addTimelineEvent({
      type: 'workflow_start',
      message: `Workflow "${flow.workflowName}" started.`,
    });

    flow.promptSequence.forEach((prompt, index) => {
      const nodeId = generateNodeId('ai', flow.workflowName as string, index);
      const nodeTitle = `${flow.workflowName || 'AI Step'} ${index + 1}`;

      currentDelay += 500; // Delay for queuing
      setTimeout(() => {
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) queued.`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_queued', message: `Node "${nodeTitle}" queued.` });
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'queued' }));
      }, currentDelay);

      currentDelay += 1000; // Delay for running
      setTimeout(() => {
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) running.`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_running', message: `Node "${nodeTitle}" running.` });
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
      }, currentDelay);

      currentDelay += 1500 + Math.random() * 1000; // Variable delay for completion
      setTimeout(() => {
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) completed.`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_completed', message: `Node "${nodeTitle}" completed.` });
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'completed' }));
      }, currentDelay);
    });
  };


  const handleFlowGenerated = (data: GenerateFlowFormState) => {
    const newFlowData = { // Create a new object for the flow data
      ...data,
      manualNodes: [], // Reset manual nodes when a new AI flow is generated
    };
    setGeneratedFlow(newFlowData);
    setSelectedNode(null); // Deselect any node
    if (data.error) {
      addConsoleMessage('error', `Failed to generate flow: ${data.message}`);
    } else {
      addConsoleMessage('info', `Flow "${data.workflowName || 'Untitled'}" generated successfully.`);
      if (data.promptSequence && data.workflowName) {
        simulateFlowExecution(newFlowData); // Use the newFlowData which has manualNodes reset
      } else {
         setTimelineEvents([]); // Clear timeline if no actual sequence to simulate
         setNodeExecutionStatus({}); // Clear statuses
      }
    }
  };

  const handleNodeDropped = (newNodeData: WorkflowNodeData) => {
    // Generate a unique ID for the manual node
    const nodeId = generateNodeId('manual', newNodeData.title, (generatedFlow?.manualNodes?.length || 0) + Date.now());
    const nodeWithId = { ...newNodeData, id: nodeId, status: newNodeData.status || 'queued' }; // Ensure status is set
    
    setGeneratedFlow(prevFlow => {
      const updatedFlow = {
        ...(prevFlow || { message: "Node added to canvas.", workflowName: "My Custom Flow", promptSequence: [], error: false, userInput: "Custom flow" }),
        manualNodes: [...(prevFlow?.manualNodes || []), nodeWithId],
      };
      return updatedFlow;
    });
    setSelectedNode(nodeWithId); // Select the newly dropped node
    addConsoleMessage('log', `Node "${nodeWithId.title}" (ID: ${nodeWithId.id}) added to canvas.`);
    setNodeExecutionStatus(prev => ({...prev, [nodeWithId.id]: nodeWithId.status! }));
    addTimelineEvent({
      nodeId: nodeWithId.id,
      nodeTitle: nodeWithId.title,
      type: 'node_queued', // Manual nodes are initially queued
      message: `Manual Node "${nodeWithId.title}" added and queued.`
    });
  };

  const handleNodeSelected = (node: WorkflowNodeData | null) => {
    setSelectedNode(node);
    if (node) {
      addConsoleMessage('log', `Node "${node.title}" (ID: ${node.id}) selected.`);
    } else {
      addConsoleMessage('log', `Canvas selected (no node).`);
    }
  };

  const handleNodeUpdate = (updatedNode: WorkflowNodeData) => {
    setGeneratedFlow(prevFlow => {
      if (!prevFlow) return null;

      let newManualNodes = prevFlow.manualNodes || [];
      let newPromptSequence = prevFlow.promptSequence || [];

      const manualNodeIndex = newManualNodes.findIndex(n => n.id === updatedNode.id);
      if (manualNodeIndex !== -1) {
        newManualNodes = [
          ...newManualNodes.slice(0, manualNodeIndex),
          updatedNode,
          ...newManualNodes.slice(manualNodeIndex + 1),
        ];
      } else {
        // Check if it's an AI-generated node by trying to find its original prompt index
        // This is a simplification; a more robust system might map AI nodes to full WorkflowNodeData objects earlier.
        const aiNodePrefix = `ai-node-${(prevFlow.workflowName || '').replace(/\s+/g, '-').toLowerCase()}-`;
        if (updatedNode.id.startsWith(aiNodePrefix)) {
          const indexStr = updatedNode.id.substring(aiNodePrefix.length);
          const index = parseInt(indexStr, 10);
          if (!isNaN(index) && index >= 0 && index < newPromptSequence.length) {
            newPromptSequence = [
              ...newPromptSequence.slice(0, index),
              updatedNode.description, // Only description is editable for AI nodes for now
              ...newPromptSequence.slice(index + 1),
            ];
          }
        }
      }
      
      toast({
        title: "Node Updated",
        description: `Node "${updatedNode.title}" has been saved.`,
      });
      addConsoleMessage('info', `Node "${updatedNode.title}" (ID: ${updatedNode.id}) updated.`);
      
      // If status was changed for a manual node (or potentially an AI node if made fully editable)
      if (updatedNode.status && nodeExecutionStatus[updatedNode.id] !== updatedNode.status) {
        setNodeExecutionStatus(prev => ({...prev, [updatedNode.id]: updatedNode.status! }));
        addTimelineEvent({
          nodeId: updatedNode.id,
          nodeTitle: updatedNode.title,
          type: updatedNode.status === 'completed' ? 'node_completed' : 
                updatedNode.status === 'running' ? 'node_running' :
                updatedNode.status === 'failed' ? 'node_failed' :
                'node_queued', // Default to queued if status is odd
          message: `Node "${updatedNode.title}" status updated to ${updatedNode.status}.`
        });
      }

      return {
        ...prevFlow,
        manualNodes: newManualNodes,
        promptSequence: newPromptSequence,
      };
    });
    setSelectedNode(updatedNode); 
  };


  const togglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility(prev => {
      const newState = { ...prev };
      const currentlyOpening = !prev[panel];

      if (isMobile) {
        if (currentlyOpening) {
          newState.palette = panel === 'palette';
          newState.inspector = panel === 'inspector';
          newState.timeline = panel === 'timeline';
          newState.console = panel === 'console';
          newState.agentHub = panel === 'agentHub';
        } else {
          newState[panel] = false;
        }
      } else {
        newState[panel] = !prev[panel];
      }
      return newState;
    });
  };

  const closeAllMobilePanels = () => {
    if (isMobile) {
      setPanelVisibility({
        palette: false,
        inspector: false,
        timeline: false,
        console: false,
        agentHub: false,
      });
    }
  };

  const toggleConsoleFilter = (type: ConsoleMessage['type']) => {
    setConsoleFilters(prev => ({ ...prev, [type]: !prev[type] }));
     addConsoleMessage('log', `Console filter for "${type.toUpperCase()}" messages ${!consoleFilters[type] ? 'enabled' : 'disabled'}.`);
  };

  const anyMobilePanelOpen = isMobile && Object.values(panelVisibility).some(v => v);

  if (isMobile === undefined) {
    return <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center">Loading UI...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar
        onFlowGenerated={handleFlowGenerated}
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        isMobile={isMobile}
        anyMobilePanelOpen={anyMobilePanelOpen}
      />
      <main className={`flex-1 relative flex overflow-hidden ${isMobile ? 'p-0' : 'p-4 gap-4'} ${isMobile ? 'pb-16' : ''}`}>
        <div className={`flex-1 h-full transition-opacity duration-300 ${anyMobilePanelOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <CanvasZone
            generatedFlow={generatedFlow}
            onNodeDropped={handleNodeDropped}
            selectedNode={selectedNode}
            onNodeSelected={handleNodeSelected}
            nodeExecutionStatus={nodeExecutionStatus}
          />
        </div>

        {!isMobile ? (
          <>
            {panelVisibility.palette && (
              <PalettePanel className="absolute top-4 left-4 z-10" onClose={() => togglePanel('palette')} isMobile={isMobile} />
            )}
            {panelVisibility.inspector && (
              <InspectorPanel
                className="absolute top-4 right-4 z-10 max-h-[calc(50vh-2rem)]"
                onClose={() => togglePanel('inspector')}
                selectedNode={selectedNode}
                onNodeUpdate={handleNodeUpdate}
                isMobile={isMobile}
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex gap-4 z-10">
              {panelVisibility.timeline && (
                <TimelinePanel 
                  className="flex-1 min-w-[300px]" 
                  onClose={() => togglePanel('timeline')} 
                  events={timelineEvents}
                  isMobile={isMobile} 
                />
              )}
              {panelVisibility.console && (
                <ConsolePanel 
                  className="flex-1 min-w-[300px]" 
                  onClose={() => togglePanel('console')}
                  messages={consoleMessages.filter(msg => consoleFilters[msg.type])}
                  filters={consoleFilters}
                  onToggleFilter={toggleConsoleFilter}
                  isMobile={isMobile} 
                />
              )}
            </div>
            {panelVisibility.agentHub && (
              <AgentHubPanel
                 className="absolute bottom-[calc(250px+2rem)] right-4 z-10 max-h-[calc(50vh-2.5rem-env(safe-area-inset-bottom)-250px-2rem)]"
                onClose={() => togglePanel('agentHub')}
                isMobile={isMobile}
              />
            )}
          </>
        ) : (
          <>
            <div className={`fixed inset-y-0 left-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.palette ? 'translate-x-0' : '-translate-x-full'}`}>
              {panelVisibility.palette && <PalettePanel className="h-full p-1" onClose={() => togglePanel('palette')} isMobile={isMobile} />}
            </div>

            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.inspector ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.inspector && <InspectorPanel className="h-full p-1" onClose={() => togglePanel('inspector')} selectedNode={selectedNode} onNodeUpdate={handleNodeUpdate} isMobile={isMobile} />}
            </div>
            
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.agentHub ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.agentHub && <AgentHubPanel className="h-full p-1" onClose={() => togglePanel('agentHub')} isMobile={isMobile} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.timeline ? 'translate-y-0' : 'translate-y-full'} ${isMobile ? 'mb-14' : ''}`}>
              {panelVisibility.timeline && <TimelinePanel className="h-full p-1" onClose={() => togglePanel('timeline')} events={timelineEvents} isMobile={isMobile} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.console ? 'translate-y-0' : 'translate-y-full'} ${isMobile ? 'mb-14' : ''}`}>
              {panelVisibility.console && <ConsolePanel className="h-full p-1" onClose={() => togglePanel('console')} messages={consoleMessages.filter(msg => consoleFilters[msg.type])} filters={consoleFilters} onToggleFilter={toggleConsoleFilter} isMobile={isMobile} />}
            </div>
            
            {anyMobilePanelOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                onClick={closeAllMobilePanels}
              />
            )}
          </>
        )}
      </main>
      {isMobile && <BottomBar panelVisibility={panelVisibility} togglePanel={togglePanel} />}
    </div>
  );
}
