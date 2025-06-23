
// src/components/ai/webpage-summarizer-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Link, Search, FileText, AlertCircle } from 'lucide-react';
import type { ConsoleMessage } from '@/components/panels/console-panel';
import type { TimelineEvent } from '@/components/panels/timeline-panel';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SummarizeWebpageOutput {
  summary?: string;
  originalUrl: string;
  error?: string;
  logs?: string[];
}

interface WebpageSummarizerFormProps {
  addConsoleMessage: (type: ConsoleMessage['type'], text: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
}

export function WebpageSummarizerForm({ addConsoleMessage, addTimelineEvent }: WebpageSummarizerFormProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummarizeWebpageOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiLogs, setApiLogs] = useState<string[]>([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL.');
      addConsoleMessage('warn', 'Webpage Summarizer: URL input is empty.');
      return;
    }
     if (!(url.startsWith('http://') || url.startsWith('https://'))) {
      setError('Invalid URL. Please include http:// or https://');
      addConsoleMessage('warn', 'Webpage Summarizer: Invalid URL format.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    setApiLogs([]);

    const consoleLogPreamble = `Webpage Summarizer: Requesting summarization for URL: ${url} via backend API /api/loom/start.`;
    addConsoleMessage('log', consoleLogPreamble);
    addTimelineEvent({
      type: 'info',
      message: `Web Summarizer: Calling backend for URL: ${url.substring(0, 50)}...`,
    });

    let accumulatedResponse = "";
    const currentLogs: string[] = [];

    try {
      const response = await fetch('/api/loom/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'webSummarization',
          inputData: { url: url },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response from API." }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is empty from API /api/loom/start.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let finalOutputStarted = false;
      let finalSummary = "";
      let partialChunk = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          partialChunk += chunk;
          
          const lines = partialChunk.split('\n');
          partialChunk = lines.pop() || ""; 

          for (const line of lines) {
            if (line.startsWith("[LOG]")) {
              const logMsg = line.substring(5).trim();
              if(logMsg) currentLogs.push(logMsg);
            } else if (line.startsWith("[STREAMING_OUTPUT_START]")) {
              finalOutputStarted = true;
              const contentAfterMarker = line.substring("[STREAMING_OUTPUT_START]".length);
              if(contentAfterMarker.trim()) finalSummary += contentAfterMarker + '\n';
            } else if (line.startsWith("[ERROR]")) {
              const apiError = line.substring("[ERROR]".length).trim();
              throw new Error(`API returned an error in stream: ${apiError}`);
            } else if (finalOutputStarted) {
              finalSummary += line + '\n';
            }
          }
        }
      }
       if (partialChunk.trim()) {
          if (partialChunk.startsWith("[LOG]")) {
              const logMsg = partialChunk.substring(5).trim();
              if(logMsg) currentLogs.push(logMsg);
          } else if (partialChunk.startsWith("[STREAMING_OUTPUT_START]")) {
              finalOutputStarted = true;
              const contentAfterMarker = partialChunk.substring("[STREAMING_OUTPUT_START]".length);
              if(contentAfterMarker.trim()) finalSummary += contentAfterMarker + '\n';
          } else if (finalOutputStarted) {
              finalSummary += partialChunk + '\n';
          }
      }

      setApiLogs(currentLogs);
      currentLogs.forEach(log => addConsoleMessage('log', `Summarizer API Log: ${log}`));

      if (finalSummary.trim()) {
        const output: SummarizeWebpageOutput = { summary: finalSummary.trim(), originalUrl: url, logs: currentLogs };
        setResult(output);
        setError(null);
        addConsoleMessage('info', `Webpage Summarizer (via backend API): Successfully summarized ${url}.`);
        addTimelineEvent({ type: 'workflow_completed', message: `Web Summarizer (backend API) completed for ${url.substring(0,50)}...`});
      } else {
         throw new Error("No summary content received from the API, but no explicit error marker found in stream.");
      }

    } catch (e: any) {
      console.error("[WebpageSummarizerForm] Error:", e);
      setError(e.message || "An unexpected error occurred while summarizing the webpage via backend.");
      setResult(null);
      addConsoleMessage('error', `Webpage Summarizer (via backend API): Failed - ${e.message}`);
      addTimelineEvent({ type: 'workflow_failed', message: `Web Summarizer (backend API) failed: ${e.message.substring(0,100)}`});
       currentLogs.forEach(log => addConsoleMessage('log', `Summarizer API Log (on error): ${log}`));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="webpageUrl" className="text-xs flex items-center gap-1.5 mb-1">
            <Link className="h-3.5 w-3.5 text-primary/80" /> Webpage URL
          </Label>
          <Input
            id="webpageUrl"
            name="webpageUrl"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-input/70 backdrop-blur-sm border-border/70 focus:ring-ring"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !url.trim() || !(url.startsWith('http://') || url.startsWith('https://'))} className="w-full" size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Summarizing...' : 'Summarize Webpage via API'}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && result.summary && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary/90" />
            Summary for: <a href={result.originalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px] sm:max-w-[200px] md:max-w-[220px] inline-block" title={result.originalUrl}>{result.originalUrl}</a>
          </h4>
          <Textarea
            value={result.summary}
            readOnly
            rows={6}
            className="bg-input/50 backdrop-blur-sm border-input/50 focus:ring-ring text-xs"
          />
          {apiLogs.length > 0 && (
            <details className="text-xs mt-1">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View API Logs ({apiLogs.length})</summary>
              <ScrollArea className="h-24 mt-1 border rounded-md p-2 bg-black/20">
                {apiLogs.map((log, i) => <p key={i} className="whitespace-pre-wrap break-all">{log}</p>)}
              </ScrollArea>
            </details>
          )}
        </div>
      )}
       {result && !result.summary && result.error && ( // Handles case where API returns an error object without a summary
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Summarization Error</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
           {result.logs && result.logs.length > 0 && (
            <details className="text-xs mt-2">
              <summary className="cursor-pointer ">View API Logs ({result.logs.length})</summary>
              <ScrollArea className="h-20 mt-1 border rounded-md p-1.5 bg-destructive/10">
                {result.logs.map((log, i) => <p key={i} className="whitespace-pre-wrap break-all">{log}</p>)}
              </ScrollArea>
            </details>
          )}
        </Alert>
      )}

    </div>
  );
}
