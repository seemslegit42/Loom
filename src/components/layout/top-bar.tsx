
// src/components/layout/top-bar.tsx
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import { AiFlowGeneratorForm } from '@/components/ai/ai-flow-generator-form';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BrainCircuit, Search, Settings, UserCircle, LayoutGrid, ListOrdered, Terminal, Bot, Menu, Check } from 'lucide-react';
import type { PanelVisibility } from '@/app/page'; // Assuming PanelVisibility is exported from page.tsx or a shared types file
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onFlowGenerated: (data: GenerateFlowFormState) => void;
  panelVisibility: PanelVisibility;
  togglePanel: (panel: keyof PanelVisibility) => void;
  isMobile: boolean;
}

export function TopBar({ onFlowGenerated, panelVisibility, togglePanel, isMobile }: TopBarProps) {
  const showAiForm = !isMobile || (!panelVisibility.palette && !panelVisibility.inspector && !panelVisibility.agentHub);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 shadow-sm backdrop-blur-lg sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 md:gap-4">
        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-1">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Panels Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => togglePanel('palette')} className="cursor-pointer">
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>Palette</span>
                {panelVisibility.palette && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePanel('inspector')} className="cursor-pointer">
                <Settings2 className="mr-2 h-4 w-4" />
                <span>Inspector</span>
                {panelVisibility.inspector && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePanel('timeline')} className="cursor-pointer">
                <ListOrdered className="mr-2 h-4 w-4" />
                <span>Timeline</span>
                {panelVisibility.timeline && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePanel('console')} className="cursor-pointer">
                <Terminal className="mr-2 h-4 w-4" />
                <span>Console</span>
                {panelVisibility.console && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePanel('agentHub')} className="cursor-pointer">
                <Bot className="mr-2 h-4 w-4" />
                <span>Agent Hub</span>
                {panelVisibility.agentHub && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-xl md:text-2xl font-semibold text-foreground">
          Loom Studio
        </h1>
        <Separator orientation="vertical" className={`h-8 ${isMobile ? 'hidden' : 'block'}`} />
        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Projects
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Docs
          </Button>
        </nav>
      </div>

      <div className={`flex flex-1 items-center justify-center px-2 md:px-4 lg:px-8 transition-opacity duration-300 ${showAiForm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full max-w-xl">
         <AiFlowGeneratorForm onFlowGenerated={onFlowGenerated} />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Command Palette">
          <Search className="h-5 w-5" />
          <span className="sr-only">Command Palette</span>
        </Button>
        {!isMobile && ( // Hide these less critical buttons on mobile to save space
          <>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Agent Context">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Agent Context</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

