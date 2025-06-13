
// src/components/ai/ai-flow-generator-form.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { handleGenerateFlow, type GenerateFlowFormState } from '@/lib/actions/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface AiFlowGeneratorFormProps {
  onFlowGenerated: (data: GenerateFlowFormState) => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending} disabled={pending} size="sm">
      <Send className="mr-2 h-4 w-4" />
      {pending ? 'Generating...' : 'Generate Flow'}
    </Button>
  );
}

export function AiFlowGeneratorForm({ onFlowGenerated }: AiFlowGeneratorFormProps) {
  const initialState: GenerateFlowFormState = { message: null, error: false };
  const [state, formAction] = useFormState(handleGenerateFlow, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.error) {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: state.message,
        });
        if (state.workflowName && state.nodes && state.nodes.length > 0) {
          onFlowGenerated(state);
        } else if (state.workflowName === '' && state.nodes?.length === 0 && !state.error) {
          // Handle case where AI might return an empty flow successfully (e.g. if input is too vague)
           onFlowGenerated(state);
        }
      }
    }
  }, [state, toast, onFlowGenerated]);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-grow">
        <Label htmlFor="userInput" className="sr-only">
          Describe the flow to generate
        </Label>
        <Input
          id="userInput"
          name="userInput"
          type="text"
          placeholder="Describe the agent workflow or task you want to create..."
          className="bg-input/80 backdrop-blur-sm border-border/70 focus:ring-ring"
          defaultValue={state.userInput}
        />
      </div>
      <SubmitButton />
    </form>
  );
}

