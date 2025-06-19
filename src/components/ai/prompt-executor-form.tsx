
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
import { executePromptTask, type ExecutePromptInput, type ExecutePromptOutput } from '@/tasks/execute-prompt-task'; // Updated import

interface PromptExecutorFormProps {
  addConsoleMessage: (type: ConsoleMessage['type'], text: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
}

export function PromptExecutorForm({ addConsoleMessage, addTimelineEvent }: PromptExecutorFormProps) {
  const [promptText, setPromptText] = useState('');
  const [modelName, setModelName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecutePromptOutput | null>(null); // Using ExecutePromptOutput directly
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

    const consoleLog = `Prompt Executor: Executing prompt via backend API /api/loom/direct for: "${promptText.substring(0,50)}..." ${modelName ? `with model: ${modelName}` : ''}`;
    addConsoleMessage('log', consoleLog);
    addTimelineEvent({
      type: 'info',
      message: `Prompt Executor: Calling backend for prompt: "${promptText.substring(0,30)}..."`,
    });

    const taskInput: ExecutePromptInput = { promptText, modelName };
    const output = await executePromptTask(taskInput);

    if (output.error) {
      setError(output.error);
      setResult(null); // Ensure no prior result is shown
      addConsoleMessage('error', `Prompt Executor (backend API): Failed - ${output.error}`);
      addTimelineEvent({
        type: 'workflow_failed', // Or a more specific event type like 'llm_call_failed'
        message: `Prompt Executor (backend API) failed: ${output.error.substring(0,100)}...`,
      });
    } else {
      setResult(output);
      setError(null);
      addConsoleMessage('info', `Prompt Executor (backend API): Successfully processed prompt. Response length: ${output.responseText?.length || 0}`);
      addTimelineEvent({
        type: 'workflow_completed', // Or 'llm_call_succeeded'
        message: `Prompt Executor (backend API) completed.`,
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
            placeholder="Enter your prompt for the LLM..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            className="bg-input/70 backdrop-blur-sm border-border/70 focus:ring-ring"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="modelNameInput" className="text-xs flex items-center gap-1.5 mb-1">
            <Brain className="h-3.5 w-3.5 text-primary/80" /> Model Name (Optional)
          </Label>
          <Input
            id="modelNameInput"
            placeholder="e.g., mixtral-8x7b-32768 (Groq)"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="bg-input/70 backdrop-blur-sm border-border/70 focus:ring-ring"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">If empty, backend default is used.</p>
        </div>
        <Button type="submit" disabled={isLoading || !promptText.trim()} className="w-full" size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Executing...' : 'Execute Prompt via Backend'}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error (from Backend API)</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && result.responseText && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary/90" />
            LLM Response (from Backend API)
          </h4>
          <Textarea
            value={result.responseText}
            readOnly
            rows={5}
            className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-xs"
          />
        </div>
      )}
       {result && !result.responseText && result.error && ( // Should be caught by the 'error' state above, but as a fallback
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Execution Error (from Backend API)</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

    </div>
  );
}
