
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { BottomBar } from '@/components/layout/bottom-bar';
import { CanvasZone } from '@/components/canvas/canvas-zone';
import { PalettePanel } from '@/components/panels/palette-panel';
import { InspectorPanel } from '@/components/panels/inspector-panel';
import { TimelinePanel, type TimelineEvent } from '@/components/panels/timeline-panel';
import { ConsolePanel, type ConsoleMessage } from '@/components/panels/console-panel';
import { AgentHubPanel } from '@/components/panels/agent-hub-panel';
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import type { WorkflowNodeData, NodeStatus } from '@/components/workflow/workflow-node';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { generateNodeId } from '@/lib/utils';
import { AlertCircle, Globe } from 'lucide-react';
import { summarizeWebpage, type SummarizeWebpageOutput } from '@/ai/flows/summarize-webpage-flow';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';


export interface PanelVisibility {
  palette: boolean;
  inspector: boolean;
  timeline: boolean;
  console: boolean;
  agentHub: boolean;
}

export default function LoomStudioPage() {
  const [generatedFlow, setGeneratedFlow] = useState<GenerateFlowFormState | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    palette: true,
    inspector: true,
    timeline: true,
    console: true,
    agentHub: true,
  });
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, NodeStatus>>({});
  const [consoleFilters, setConsoleFilters] = useState<Record<ConsoleMessage['type'], boolean>>({
    info: true,
    log: true,
    warn: true,
    error: true,
  });

  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Load console messages from Firestore on mount
  useEffect(() => {
    const fetchConsoleMessages = async () => {
      try {
        const messagesCol = collection(db, 'console_logs');
        const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedMessages: ConsoleMessage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedMessages.push({
            type: data.type as ConsoleMessage['type'],
            text: data.text,
            timestamp: (data.timestamp as Timestamp).toDate(),
          });
        });
        setConsoleMessages(fetchedMessages.reverse()); // Reverse to show oldest first
      } catch (error) {
        console.error("Error fetching console messages from Firestore:", error);
        setConsoleMessages(prev => [...prev, {type: 'error', text: 'Failed to load console history from Firestore.', timestamp: new Date()}]);
      }
    };

    fetchConsoleMessages();
  }, []);


  const addConsoleMessage = async (type: ConsoleMessage['type'], text: string) => {
    const newMessage: ConsoleMessage = { type, text, timestamp: new Date() };
    // Update local state immediately for responsiveness, prepending new messages
    setConsoleMessages(prev => [newMessage, ...prev.slice(0, 199)]); // Keep up to 200 local messages

    try {
      await addDoc(collection(db, 'console_logs'), {
        type: newMessage.type,
        text: newMessage.text,
        timestamp: Timestamp.fromDate(newMessage.timestamp), 
      });
    } catch (error) {
      console.error("Error adding console message to Firestore:", error);
      // Add an error message to the local console state if Firestore write fails
      setConsoleMessages(prev => [{type: 'error', text: 'Failed to save message to cloud console.', timestamp: new Date()}, ...prev]);
    }
  };


  const handleClearConsole = () => {
    setConsoleMessages([]); // Clear local console messages
    addConsoleMessage('info', 'Local console view cleared. Firestore logs are not affected by this action.');
    toast({
        title: "Console Cleared",
        description: "Local console messages have been cleared.",
    });
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setTimelineEvents(prev => [{ ...event, id: crypto.randomUUID(), timestamp: new Date() }, ...prev.slice(0, 49)]); // Prepend new events
  };

  useEffect(() => {
    if (isMobile === undefined) return;
    if (isMobile) {
      setPanelVisibility({
        palette: false,
        inspector: false,
        timeline: false,
        console: false,
        agentHub: false,
      });
    } else {
      setPanelVisibility({
        palette: true,
        inspector: true,
        timeline: true,
        console: true,
        agentHub: true,
      });
    }
  }, [isMobile]);


  const simulateFlowExecution = (nodes: WorkflowNodeData[]) => {
    if (!nodes || nodes.length === 0 || !generatedFlow?.workflowName) return;

    const workflowName = generatedFlow.workflowName;
    let currentStatuses: Record<string, NodeStatus> = {};

    const initialExecutionStatus = { ...nodeExecutionStatus };
    nodes.forEach(node => {
      initialExecutionStatus[node.id] = node.status || 'queued';
    });
    setNodeExecutionStatus(initialExecutionStatus);

    setTimelineEvents([]); 
    let currentDelay = 0;
    let maxDelay = 0;

    addConsoleMessage('info', `Simulating AI-generated workflow: "${workflowName}".`);
    addTimelineEvent({
      type: 'workflow_start',
      message: `Workflow "${workflowName}" AI simulation started.`,
    });

    nodes.forEach((node) => {
      const nodeId = node.id;
      const nodeTitle = node.title;

      currentDelay += 500; 
      setTimeout(() => {
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) AI simulation queued.`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_queued', message: `Node "${nodeTitle}" AI simulation queued.` });
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'queued' }));
        currentStatuses[nodeId] = 'queued';
      }, currentDelay);

      currentDelay += 1000; 
      setTimeout(() => {
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) AI simulation running.`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_running', message: `Node "${nodeTitle}" AI simulation running.` });
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
        currentStatuses[nodeId] = 'running';
      }, currentDelay);

      currentDelay += 1500 + Math.random() * 1000; 
      setTimeout(() => {
        const success = Math.random() > 0.1; 
        if (success) {
          addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) AI simulation completed.`);
          addTimelineEvent({ nodeId, nodeTitle, type: 'node_completed', message: `Node "${nodeTitle}" AI simulation completed.` });
          setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'completed' }));
          currentStatuses[nodeId] = 'completed';
        } else {
          addConsoleMessage('error', `Node "${nodeTitle}" (ID: ${nodeId}) AI simulation failed.`);
          addTimelineEvent({ nodeId, nodeTitle, type: 'node_failed', message: `Node "${nodeTitle}" AI simulation failed.` });
          setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'failed' }));
          currentStatuses[nodeId] = 'failed';
        }
      }, currentDelay);
      if (currentDelay > maxDelay) maxDelay = currentDelay;
    });

    setTimeout(() => {
        const workflowFailed = Object.values(currentStatuses).some(s => s === 'failed');
        if (workflowFailed) {
            addConsoleMessage('error', `Workflow "${workflowName}" AI simulation finished with errors.`);
            addTimelineEvent({ type: 'workflow_failed', message: `Workflow "${workflowName}" AI simulation finished with errors.`});
        } else {
            addConsoleMessage('info', `Workflow "${workflowName}" AI simulation completed successfully.`);
            addTimelineEvent({ type: 'workflow_completed', message: `Workflow "${workflowName}" AI simulation completed successfully.`});
        }
    }, maxDelay + 500); 
  };


  const handleFlowGenerated = (data: GenerateFlowFormState) => {
    setGeneratedFlow(data);
    setSelectedNode(null); 

    if (data.error) {
      addConsoleMessage('error', `Failed to generate flow: ${data.message}`);
      setTimelineEvents([]); 
      setNodeExecutionStatus({}); 
    } else {
      if (data.nodes && data.nodes.length > 0 && data.workflowName) {
        addConsoleMessage('info', `Flow "${data.workflowName}" generated by AI with ${data.nodes.length} steps. Starting AI simulation...`);
        const initialStatuses: Record<string, NodeStatus> = {};
        data.nodes.forEach(node => {
          initialStatuses[node.id] = node.status || 'queued'; 
        });
        setNodeExecutionStatus(initialStatuses);
        simulateFlowExecution(data.nodes);
      } else {
         addConsoleMessage('info', `Flow "${data.workflowName || 'Untitled Flow'}" generated by AI but contained no actionable steps.`);
         setTimelineEvents([]); 
         setNodeExecutionStatus({}); 
      }
    }
  };

  const handleNodeDropped = (newNodeData: Omit<WorkflowNodeData, 'id' | 'status'> & { status?: NodeStatus }) => {
    const uniqueIndex = Date.now(); 
    const nodeTitleBase = newNodeData.title || 'Manual Node'; 
    const nodeId = generateNodeId('manual', nodeTitleBase, uniqueIndex);

    const nodeWithIdAndStatus: WorkflowNodeData = {
      ...newNodeData,
      id: nodeId,
      title: nodeTitleBase, 
      description: newNodeData.description || `Manually added ${nodeTitleBase} node. Configure in Inspector.`,
      status: newNodeData.status || 'queued', 
      config: newNodeData.config || {}, 
    };

    setGeneratedFlow(prevFlow => {
      const currentNodes = prevFlow?.nodes || [];
      const isFirstNodeForNewWorkflow = !prevFlow || currentNodes.length === 0;
      const newWorkflowName = prevFlow?.workflowName || "My Custom Flow";

      if (isFirstNodeForNewWorkflow && !prevFlow?.workflowName) { // Only log if truly starting a NEW flow
        addConsoleMessage('info', `New custom workflow "${newWorkflowName}" started by user adding node: "${nodeWithIdAndStatus.title}".`);
        addTimelineEvent({ type: 'workflow_start', message: `Custom workflow "${newWorkflowName}" started.`});
      }

      return {
        ...(prevFlow || { message: "Node added to canvas.", userInput: "Custom flow", error: false }), 
        nodes: [...currentNodes, nodeWithIdAndStatus],
        workflowName: newWorkflowName, 
      };
    });

    setSelectedNode(nodeWithIdAndStatus); 
    addConsoleMessage('log', `Node "${nodeWithIdAndStatus.title}" (ID: ${nodeWithIdAndStatus.id}) added to canvas.`);
    setNodeExecutionStatus(prev => ({...prev, [nodeWithIdAndStatus.id]: nodeWithIdAndStatus.status! }));
    addTimelineEvent({ 
      nodeId: nodeWithIdAndStatus.id,
      nodeTitle: nodeWithIdAndStatus.title,
      type: 'node_queued', 
      message: `Manual Node "${nodeWithIdAndStatus.title}" added and queued.`
    });
  };


  const handleNodeSelected = (node: WorkflowNodeData | null) => {
    setSelectedNode(node);
    if (node) {
      addConsoleMessage('log', `Node "${node.title}" (ID: ${node.id}) selected.`);
    } else {
      addConsoleMessage('log', `Canvas selected (no node).`);
    }
  };

  const handleNodeUpdate = (updatedNode: WorkflowNodeData) => {
     setGeneratedFlow(prevFlow => {
      if (!prevFlow || !prevFlow.nodes) return prevFlow; 
      const newNodes = prevFlow.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n));
      return { ...prevFlow, nodes: newNodes };
    });

    setSelectedNode(updatedNode); 

    toast({
      title: "Node Updated",
      description: `Node "${updatedNode.title}" has been saved.`,
    });
    addConsoleMessage('info', `Node "${updatedNode.title}" (ID: ${updatedNode.id}) updated.`);

    const oldStatus = nodeExecutionStatus[updatedNode.id];
    if (updatedNode.status && oldStatus !== updatedNode.status) {
      setNodeExecutionStatus(prev => ({...prev, [updatedNode.id]: updatedNode.status! }));

      let eventType: TimelineEvent['type'] = 'info'; 
      switch(updatedNode.status) {
        case 'completed': eventType = 'node_completed'; break;
        case 'running': eventType = 'node_running'; break;
        case 'failed': eventType = 'node_failed'; break;
        case 'queued': eventType = 'node_queued'; break;
        default: eventType = 'info'; break; 
      }

      addTimelineEvent({
        nodeId: updatedNode.id,
        nodeTitle: updatedNode.title,
        type: eventType,
        message: `Node "${updatedNode.title}" status manually updated to ${updatedNode.status}.`
      });
    }
  };

  const handleRunNode = async (nodeId: string) => {
    const nodeToRun = generatedFlow?.nodes?.find(n => n.id === nodeId);

    if (!nodeToRun) {
      addConsoleMessage('error', `Attempted to run non-existent node ID: ${nodeId}`);
      return;
    }

    if (nodeToRun.type === 'web-summarizer') {
      const url = nodeToRun.config?.url;
      if (!url) {
        toast({ title: "Missing Configuration", description: "Please provide a URL for the Web Summarizer node.", variant: "destructive" });
        addConsoleMessage('warn', `Node "${nodeToRun.title}" (Web Summarizer) cannot run: URL is missing.`);
        return;
      }

      addConsoleMessage('info', `Node "${nodeToRun.title}" (ID: ${nodeId}) execution started for URL: ${url}`);
      addTimelineEvent({ nodeId, nodeTitle: nodeToRun.title, type: 'node_running', message: `Executing: Summarize ${url}` });
      setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
      if (selectedNode?.id === nodeId) setSelectedNode(prev => prev ? {...prev, status: 'running'} : null);


      try {
        const result = await summarizeWebpage({ url });

        const updatedNodeData: WorkflowNodeData = {
          ...nodeToRun,
          config: { ...nodeToRun.config, output: result }, 
          status: result.error ? 'failed' : 'completed',
        };

        setGeneratedFlow(prevFlow => ({
          ...(prevFlow!), 
          nodes: prevFlow!.nodes.map(n => n.id === nodeId ? updatedNodeData : n),
        }));
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: updatedNodeData.status! }));
        if (selectedNode?.id === nodeId) setSelectedNode(updatedNodeData); 

        if (result.error) {
          addConsoleMessage('error', `Node "${updatedNodeData.title}" (Web Summarizer) failed: ${result.error}`);
          addTimelineEvent({ nodeId, nodeTitle: updatedNodeData.title, type: 'node_failed', message: `Failed: ${result.error.substring(0,100)}...` });
          toast({ title: "Node Execution Failed", description: `Web Summarizer: ${result.error}`, variant: "destructive" });
        } else {
          addConsoleMessage('info', `Node "${updatedNodeData.title}" (Web Summarizer) completed. Summary generated.`);
          addTimelineEvent({ nodeId, nodeTitle: updatedNodeData.title, type: 'node_completed', message: 'Summary generated successfully.' });
          toast({ title: "Node Executed", description: "Web Summarizer completed." });
        }
      } catch (e: any) {
        const errorMessage = e.message || "An unexpected error occurred during node execution.";
         const updatedNodeData: WorkflowNodeData = {
          ...nodeToRun,
          config: { ...nodeToRun.config, output: { summary: '', originalUrl: url, error: errorMessage } }, 
          status: 'failed',
        };
        setGeneratedFlow(prevFlow => ({
          ...(prevFlow!),
          nodes: prevFlow!.nodes.map(n => n.id === nodeId ? updatedNodeData : n),
        }));
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'failed' }));
        if (selectedNode?.id === nodeId) setSelectedNode(updatedNodeData);

        addConsoleMessage('error', `Node "${nodeToRun.title}" (Web Summarizer) crashed: ${errorMessage}`);
        addTimelineEvent({ nodeId, nodeTitle: nodeToRun.title, type: 'node_failed', message: `Execution crashed: ${errorMessage.substring(0,100)}...` });
        toast({ title: "Node Execution Crashed", description: errorMessage, variant: "destructive" });
      }
    } else {
      addConsoleMessage('warn', `Node type "${nodeToRun.type}" is not runnable yet.`);
      toast({ title: "Not Implemented", description: `Running node type "${nodeToRun.type}" is not yet implemented.`, variant: "secondary"});
    }
  };


  const isNodeRunning = (nodeId: string): boolean => {
    return nodeExecutionStatus[nodeId] === 'running';
  };


  const togglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility(prev => {
      const newState = { ...prev };
      const currentlyOpening = !prev[panel]; 

      if (isMobile) {
        if (currentlyOpening) {
          (Object.keys(newState) as Array<keyof PanelVisibility>).forEach(key => {
            if (key !== panel) {
              newState[key] = false;
            }
          });
          newState[panel] = true; 
        } else {
          newState[panel] = false;
        }
      } else {
        newState[panel] = !prev[panel];
      }
      return newState;
    });
  };


  const closeAllMobilePanels = () => {
    if (isMobile) {
      setPanelVisibility({
        palette: false,
        inspector: false,
        timeline: false,
        console: false,
        agentHub: false,
      });
    }
  };

  const toggleConsoleFilter = (type: ConsoleMessage['type']) => {
    const newFilterState = !consoleFilters[type];
    setConsoleFilters(prev => ({ ...prev, [type]: newFilterState }));
    addConsoleMessage('log', `Console filter for "${type.toUpperCase()}" messages ${newFilterState ? 'enabled' : 'disabled'}.`);
  };

  const anyMobilePanelOpen = isMobile && Object.values(panelVisibility).some(v => v);

  if (isMobile === undefined) { 
    return <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center text-lg">Loading UI...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar
        onFlowGenerated={handleFlowGenerated}
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        isMobile={isMobile}
        anyMobilePanelOpen={anyMobilePanelOpen}
      />
      <main className={`flex-1 relative flex overflow-hidden ${isMobile ? 'p-0' : 'p-4 gap-4'} ${isMobile ? 'pb-16' : ''}`}>
        <div className={`flex-1 h-full transition-opacity duration-300 ${anyMobilePanelOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <CanvasZone
            workflowName={generatedFlow?.workflowName}
            nodes={generatedFlow?.nodes || []}
            onNodeDropped={handleNodeDropped}
            selectedNode={selectedNode}
            onNodeSelected={handleNodeSelected}
            nodeExecutionStatus={nodeExecutionStatus}
          />
        </div>

        {!isMobile ? (
          <>
            {panelVisibility.palette && (
              <PalettePanel className="absolute top-4 left-4 z-10" onClose={() => togglePanel('palette')} isMobile={isMobile} />
            )}
            {panelVisibility.inspector && (
              <InspectorPanel
                key={selectedNode ? `inspector-desktop-${selectedNode.id}` : 'inspector-desktop-no-node'} 
                className="absolute top-4 right-4 z-10 max-h-[calc(100vh_-_theme(spacing.16)_-_theme(spacing.8))]" 
                onClose={() => togglePanel('inspector')}
                selectedNode={selectedNode}
                onNodeUpdate={handleNodeUpdate}
                isMobile={isMobile}
                onRunNode={handleRunNode}
                isNodeRunning={isNodeRunning}
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex gap-4 z-10">
              {panelVisibility.timeline && (
                <TimelinePanel
                  className="flex-1 min-w-[300px]"
                  onClose={() => togglePanel('timeline')}
                  events={timelineEvents}
                  isMobile={isMobile}
                />
              )}
              {panelVisibility.console && (
                <ConsolePanel
                  className="flex-1 min-w-[300px]"
                  onClose={() => togglePanel('console')}
                  messages={consoleMessages.filter(msg => consoleFilters[msg.type])}
                  filters={consoleFilters}
                  onToggleFilter={toggleConsoleFilter}
                  onClearConsole={handleClearConsole}
                  isMobile={isMobile}
                />
              )}
            </div>
            {panelVisibility.agentHub && (
              <AgentHubPanel
                className="absolute bottom-[calc(250px+2rem)] right-4 z-10 max-h-[calc(100vh_-_theme(spacing.16)_-_250px_-_theme(spacing.12))]" 
                onClose={() => togglePanel('agentHub')}
                isMobile={isMobile}
                addConsoleMessage={addConsoleMessage}
                addTimelineEvent={addTimelineEvent}
              />
            )}
          </>
        ) : (
          <>
            <div className={`fixed inset-y-0 left-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.palette ? 'translate-x-0' : '-translate-x-full'}`}>
              {panelVisibility.palette && <PalettePanel className="h-full" onClose={() => togglePanel('palette')} isMobile={isMobile} />}
            </div>

            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.inspector ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.inspector &&
                <InspectorPanel
                  key={selectedNode ? `inspector-mobile-${selectedNode.id}` : 'inspector-mobile-no-node'}
                  className="h-full overflow-y-auto" 
                  onClose={() => togglePanel('inspector')}
                  selectedNode={selectedNode}
                  onNodeUpdate={handleNodeUpdate}
                  isMobile={isMobile}
                  onRunNode={handleRunNode}
                  isNodeRunning={isNodeRunning}
                />}
            </div>
            
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.agentHub ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.agentHub && <AgentHubPanel className="h-full" onClose={() => togglePanel('agentHub')} isMobile={isMobile} addConsoleMessage={addConsoleMessage} addTimelineEvent={addTimelineEvent} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.timeline ? 'translate-y-0' : 'translate-y-full'} mb-14`}> 
              {panelVisibility.timeline && <TimelinePanel className="h-full" onClose={() => togglePanel('timeline')} events={timelineEvents} isMobile={isMobile} />}
            </div>

            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.console ? 'translate-y-0' : 'translate-y-full'} mb-14`}> 
              {panelVisibility.console && <ConsolePanel className="h-full" onClose={() => togglePanel('console')} messages={consoleMessages.filter(msg => consoleFilters[msg.type])} filters={consoleFilters} onToggleFilter={toggleConsoleFilter} onClearConsole={handleClearConsole} isMobile={isMobile} />}
            </div>

            {anyMobilePanelOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                onClick={closeAllMobilePanels}
                aria-label="Close panel"
                role="button"
              />
            )}
          </>
        )}
      </main>
      {isMobile && <BottomBar panelVisibility={panelVisibility} togglePanel={togglePanel} />}
    </div>
  );
}

