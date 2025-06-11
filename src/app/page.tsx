
// src/app/page.tsx
'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { CanvasZone } from '@/components/canvas/canvas-zone';
import { PalettePanel } from '@/components/panels/palette-panel';
import { InspectorPanel } from '@/components/panels/inspector-panel';
import { TimelinePanel } from '@/components/panels/timeline-panel';
import { ConsolePanel } from '@/components/panels/console-panel';
import { AgentHubPanel } from '@/components/panels/agent-hub-panel';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
// Button, PanelLeftOpen, PanelRightOpen, PanelBottomOpen, PanelTopOpen, EyeOff imports are no longer needed here

interface PanelVisibility {
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

  const handleFlowGenerated = (data: GenerateFlowFormState) => {
    setGeneratedFlow(data);
  };

  const togglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar onFlowGenerated={handleFlowGenerated} />
      <main className="flex-1 relative p-4 flex gap-4 overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 h-full">
          <CanvasZone generatedFlow={generatedFlow} />
        </div>

        {/* Floating Panels: Positioned using absolute classes within this relative main container */}
        
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

      </main>
      {/* Footer with panel toggle buttons has been removed for simplicity. Panels are closed via their own 'X' buttons. */}
    </div>
  );
}

// Comments related to the removed footer and old positioning logic are no longer relevant or have been addressed.
// The panel positioning is now:
// - Palette: Top-left.
// - Inspector: Top-right, max-height to share space.
// - AgentHub: Bottom-right, max-height to share space.
// - Timeline & Console: Bottom row, side-by-side, spanning most of the width.
// Overlap is possible if panels are sized to their maximum and content overflows, users can manage this by closing panels.
// A more robust draggable/resizable pane system would be a future enhancement for complex layouts.
    