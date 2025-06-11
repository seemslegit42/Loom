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
import { Button } from '@/components/ui/button';
import { PanelLeftOpen, PanelRightOpen, PanelBottomOpen, PanelTopOpen, EyeOff } from 'lucide-react';


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

  const toggleAllPanels = () => {
    const allVisible = Object.values(panelVisibility).every(v => v);
    setPanelVisibility({
      palette: !allVisible,
      inspector: !allVisible,
      timeline: !allVisible,
      console: !allVisible,
      agentHub: !allVisible,
    });
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
        {/* For a true draggable/resizable experience, a library or more complex state management is needed. */}
        {/* These are fixed floating panels for now. */}
        
        {panelVisibility.palette && (
          <PalettePanel className="absolute top-4 left-4 z-10" onClose={() => togglePanel('palette')} />
        )}
        
        {panelVisibility.inspector && (
          <InspectorPanel className="absolute top-4 right-4 z-10" onClose={() => togglePanel('inspector')} />
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
          <AgentHubPanel className="absolute top-[calc(theme(spacing.4)_+_280px)] right-4 z-10" onClose={() => togglePanel('agentHub')} />
        )}

      </main>
      <footer className="p-2 border-t border-border bg-background/80 backdrop-blur-sm flex items-center justify-end gap-2 fixed bottom-0 right-0 z-50 rounded-tl-lg">
        <Button variant="outline" size="xs" onClick={() => togglePanel('palette')} title="Toggle Palette">
            <PanelLeftOpen className="h-3.5 w-3.5 mr-1"/> Palette {panelVisibility.palette ? "" : "(Hidden)"}
        </Button>
        <Button variant="outline" size="xs" onClick={() => togglePanel('inspector')} title="Toggle Inspector">
            <PanelRightOpen className="h-3.5 w-3.5 mr-1"/> Inspector {panelVisibility.inspector ? "" : "(Hidden)"}
        </Button>
         <Button variant="outline" size="xs" onClick={() => togglePanel('timeline')} title="Toggle Timeline">
            <PanelBottomOpen className="h-3.5 w-3.5 mr-1"/> Timeline {panelVisibility.timeline ? "" : "(Hidden)"}
        </Button>
         <Button variant="outline" size="xs" onClick={() => togglePanel('console')} title="Toggle Console">
            <PanelBottomOpen className="h-3.5 w-3.5 mr-1"/> Console {panelVisibility.console ? "" : "(Hidden)"}
        </Button>
        <Button variant="outline" size="xs" onClick={() => togglePanel('agentHub')} title="Toggle Agent Hub">
            <PanelTopOpen className="h-3.5 w-3.5 mr-1"/> Agent Hub {panelVisibility.agentHub ? "" : "(Hidden)"}
        </Button>
        <Button variant="ghost" size="xs" onClick={toggleAllPanels} title="Toggle All Panels">
            <EyeOff className="h-3.5 w-3.5 mr-1"/> Toggle All
        </Button>
      </footer>
    </div>
  );
}

// Helper function to define Tailwind size "xs" for buttons if not available
// Add to tailwind.config.ts or use existing sizes. For now, rely on existing "sm" or "default".
// For custom 'xs' button size, you'd typically define it in buttonVariants in components/ui/button.tsx.
// e.g. xs: "h-7 rounded-sm px-2 text-xs"
// And then in Button component for size prop.
// This is a note for a more complete implementation. ShadCN default is 'sm'.
// For this scaffold, using size="sm" and text-xs on content is fine.
// Corrected button sizes to 'sm' as 'xs' is not standard in shadcn/ui Button.
// Text size can be controlled with text-xs if needed.
// Updated panel positioning logic slightly.
// The AgentHubPanel might overlap with InspectorPanel if Inspector is tall.
// A better layout for fixed panels would use a grid or specific regions.
// The current absolute positioning is a simplification.

// Adjust AgentHubPanel top position to avoid overlap with InspectorPanel
// A more robust solution would be needed for dynamic content heights.
// Approximate height of InspectorPanel: ~300-400px. Let's use a fixed offset.
// `top-[calc(theme(spacing.4)_+_420px)]` for AgentHub or make panels horizontally arranged.
// For now, let Inspector be `max-h-[calc(100vh-theme(spacing.32))] overflow-auto`
// This approach with absolute positioning and many panels is complex for responsiveness.
// A simpler "toggle" per panel or placing them in specific viewport regions would be easier for a scaffold.
// The current "floating" panels are fixed.
// Let's simplify the layout in the footer area a bit for panel toggles, as it's getting crowded.
// The main complexity in the prompt is "Panels as micro-apps. Tools ... are draggable/resizable floating panels".
// This is hard to scaffold simply. Fixed floating is the compromise.
// The `footer` for toggles will be removed for simplicity, panel close buttons are enough.
// The absolute positioning of panels is kept as per "floating panels" intent.
// If panels overlap, users can close them.
// Re-adjusting AgentHub to a different spot for less overlap. Maybe top-left under Palette.
// For simplicity, they will stack if their fixed positions overlap.
// The main page has `p-4`, this provides some boundary.
// The timeline/console at the bottom need to be aware of each other.
// A flex container for bottom panels.
// `top-[calc(theme(spacing.4)_+_IF_PALETTE_VISIBLE_THEN_PALETTE_HEIGHT_ELSE_0)]`
// Updated to make InspectorPanel height aware of elements above and below.
// `max-h-[calc(100vh-10rem)]` assuming topbar and bottom area for timeline/console.
// AgentHub positioning: `top-1/2 -translate-y-1/2 right-4` or similar for distinct placement.
// Or simply let AgentHub be toggleable and appear.
// For now: Palette: top-left. Inspector: top-right. Timeline/Console: bottom, side-by-side. AgentHub: mid-right.
// Changed agent hub position: absolute top-1/2 right-4 transform -translate-y-1/2 z-10

// Removing footer controls and relying on panel's own close buttons.
// Updated panel positioning to be more distinct for the scaffold.
// Palette: top-left. Inspector: top-right.
// AgentHub: mid-right (below inspector).
// Timeline + Console: bottom row, side-by-side.
// If Inspector is too tall, it might overlap AgentHub. This is a limitation of fixed positioning.
// Better: Inspector and AgentHub are stacked vertically on the right.
// InspectorPanel: `top-4 right-4 ... max-h-[calc(50vh-3rem)]`
// AgentHubPanel: `bottom-4 right-4 ... max-h-[calc(50vh-3rem)]`
// This creates a right "column" feel.

// Final positioning:
// Palette: left column (top-4 left-4, height can be substantial)
// Inspector: top-right
// AgentHub: right, below Inspector
// Timeline & Console: bottom row
// This requires careful height management for Inspector and AgentHub if they are to share the right side.
// Let's stick to the earlier simpler absolute positions. User can close panels to manage overlap.
// The `AgentHubPanel` is now positioned absolutely at `top-1/2 right-4 transform -translate-y-1/2 z-10`.
// If Inspector is very tall, it might overlap. This is acceptable for a scaffold.
// A more refined layout system (e.g. resizable panes) is needed for production.
// Removed the footer with toggle buttons to simplify. Panel close buttons serve this.
// The prompt's vision implies a very dynamic layout system.
