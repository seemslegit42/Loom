
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
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';


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
        setConsoleMessages(fetchedMessages.reverse()); // Reverse to show oldest first, or keep as is for newest first
      } catch (error) {
        console.error("Error fetching console messages from Firestore:", error);
        // Fallback or keep local state if Firestore fetch fails
        setConsoleMessages(prev => [...prev, {type: 'error', text: 'Failed to load console history.', timestamp: new Date()}]);
      }
    };

    fetchConsoleMessages();
  }, []);


  const addConsoleMessage = async (type: ConsoleMessage['type'], text: string) => {
    const newMessage: ConsoleMessage = { type, text, timestamp: new Date() };
    setConsoleMessages(prev => [newMessage, ...prev.slice(0, 49)]); // Keep local state snappy

    try {
      await addDoc(collection(db, 'console_logs'), {
        type: newMessage.type,
        text: newMessage.text,
        timestamp: Timestamp.fromDate(newMessage.timestamp), // Store as Firestore Timestamp
      });
    } catch (error) {
      console.error("Error adding console message to Firestore:", error);
      // Optionally update local state to indicate save failure
      setConsoleMessages(prev => [{type: 'error', text: 'Failed to save message to cloud.', timestamp: new Date()}, ...prev]);
    }
  };


  const handleClearConsole = async () => {
    // Note: Clearing Firestore logs is a destructive operation.
    // For a real app, this would need careful consideration and possibly admin rights.
    // For this prototype, we'll just clear the local state and add a message.
    // A full clear would involve deleting documents from Firestore, which can be complex for many docs.
    setConsoleMessages([]);
    addConsoleMessage('info', 'Local console cleared. Firestore logs are not cleared by this action in prototype.');
    toast({
        title: "Console Cleared",
        description: "Local console messages have been cleared.",
    });
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setTimelineEvents(prev => [...prev, { ...event, id: crypto.randomUUID(), timestamp: new Date() }].slice(-50));
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

    setTimelineEvents([]); // Clear previous simulation timeline
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

      currentDelay += 500; // Queue delay
      setTimeout(() => {
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) AI simulation queued.`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_queued', message: `Node "${nodeTitle}" AI simulation queued.` });
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'queued' }));
        currentStatuses[nodeId] = 'queued';
      }, currentDelay);

      currentDelay += 1000; // Running delay
      setTimeout(() => {
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) AI simulation running.`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_running', message: `Node "${nodeTitle}" AI simulation running.` });
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
        currentStatuses[nodeId] = 'running';
      }, currentDelay);

      currentDelay += 1500 + Math.random() * 1000; // Completion delay
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
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

    // After all individual node timeouts have been set, schedule the workflow completion message
    setTimeout(() => {
        const workflowFailed = Object.values(currentStatuses).some(s => s === 'failed');
        if (workflowFailed) {
            addConsoleMessage('error', `Workflow "${workflowName}" AI simulation finished with errors.`);
            addTimelineEvent({ type: 'workflow_failed', message: `Workflow "${workflowName}" AI simulation finished with errors.`});
        } else {
            addConsoleMessage('info', `Workflow "${workflowName}" AI simulation completed successfully.`);
            addTimelineEvent({ type: 'workflow_completed', message: `Workflow "${workflowName}" AI simulation completed successfully.`});
        }
    }, maxDelay + 500); // Add a small buffer after the last node action
  };


  const handleFlowGenerated = (data: GenerateFlowFormState) => {
    setGeneratedFlow(data);
    setSelectedNode(null); // Deselect any node when a new flow is generated

    if (data.error) {
      addConsoleMessage('error', `Failed to generate flow: ${data.message}`);
      setTimelineEvents([]); // Clear timeline for a failed generation
      setNodeExecutionStatus({}); // Clear execution statuses
    } else {
      // Ensure nodes exist and workflowName is present before simulating
      if (data.nodes && data.nodes.length > 0 && data.workflowName) {
        addConsoleMessage('info', `Flow "${data.workflowName}" generated by AI with ${data.nodes.length} steps. Starting simulation...`);
        const initialStatuses: Record<string, NodeStatus> = {};
        data.nodes.forEach(node => {
          initialStatuses[node.id] = node.status || 'queued'; // Default to 'queued'
        });
        setNodeExecutionStatus(initialStatuses);
        simulateFlowExecution(data.nodes);
      } else {
         addConsoleMessage('info', `Flow "${data.workflowName || 'Untitled Flow'}" generated by AI but contained no actionable steps.`);
         setTimelineEvents([]); // Clear timeline if no steps
         setNodeExecutionStatus({}); // Clear execution statuses
      }
    }
  };

  const handleNodeDropped = (newNodeData: Omit<WorkflowNodeData, 'id' | 'status'> & { status?: NodeStatus }) => {
    const uniqueIndex = Date.now(); // For unique ID generation
    const nodeTitleBase = newNodeData.title || 'Manual Node'; // The clean title from palette item
    const nodeId = generateNodeId('manual', nodeTitleBase, uniqueIndex);

    const nodeWithIdAndStatus: WorkflowNodeData = {
      ...newNodeData,
      id: nodeId,
      title: nodeTitleBase, // Use the clean title
      description: newNodeData.description || `Manually added ${nodeTitleBase} node. Configure in Inspector.`,
      status: newNodeData.status || 'queued', // Default status
      config: newNodeData.config || {}, // Initialize config for new nodes
    };

    setGeneratedFlow(prevFlow => {
      const currentNodes = prevFlow?.nodes || [];
      // Check if this is truly the first node being added to an empty canvas/flow
      const isFirstNodeForNewWorkflow = !prevFlow || currentNodes.length === 0;
      const newWorkflowName = prevFlow?.workflowName || "My Custom Flow";

      if (isFirstNodeForNewWorkflow) {
        addConsoleMessage('info', `New custom workflow "${newWorkflowName}" started by user adding node: "${nodeWithIdAndStatus.title}".`);
        addTimelineEvent({ type: 'workflow_start', message: `Custom workflow "${newWorkflowName}" started.`});
      }

      return {
        ...(prevFlow || { message: "Node added to canvas.", userInput: "Custom flow", error: false }), // Ensure a base flow object if null
        nodes: [...currentNodes, nodeWithIdAndStatus],
        workflowName: newWorkflowName, // Use existing or new name
      };
    });

    setSelectedNode(nodeWithIdAndStatus); // Select the newly dropped node
    addConsoleMessage('log', `Node "${nodeWithIdAndStatus.title}" (ID: ${nodeWithIdAndStatus.id}) added to canvas.`);
    setNodeExecutionStatus(prev => ({...prev, [nodeWithIdAndStatus.id]: nodeWithIdAndStatus.status! }));
    addTimelineEvent({ // Add timeline event for node being added (and queued)
      nodeId: nodeWithIdAndStatus.id,
      nodeTitle: nodeWithIdAndStatus.title,
      type: 'node_queued', // Or a more specific 'node_added' if preferred, but 'queued' aligns with initial state
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
      if (!prevFlow || !prevFlow.nodes) return prevFlow; // Should not happen if a node is selected
      const newNodes = prevFlow.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n));
      return { ...prevFlow, nodes: newNodes };
    });

    setSelectedNode(updatedNode); // Keep the updated node selected

    toast({
      title: "Node Updated",
      description: `Node "${updatedNode.title}" has been saved.`,
    });
    addConsoleMessage('info', `Node "${updatedNode.title}" (ID: ${updatedNode.id}) updated.`);

    // If status was part of the update and it changed, reflect in execution status and timeline
    const oldStatus = nodeExecutionStatus[updatedNode.id];
    if (updatedNode.status && oldStatus !== updatedNode.status) {
      setNodeExecutionStatus(prev => ({...prev, [updatedNode.id]: updatedNode.status! }));

      let eventType: TimelineEvent['type'] = 'info'; // Default
      switch(updatedNode.status) {
        case 'completed': eventType = 'node_completed'; break;
        case 'running': eventType = 'node_running'; break;
        case 'failed': eventType = 'node_failed'; break;
        case 'queued': eventType = 'node_queued'; break;
        default: eventType = 'info'; break; // Or specific status_changed if needed
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

      // Update UI to reflect 'running' state
      addConsoleMessage('info', `Node "${nodeToRun.title}" (ID: ${nodeId}) execution started for URL: ${url}`);
      addTimelineEvent({ nodeId, nodeTitle: nodeToRun.title, type: 'node_running', message: `Executing: Summarize ${url}` });
      setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
      // If the node being run is currently selected, update its state in the inspector too
      if (selectedNode?.id === nodeId) setSelectedNode(prev => prev ? {...prev, status: 'running'} : null);


      try {
        const result = await summarizeWebpage({ url });

        // Prepare updated node data with result and new status
        const updatedNodeData: WorkflowNodeData = {
          ...nodeToRun,
          config: { ...nodeToRun.config, output: result }, // Store the full result (summary + originalUrl + error)
          status: result.error ? 'failed' : 'completed',
        };

        // Update the flow state with the new node data
        setGeneratedFlow(prevFlow => ({
          ...(prevFlow!), // Should not be null if we found a node
          nodes: prevFlow!.nodes.map(n => n.id === nodeId ? updatedNodeData : n),
        }));
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: updatedNodeData.status! }));
        if (selectedNode?.id === nodeId) setSelectedNode(updatedNodeData); // Update inspector if it's selected

        // Log outcome and show toast
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
        // Handle unexpected errors during the summarizeWebpage call itself
        const errorMessage = e.message || "An unexpected error occurred during node execution.";
         const updatedNodeData: WorkflowNodeData = {
          ...nodeToRun,
          config: { ...nodeToRun.config, output: { summary: '', originalUrl: url, error: errorMessage } }, // Store error in output
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
      // Handle other node types if/when they become runnable
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
      const currentlyOpening = !prev[panel]; // Is the action to open this panel?

      if (isMobile) {
        // If currently trying to open this panel
        if (currentlyOpening) {
          // Close all other panels
          (Object.keys(newState) as Array<keyof PanelVisibility>).forEach(key => {
            if (key !== panel) {
              newState[key] = false;
            }
          });
          newState[panel] = true; // Open the target panel
        } else {
          // If trying to close the currently open panel (which means it was already true)
          newState[panel] = false;
        }
      } else {
        // Desktop behavior: just toggle
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

  // Derived state for mobile: is any panel currently open?
  const anyMobilePanelOpen = isMobile && Object.values(panelVisibility).some(v => v);

  if (isMobile === undefined) { // Still determining if mobile or not
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
      <main className={`flex-1 relative flex overflow-hidden ${isMobile ? 'p-0' : 'p-4 gap-4'} ${isMobile ? 'pb-16' : ''}`}> {/* pb-16 for mobile bottom bar */}
        {/* Canvas Zone - De-emphasize if a mobile panel is open */}
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

        {/* Desktop Panels */}
        {!isMobile ? (
          <>
            {panelVisibility.palette && (
              <PalettePanel className="absolute top-4 left-4 z-10" onClose={() => togglePanel('palette')} isMobile={isMobile} />
            )}
            {panelVisibility.inspector && (
              <InspectorPanel
                key={selectedNode ? `inspector-desktop-${selectedNode.id}` : 'inspector-desktop-no-node'} // Re-key to force re-render on node change
                className="absolute top-4 right-4 z-10 max-h-[calc(100vh_-_theme(spacing.16)_-_theme(spacing.8))]" // Adjust max-h based on top/bottom bars
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
                className="absolute bottom-[calc(250px+2rem)] right-4 z-10 max-h-[calc(100vh_-_theme(spacing.16)_-_250px_-_theme(spacing.12))]" // Example positioning
                onClose={() => togglePanel('agentHub')}
                isMobile={isMobile}
                addConsoleMessage={addConsoleMessage}
                addTimelineEvent={addTimelineEvent}
              />
            )}
          </>
        ) : (
          /* Mobile Panels - Slide-overs */
          <>
            {/* Palette Panel (Mobile) */}
            <div className={`fixed inset-y-0 left-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.palette ? 'translate-x-0' : '-translate-x-full'}`}>
              {panelVisibility.palette && <PalettePanel className="h-full" onClose={() => togglePanel('palette')} isMobile={isMobile} />}
            </div>

            {/* Inspector Panel (Mobile) */}
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
            
            {/* AgentHub Panel (Mobile) */}
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.agentHub ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.agentHub && <AgentHubPanel className="h-full" onClose={() => togglePanel('agentHub')} isMobile={isMobile} addConsoleMessage={addConsoleMessage} addTimelineEvent={addTimelineEvent} />}
            </div>

            {/* Timeline Panel (Mobile) */}
            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.timeline ? 'translate-y-0' : 'translate-y-full'} mb-14`}> {/* mb-14 for bottom bar */}
              {panelVisibility.timeline && <TimelinePanel className="h-full" onClose={() => togglePanel('timeline')} events={timelineEvents} isMobile={isMobile} />}
            </div>

            {/* Console Panel (Mobile) */}
            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.console ? 'translate-y-0' : 'translate-y-full'} mb-14`}> {/* mb-14 for bottom bar */}
              {panelVisibility.console && <ConsolePanel className="h-full" onClose={() => togglePanel('console')} messages={consoleMessages.filter(msg => consoleFilters[msg.type])} filters={consoleFilters} onToggleFilter={toggleConsoleFilter} onClearConsole={handleClearConsole} isMobile={isMobile} />}
            </div>

            {/* Backdrop for mobile panels */}
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

