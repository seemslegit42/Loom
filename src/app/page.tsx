
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { BottomBar } from '@/components/layout/bottom-bar';
import { CanvasZone } from '@/components/canvas/canvas-zone';
import { PalettePanel } from '@/components/panels/palette-panel';
import { InspectorPanel } from '@/components/panels/inspector-panel';
import { TimelinePanel } from '@/components/panels/timeline-panel';
import { ConsolePanel, type ConsoleMessage } from '@/components/panels/console-panel';
import { AgentHubPanel } from '@/components/panels/agent-hub-panel';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import type { WorkflowNodeData } from '@/components/workflow/workflow-node';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

export interface PanelVisibility {
  palette: boolean;
  inspector: boolean;
  timeline: boolean;
  console: boolean;
  agentHub: boolean;
}

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
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const addConsoleMessage = (type: ConsoleMessage['type'], text: string) => {
    setConsoleMessages(prev => [{ type, text, timestamp: new Date() }, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    if (isMobile === undefined) return; // Wait for isMobile to be defined
    if (isMobile) {
      setPanelVisibility({
        palette: false,
        inspector: false,
        timeline: false,
        console: false,
        agentHub: false,
      });
    } else {
      // Default desktop visibility
      setPanelVisibility({
        palette: true,
        inspector: true,
        timeline: true,
        console: true,
        agentHub: true,
      });
    }
  }, [isMobile]);


  const handleFlowGenerated = (data: GenerateFlowFormState) => {
    setGeneratedFlow({
      ...data,
      manualNodes: [], 
    });
    setSelectedNode(null); 
    if (data.error) {
      addConsoleMessage('error', `Failed to generate flow: ${data.message}`);
    } else {
      addConsoleMessage('info', `Flow "${data.workflowName || 'Untitled'}" generated successfully.`);
    }
  };

  const handleNodeDropped = (newNodeData: WorkflowNodeData) => {
    setGeneratedFlow(prevFlow => {
      const updatedFlow = {
        ...(prevFlow || { message: "Node added to canvas.", workflowName: "My Custom Flow", promptSequence: [], error: false }),
        manualNodes: [...(prevFlow?.manualNodes || []), newNodeData],
      };
      return updatedFlow;
    });
    setSelectedNode(newNodeData); 
    addConsoleMessage('log', `Node "${newNodeData.title}" added to canvas.`);
  };

  const handleNodeSelected = (node: WorkflowNodeData | null) => {
    setSelectedNode(node);
    if (node) {
      addConsoleMessage('log', `Node "${node.title}" selected.`);
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
        const aiNodeIdParts = updatedNode.id.split('-');
        if (aiNodeIdParts[0] === 'ai' && aiNodeIdParts[1] === 'node') {
          const index = parseInt(aiNodeIdParts[2], 10);
          if (!isNaN(index) && index < newPromptSequence.length) {
            newPromptSequence = [
              ...newPromptSequence.slice(0, index),
              updatedNode.description, 
              ...newPromptSequence.slice(index + 1),
            ];
          }
        }
      }
      
      toast({
        title: "Node Updated",
        description: `Node "${updatedNode.title}" has been saved.`,
      });
      addConsoleMessage('info', `Node "${updatedNode.title}" updated.`);

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
          />
        </div>

        {!isMobile ? (
          <>
            {panelVisibility.palette && (
              <PalettePanel className="absolute top-4 left-4 z-10" onClose={() => togglePanel('palette')} />
            )}
            {panelVisibility.inspector && (
              <InspectorPanel
                className="absolute top-4 right-4 z-10 max-h-[calc(50vh-2rem)]"
                onClose={() => togglePanel('inspector')}
                selectedNode={selectedNode}
                onNodeUpdate={handleNodeUpdate}
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex gap-4 z-10">
              {panelVisibility.timeline && (
                <TimelinePanel className="flex-1 min-w-[300px]" onClose={() => togglePanel('timeline')} />
              )}
              {panelVisibility.console && (
                <ConsolePanel 
                  className="flex-1 min-w-[300px]" 
                  onClose={() => togglePanel('console')}
                  messages={consoleMessages} 
                />
              )}
            </div>
            {panelVisibility.agentHub && (
              <AgentHubPanel
                 className="absolute bottom-[calc(250px+2rem)] right-4 z-10 max-h-[calc(50vh-2.5rem-env(safe-area-inset-bottom)-250px-2rem)]"
                onClose={() => togglePanel('agentHub')}
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
              {panelVisibility.timeline && <TimelinePanel className="h-full p-1" onClose={() => togglePanel('timeline')} isMobile={isMobile} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.console ? 'translate-y-0' : 'translate-y-full'} ${isMobile ? 'mb-14' : ''}`}>
              {panelVisibility.console && <ConsolePanel className="h-full p-1" onClose={() => togglePanel('console')} messages={consoleMessages} isMobile={isMobile} />}
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
