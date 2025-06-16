
// src/components/ai/ai-flow-generator-form.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import type { AiGeneratedFlowData, WorkflowNodeData } from '@/app/page'; // Using page types
import { generateNodeId } from '@/lib/utils';

interface AiFlowGeneratorFormProps {
  onFlowGenerated: (data: AiGeneratedFlowData) => void;
}

export function AiFlowGeneratorForm({ onFlowGenerated }: AiFlowGeneratorFormProps) {
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
    addConsoleMessage('info', `Attempting to generate flow from input: "${userInput.substring(0,50)}..." (simulation).`);
    
    // Simulate backend call and flow generation
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    let generatedData: AiGeneratedFlowData;

    if (Math.random() > 0.15) { // Simulate success
      const workflowName = `My AI Flow for "${userInput.substring(0, 20)}..."`;
      const nodes: WorkflowNodeData[] = [
        {
          id: generateNodeId('ai', workflowName, 0),
          title: `${workflowName} - Step 1 (Simulated)`,
          description: `This is the first simulated step based on your input: ${userInput}`,
          type: 'prompt',
          status: 'queued',
        },
        {
          id: generateNodeId('ai', workflowName, 1),
          title: `${workflowName} - Step 2 (Simulated)`,
          description: `This is a second simulated step. It might involve processing data.`,
          type: 'custom', // Example type
          status: 'queued',
        },
      ];
      generatedData = {
        message: "Flow generation simulated successfully!",
        workflowName: workflowName,
        nodes: nodes,
        error: false,
        userInput: userInput,
      };
      toast({
        title: "Flow Generated (Simulated)",
        description: generatedData.message,
      });
    } else { // Simulate failure
      generatedData = {
        message: "Simulated error: AI could not generate a flow from the provided input.",
        error: true,
        userInput: userInput,
        nodes: [],
      };
      toast({
        title: "Generation Failed (Simulated)",
        description: generatedData.message,
        variant: "destructive",
      });
    }
    
    onFlowGenerated(generatedData);
    setIsLoading(false);
    setUserInput(''); // Clear input after submission
  };
  
  // Helper function to add console messages - ideally this would come from context or props if needed globally
  const addConsoleMessage = (type: 'info' | 'log' | 'warn' | 'error', text: string) => {
    // This is a local stub. In a real app, this would interact with the main console state.
    console.log(`[CONSOLE-${type.toUpperCase()}] ${new Date().toLocaleTimeString()}: ${text}`);
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
          placeholder="Describe agent workflow (SuperAGI backend will process this)..."
          className="bg-input/80 backdrop-blur-sm border-border/70 focus:ring-ring"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" aria-disabled={isLoading} disabled={isLoading} size="sm">
        <Send className="mr-2 h-4 w-4" />
        {isLoading ? 'Generating...' : 'Generate Flow'}
      </Button>
    </form>
  );
}
