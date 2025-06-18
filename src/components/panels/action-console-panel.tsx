
// src/components/panels/action-console-panel.tsx
'use client';

import { BasePanel } from './base-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ShieldQuestion, Bot, AlertTriangle, HelpCircle, MessageSquare, Check, X, Edit3, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsoleMessage } from '@/components/panels/console-panel';
import type { TimelineEvent } from '@/components/panels/timeline-panel';
import { Input } from '@/components/ui/input';
import React, {useState} from 'react';

// This interface should ideally be in a shared types file or src/app/page.tsx if used there too
export interface ActionRequest {
  id: string;
  agentId: string;
  agentName: string;
  requestType: 'permission' | 'input' | 'clarification';
  message: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied' | 'responded';
  // Optional properties for input type
  inputPrompt?: string; // e.g., "Please provide a filename:"
  requiresInput?: boolean;
}

interface ActionConsolePanelProps {
  className?: string;
  onClose?: () => void;
  requests: ActionRequest[];
  onRespond: (requestId: string, responseStatus: 'approved' | 'denied' | 'responded', details?: string) => void;
  isMobile?: boolean;
  addConsoleMessage: (type: ConsoleMessage['type'], text: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  isResizable?: boolean;
  initialSize?: {width?: string; height?: string};
}

const requestTypeIcons: Record<ActionRequest['requestType'], React.ReactNode> = {
  permission: <ShieldQuestion className="h-4 w-4 text-yellow-400 mr-2 shrink-0" />,
  input: <Edit3 className="h-4 w-4 text-blue-400 mr-2 shrink-0" />,
  clarification: <MessageSquare className="h-4 w-4 text-purple-400 mr-2 shrink-0" />,
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export function ActionConsolePanel({
  className,
  onClose,
  requests,
  onRespond,
  isMobile,
  addConsoleMessage, 
  addTimelineEvent,
  isResizable,
  initialSize,  
}: ActionConsolePanelProps) {
  const [inputValue, setInputValue] = useState<Record<string, string>>({});

  const handleInputChange = (requestId: string, value: string) => {
    setInputValue(prev => ({ ...prev, [requestId]: value }));
  };

  const handleSubmitInput = (request: ActionRequest) => {
    const details = inputValue[request.id] || '';
    if (request.requiresInput && !details.trim()) {
      addConsoleMessage('warn', `Input required for action request: ${request.id} from ${request.agentName}.`);
      // Potentially show a toast or inline error here
      return;
    }
    onRespond(request.id, 'responded', details);
    setInputValue(prev => {
      const newState = {...prev};
      delete newState[request.id];
      return newState;
    });
  };


  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <BasePanel
      title="Action Console"
      icon={<ShieldQuestion className="h-4 w-4" />}
      className={className}
      onClose={onClose}
      isMobile={isMobile}
      isResizable={isResizable}
      initialSize={initialSize}
      contentClassName="flex flex-col"
    >
      <ScrollArea className="flex-grow pr-1">
        {pendingRequests.length === 0 ? (
          <div className="text-xs text-center py-6 text-muted-foreground">
            <ShieldQuestion className="h-10 w-10 mx-auto mb-2 opacity-30" />
            No pending actions from agents.
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingRequests.map((req) => (
              <li key={req.id} className="text-xs p-3 rounded-lg bg-card/70 border border-border/40 shadow-sm">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center">
                    {requestTypeIcons[req.requestType] || <HelpCircle className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />}
                    <span className="font-semibold text-foreground/90">{req.agentName}</span>
                  </div>
                  <span className="text-muted-foreground text-[0.7rem]">{formatTime(req.timestamp)}</span>
                </div>
                <p className="text-muted-foreground/90 mb-2 text-[0.78rem] leading-snug ml-6">{req.message}</p>
                
                <div className="ml-6 space-y-2">
                  {(req.requestType === 'input' || req.requestType === 'clarification') && req.requiresInput && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder={req.inputPrompt || "Provide input..."}
                        value={inputValue[req.id] || ''}
                        onChange={(e) => handleInputChange(req.id, e.target.value)}
                        className="h-8 text-xs bg-input/70"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-2.5"
                        onClick={() => handleSubmitInput(req)}
                        disabled={!inputValue[req.id]?.trim()}
                      >
                        <SendHorizonal className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {req.requestType === 'permission' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-7 text-xs bg-green-600/80 hover:bg-green-500/80 text-white"
                          onClick={() => onRespond(req.id, 'approved')}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-7 text-xs"
                          onClick={() => onRespond(req.id, 'denied')}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Deny
                        </Button>
                      </>
                  )}
                   {req.requestType === 'clarification' && !req.requiresInput && ( 
                       <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleSubmitInput(req)} 
                      >
                        Respond
                      </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </BasePanel>
  );
}
