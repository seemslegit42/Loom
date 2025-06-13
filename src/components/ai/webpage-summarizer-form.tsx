
// src/components/ai/webpage-summarizer-form.tsx
'use client';

import { useState } from 'react';
import { summarizeWebpage, type SummarizeWebpageOutput } from '@/ai/flows/summarize-webpage-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Link, Search, FileText, AlertCircle } from 'lucide-react';
import type { ConsoleMessage } from '@/components/panels/console-panel';
import type { TimelineEvent } from '@/components/panels/timeline-panel';

interface WebpageSummarizerFormProps {
  addConsoleMessage: (type: ConsoleMessage['type'], text: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
}

export function WebpageSummarizerForm({ addConsoleMessage, addTimelineEvent }: WebpageSummarizerFormProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummarizeWebpageOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url) {
      setError('Please enter a URL.');
      addConsoleMessage('warn', 'Webpage Summarizer: URL input is empty.');
      return;
    }

    setIsLoading(true);
    setResult(null); // Clear previous results
    setError(null);   // Clear previous errors

    addConsoleMessage('log', `Webpage Summarizer: Attempting to summarize URL: ${url}`);
    addTimelineEvent({
      type: 'info', 
      message: `Agent 'Webpage Summarizer' started for URL: ${url.substring(0, 50)}...`,
    });

    try {
      const output = await summarizeWebpage({ url });
      setResult(output); 

      if (output.error) {
        setError(output.error);
        addConsoleMessage('error', `Webpage Summarizer: Failed - ${output.error}`);
        addTimelineEvent({
          type: 'workflow_failed', 
          message: `Agent 'Webpage Summarizer' failed: ${output.error.substring(0,100)}`,
        });
      } else if (!output.summary) {
        const fallbackError = 'No summary could be generated. The page might be empty, not summarizable, or the AI chose not to summarize.';
        setError(fallbackError);
        addConsoleMessage('warn', `Webpage Summarizer: No summary for ${url}. ${fallbackError}`);
         addTimelineEvent({
          type: 'info',
          message: `Agent 'Webpage Summarizer': No summary for ${url.substring(0,50)}...`,
        });
      } else {
        setError(null); 
        addConsoleMessage('info', `Webpage Summarizer: Successfully summarized ${url}.`);
        addTimelineEvent({
          type: 'workflow_completed',
          message: `Agent 'Webpage Summarizer' completed for ${url.substring(0,50)}...`,
        });
      }
    } catch (e: any) { 
      const errorMessage = e.message || 'An unexpected error occurred while trying to summarize the webpage.';
      setError(errorMessage);
      setResult(null); 
      addConsoleMessage('error', `Webpage Summarizer: Exception - ${errorMessage}`);
      addTimelineEvent({
        type: 'workflow_failed',
        message: `Agent 'Webpage Summarizer' encountered an exception: ${errorMessage.substring(0,100)}`,
      });
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
        <Button type="submit" disabled={isLoading || !url} className="w-full" size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Summarizing...' : 'Summarize Webpage'}
        </Button>
      </form>

      {error && (!result || !result.summary) && (
        <Alert variant="destructive">
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
        </div>
      )}
      
    </div>
  );
}
