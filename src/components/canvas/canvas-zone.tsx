// src/components/canvas/canvas-zone.tsx
import { WorkflowNode } from '@/components/workflow/workflow-node';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit } from 'lucide-react'; // Changed from PackagePlus

interface CanvasZoneProps {
  generatedFlow: GenerateFlowFormState | null;
}

export function CanvasZone({ generatedFlow }: CanvasZoneProps) {
  return (
    <ScrollArea className="h-full w-full rounded-lg border border-dashed border-border/50 grid-background">
      <div className="p-8 min-h-full">
        {generatedFlow && generatedFlow.promptSequence && generatedFlow.promptSequence.length > 0 ? (
          <>
            {generatedFlow.workflowDescription && (
              <div className="mb-8 p-4 bg-card/80 rounded-lg shadow backdrop-blur-md">
                <h2 className="text-xl font-headline mb-2 text-primary">Generated Workflow: {generatedFlow.userInput || "Custom Flow"}</h2>
                <p className="text-muted-foreground">{generatedFlow.workflowDescription}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-6">
              {generatedFlow.promptSequence.map((prompt, index) => (
                <WorkflowNode
                  key={index}
                  title={`Step ${index + 1}`}
                  description={prompt}
                  type="prompt" // Example type, could be dynamic
                  status={index === 0 ? 'running' : 'queued'}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
            <BrainCircuit className="h-16 w-16 mb-4 text-primary/50" />
            <h2 className="text-2xl font-headline mb-2">Agent Orchestration Canvas</h2>
            <p className="max-w-md">
              Visually build and manage your AI agents here.
              Generate a flow using the input above, or drag components from the Palette to start.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
