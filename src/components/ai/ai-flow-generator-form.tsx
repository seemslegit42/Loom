
// src/components/ai/ai-flow-generator-form.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import type { AiGeneratedFlowData, WorkflowNodeData } from '@/app/page'; 
import { generateNodeId } from '@/lib/utils';
import type { ConsoleMessage } from '@/components/panels/console-panel';


interface AiFlowGeneratorFormProps {
  onFlowGenerated: (data: AiGeneratedFlowData) => void;
  addConsoleMessage: (type: ConsoleMessage['type'], text: string) => void;
}

export function AiFlowGeneratorForm({ onFlowGenerated, addConsoleMessage }: AiFlowGeneratorFormProps) {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe the flow you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let finalOutput = "";
    let partialChunk = ""; // To store incomplete lines between chunks

    const logMarker = "[LOG]";
    const outputStartMarker = "[STREAMING_OUTPUT_START]";
    const errorMarker = "[ERROR]";
    let outputStarted = false;
    let apiErrorFound = "";

    try {
      addConsoleMessage('log', `[AI_FLOW_FORM] Calling API /api/loom/start for input: "${userInput.substring(0, 50)}..."`);
      const response = await fetch('/api/loom/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response from API." }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const decodedChunk = decoder.decode(value, { stream: true });
          const currentBuffer = partialChunk + decodedChunk;
          const lines = currentBuffer.split('\n');
          
          // The last line might be incomplete, so keep it for the next chunk
          partialChunk = lines.pop() || ""; 

          for (const line of lines) {
            if (line.startsWith(errorMarker)) {
              apiErrorFound = line.substring(errorMarker.length).trim();
              addConsoleMessage('error', `API Error: ${apiErrorFound}`);
              break; 
            }
            if (line.startsWith(outputStartMarker)) {
              outputStarted = true;
              addConsoleMessage('log', 'Backend AI stream started.');
              const contentAfterMarker = line.substring(outputStartMarker.length);
              if(contentAfterMarker.trim()) finalOutput += contentAfterMarker + '\n';
              continue; 
            }
            if (line.startsWith(logMarker) && !outputStarted) {
              const logMsg = line.substring(logMarker.length).trim();
              addConsoleMessage('log', `Backend: ${logMsg}`);
            } else if (outputStarted) {
              finalOutput += line + '\n';
            }
          }
          if (apiErrorFound) break;
        }
      }
      
      // Process any remaining partial chunk if it's the end of the stream
      if (partialChunk && outputStarted && !apiErrorFound) {
        finalOutput += partialChunk + '\n';
      } else if (partialChunk && partialChunk.startsWith(logMarker) && !outputStarted && !apiErrorFound) {
         const logMsg = partialChunk.substring(logMarker.length).trim();
         if (logMsg) addConsoleMessage('log', `Backend: ${logMsg}`);
      }


      if (apiErrorFound) {
        throw new Error(`API returned an error: ${apiErrorFound}`);
      }

      if (!finalOutput && !apiErrorFound) {
         addConsoleMessage('warn', "No actionable output received from the AI flow generation API.");
         // No longer throwing an error, allow empty flow generation if backend just sends logs.
      }

      const workflowName = `Flow for: ${userInput.substring(0, 30)}${userInput.length > 30 ? '...' : ''}`;
      const nodeTitle = `AI Generated Step for: ${userInput.substring(0, 20)}${userInput.length > 20 ? '...' : ''}`;

      const nodes: WorkflowNodeData[] = finalOutput.trim() ? [{ // Only create node if there's final output
        id: generateNodeId('ai', workflowName, 0),
        title: nodeTitle,
        description: `AI Generated Step: ${finalOutput.substring(0, 100)}${finalOutput.length > 100 ? "..." : ""}`,
        type: 'prompt', 
        status: 'queued',
        config: {
          promptText: finalOutput.trim(),
        },
        position: { x: 50, y: 100 }, 
      }] : [];

      const generatedData: AiGeneratedFlowData = {
        message: `Flow "${workflowName}" generation process completed. ${nodes.length > 0 ? 'Node created.' : 'No node created from output.'}`,
        workflowName: workflowName,
        nodes: nodes,
        error: false,
        userInput: userInput,
      };
      
      toast({
        title: "Flow Generation Complete",
        description: generatedData.message,
      });
      onFlowGenerated(generatedData);

    } catch (e: any) {
      console.error("[AI_FLOW_FORM] Error generating flow with API:", e);
      const errorMessage = e.message || "AI backend failed to generate a flow from the provided input.";
      addConsoleMessage('error', `Flow Generation Error: ${errorMessage}`);
      
      const generatedData: AiGeneratedFlowData = {
        message: errorMessage,
        error: true,
        userInput: userInput,
        nodes: [], 
      };

      toast({
        title: "AI Flow Generation Failed (Backend API)",
        description: errorMessage,
        variant: "destructive",
      });
      onFlowGenerated(generatedData);
    } finally {
      setIsLoading(false);
      setUserInput(''); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-grow">
        <Label htmlFor="userInput" className="sr-only">
          Describe the flow to generate
        </Label>
        <Input
          id="userInput"
          name="userInput"
          type="text"
          placeholder="Describe an agent workflow to generate with AI..."
          className="bg-input/80 backdrop-blur-sm border-border/70 focus:ring-ring"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" aria-disabled={isLoading} disabled={isLoading} size="sm">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" /> }
        {isLoading ? (
          'Generating...'
        ) : (
          <>
            <span className="hidden sm:inline">Generate Flow</span>
            <span className="sm:hidden">Generate</span>
          </>
        )}
      </Button>
    </form>
  );
}
