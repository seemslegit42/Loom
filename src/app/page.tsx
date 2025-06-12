
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { CanvasZone } from '@/components/canvas/canvas-zone';
import { PalettePanel } from '@/components/panels/palette-panel';
import { InspectorPanel } from '@/components/panels/inspector-panel';
import { TimelinePanel } from '@/components/panels/timeline-panel';
import { ConsolePanel } from '@/components/panels/console-panel';
import { AgentHubPanel } from '@/components/panels/agent-hub-panel';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
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
    // On initial mobile load, or when switching to mobile, ensure panels are closed by default
    // but preserve desktop state if switching back from mobile.
    if (isMobile) {
      setPanelVisibility({
        palette: false,
        inspector: false,
        timeline: false,
        console: false,
        agentHub: false,
      });
    } else {
      // Optional: Restore previous desktop visibility or set a default
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
    setGeneratedFlow(data);
  };

  const togglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility(prev => {
      const newState = { ...prev };
      if (isMobile) {
        // On mobile, opening one panel closes others of a similar type (e.g. side vs bottom)
        // or simply ensures only one is open. For simplicity, this example closes all others.
        const currentlyOpening = !prev[panel];
        if (currentlyOpening) {
          newState.palette = false;
          newState.inspector = false;
          newState.timeline = false;
          newState.console = false;
          newState.agentHub = false;
        }
      }
      newState[panel] = !prev[panel];
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar
        onFlowGenerated={handleFlowGenerated}
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        isMobile={!!isMobile} // Pass boolean state of isMobile
      />
      <main className={`flex-1 relative flex overflow-hidden ${isMobile ? 'p-0' : 'p-4 gap-4'}`}>
        <div className={`flex-1 h-full transition-opacity duration-300 ${anyMobilePanelOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <CanvasZone generatedFlow={generatedFlow} />
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
              <AgentHubPanel className="absolute bottom-4 right-4 z-10 max-h-[calc(50vh-2rem)]" onClose={() => togglePanel('agentHub')} />
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
            
            {/* AgentHub: shown if inspector is not active */}
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${(panelVisibility.agentHub && !panelVisibility.inspector) ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.agentHub && <AgentHubPanel className="h-full p-1" onClose={() => togglePanel('agentHub')} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.timeline ? 'translate-y-0' : 'translate-y-full'}`}>
              {panelVisibility.timeline && <TimelinePanel className="h-full p-1" onClose={() => togglePanel('timeline')} />}
            </div>

            {/* Console: shown if timeline is not active */}
            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${(panelVisibility.console && !panelVisibility.timeline) ? 'translate-y-0' : 'translate-y-full'}`}>
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
    </div>
  );
}
