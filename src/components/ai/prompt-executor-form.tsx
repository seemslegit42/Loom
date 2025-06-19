
// src/components/ai/prompt-executor-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Send, FileText, AlertCircle, Brain } from 'lucide-react';
import type { ConsoleMessage } from '@/components/panels/console-panel';
import type { TimelineEvent } from '@/components/panels/timeline-panel';
import type { BackendExecutePromptOutput } from '@/app/page';

interface PromptExecutorFormProps {
  addConsoleMessage: (type: ConsoleMessage['type'], text: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
}

export function PromptExecutorForm({ addConsoleMessage, addTimelineEvent }: PromptExecutorFormProps) {
  const [promptText, setPromptText] = useState('');
  const [modelName, setModelName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BackendExecutePromptOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!promptText.trim()) {
      setError('Please enter a prompt.');
      addConsoleMessage('warn', 'Prompt Executor: Prompt text is empty.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    const consoleLog = `Prompt Executor: Executing prompt via backend LLM for: "${promptText.substring(0,50)}..." ${modelName ? `with model/agent ID: ${modelName}` : ''}`;
    addConsoleMessage('log', consoleLog);
    addTimelineEvent({
      type: 'info',
      message: `Agent 'Prompt Executor' (via backend) started for prompt: "${promptText.substring(0,30)}..."`,
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    let output: BackendExecutePromptOutput;

    if (Math.random() > 0.2) { // Simulate success
      output = {
        responseText: `This is a simulated LLM response (from backend) to: "${promptText}". Model/Agent ID specified: ${modelName || 'default/not specified'}. The actual response would come from the configured backend LLM or agent.`,
      };
      setResult(output);
      setError(null);
      addConsoleMessage('info', `Prompt Executor (backend): Successfully processed prompt.`);
      addTimelineEvent({
        type: 'workflow_completed',
        message: `Agent 'Prompt Executor' (via backend) completed.`,
      });
    } else { // Simulate error
      const errorMessage = "Simulated API Error: The backend LLM or agent could not process the prompt. This could be due to various reasons like invalid input, model overload, or content policy violations.";
      output = {
        error: errorMessage,
      };
      setResult(output);
      setError(errorMessage);
      addConsoleMessage('error', `Prompt Executor (backend): Failed - ${errorMessage}`);
      addTimelineEvent({
        type: 'workflow_failed',
        message: `Agent 'Prompt Executor' (via backend) failed: ${errorMessage.substring(0,100)}...`,
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="promptTextInput" className="text-xs flex items-center gap-1.5 mb-1">
            <Send className="h-3.5 w-3.5 text-primary/80" /> Prompt
          </Label>
          <Textarea
            id="promptTextInput"
            placeholder="Enter your prompt for the LLM or backend agent..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            className="bg-input/70 backdrop-blur-sm border-border/70 focus:ring-ring"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="modelNameInput" className="text-xs flex items-center gap-1.5 mb-1">
            <Brain className="h-3.5 w-3.5 text-primary/80" /> Model / Agent ID (Optional)
          </Label>
          <Input
            id="modelNameInput"
            placeholder="e.g., gemini-pro, specific_agent_id"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="bg-input/70 backdrop-blur-sm border-border/70 focus:ring-ring"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">The backend will interpret this.</p>
        </div>
        <Button type="submit" disabled={isLoading || !promptText.trim()} className="w-full" size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Executing...' : 'Execute Prompt'}
        </Button>
      </form>

      {error && (!result || !result.responseText) && (
        <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error (from Backend)</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && result.responseText && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary/90" />
            LLM Response (from Backend)
          </h4>
          <Textarea
            value={result.responseText}
            readOnly
            rows={5}
            className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-xs"
          />
        </div>
      )}
       {result && !result.responseText && result.error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Execution Error (from Backend)</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

    </div>
  );
}

