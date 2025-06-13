
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { BottomBar } from '@/components/layout/bottom-bar';
import { CanvasZone } from '@/components/canvas/canvas-zone';
import { PalettePanel } from '@/components/panels/palette-panel';
import { InspectorPanel } from '@/components/panels/inspector-panel';
import { TimelinePanel } from '@/components/panels/timeline-panel';
import { ConsolePanel } from '@/components/panels/console-panel';
import { AgentHubPanel } from '@/components/panels/agent-hub-panel';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import type { WorkflowNodeData } from '@/components/workflow/workflow-node';
import { useIsMobile } from '@/hooks/use-mobile';

export interface PanelVisibility {
  palette: boolean;
  inspector: boolean;
  timeline: boolean;
  console: boolean;
  agentHub: boolean;
}

export default function LoomStudioPage() {
  const [generatedFlow, setGeneratedFlow] = useState<GenerateFlowFormState | null>(null);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    palette: true,
    inspector: true,
    timeline: true,
    console: true,
    agentHub: true,
  });
  const isMobile = useIsMobile();

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
    // When AI generates a flow, it provides workflowName and promptSequence.
    // We clear manualNodes.
    setGeneratedFlow({
      ...data,
      manualNodes: [], 
    });
  };

  const handleNodeDropped = (newNodeData: WorkflowNodeData) => {
    setGeneratedFlow(prevFlow => {
      if (prevFlow) {
        return {
          ...prevFlow,
          manualNodes: [...(prevFlow.manualNodes || []), newNodeData],
        };
      }
      // If no flow exists (e.g., user starts by dragging), create one.
      return {
        message: "Node added to canvas.",
        workflowName: "My Custom Flow",
        promptSequence: [],
        manualNodes: [newNodeData],
        error: false,
      };
    });
  };


  const togglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility(prev => {
      const newState = { ...prev };
      const currentlyOpening = !prev[panel];

      if (isMobile) {
        // On mobile, opening one panel closes others
        if (currentlyOpening) {
          newState.palette = panel === 'palette';
          newState.inspector = panel === 'inspector';
          newState.timeline = panel === 'timeline';
          newState.console = panel === 'console';
          newState.agentHub = panel === 'agentHub';
        } else {
          // If closing, just close that specific panel
          newState[panel] = false;
        }
      } else {
        // Desktop behavior: toggle individually
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
    return <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center">Loading UI...</div>; // Or a proper skeleton loader
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
          <CanvasZone generatedFlow={generatedFlow} onNodeDropped={handleNodeDropped} />
        </div>

        {/* Panel Rendering Logic */}
        {!isMobile ? (
          <>
            {/* Desktop Layout */}
            {panelVisibility.palette && (
              <PalettePanel className="absolute top-4 left-4 z-10" onClose={() => togglePanel('palette')} />
            )}
            {panelVisibility.inspector && (
              <InspectorPanel className="absolute top-4 right-4 z-10 max-h-[calc(50vh-2rem)]" onClose={() => togglePanel('inspector')} />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex gap-4 z-10">
              {panelVisibility.timeline && (
                <TimelinePanel className="flex-1 min-w-[300px]" onClose={() => togglePanel('timeline')} />
              )}
              {panelVisibility.console && (
                <ConsolePanel className="flex-1 min-w-[300px]" onClose={() => togglePanel('console')} />
              )}
            </div>
            {panelVisibility.agentHub && (
              <AgentHubPanel className="absolute bottom-[calc(50%-(-1rem))] right-4 z-10 max-h-[calc(50vh-2.5rem)]" onClose={() => togglePanel('agentHub')} />
            )}
          </>
        ) : (
          <>
            {/* Mobile Overlay Panels */}
            <div className={`fixed inset-y-0 left-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.palette ? 'translate-x-0' : '-translate-x-full'}`}>
              {panelVisibility.palette && <PalettePanel className="h-full p-1" onClose={() => togglePanel('palette')} />}
            </div>

            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.inspector ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.inspector && <InspectorPanel className="h-full p-1" onClose={() => togglePanel('inspector')} />}
            </div>
            
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.agentHub ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.agentHub && <AgentHubPanel className="h-full p-1" onClose={() => togglePanel('agentHub')} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.timeline ? 'translate-y-0' : 'translate-y-full'} ${isMobile ? 'mb-14' : ''}`}>
              {panelVisibility.timeline && <TimelinePanel className="h-full p-1" onClose={() => togglePanel('timeline')} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.console ? 'translate-y-0' : 'translate-y-full'} ${isMobile ? 'mb-14' : ''}`}>
              {panelVisibility.console && <ConsolePanel className="h-full p-1" onClose={() => togglePanel('console')} />}
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
