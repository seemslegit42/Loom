
// src/components/layout/top-bar.tsx
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import { AiFlowGeneratorForm } from '@/components/ai/ai-flow-generator-form';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BrainCircuit, Search, Settings, UserCircle, Menu, Terminal, Check, FolderKanban, FileText } from 'lucide-react';
import type { PanelVisibility } from '@/app/page';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface TopBarProps {
  onFlowGenerated: (data: GenerateFlowFormState) => void;
  panelVisibility: PanelVisibility;
  togglePanel: (panel: keyof PanelVisibility) => void;
  isMobile: boolean;
  anyMobilePanelOpen: boolean;
}

export function TopBar({ onFlowGenerated, panelVisibility, togglePanel, isMobile, anyMobilePanelOpen }: TopBarProps) {
  const showAiForm = !isMobile || !anyMobilePanelOpen;
  const { toast } = useToast();

  const handleComingSoon = (featureName: string) => {
    toast({
      title: "Coming Soon!",
      description: `${featureName} feature is under development.`,
    });
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 shadow-sm backdrop-blur-lg sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 md:gap-4">
        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-1">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleComingSoon("Projects")} className="cursor-pointer">
                 <FolderKanban className="mr-2 h-4 w-4" /> Projects
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleComingSoon("Documentation")} className="cursor-pointer">
                 <FileText className="mr-2 h-4 w-4" /> Docs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => togglePanel('console')} className="cursor-pointer">
                <Terminal className="mr-2 h-4 w-4" />
                <span>Console</span>
                {panelVisibility.console && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleComingSoon("Agent Context")} className="cursor-pointer">
                 <UserCircle className="mr-2 h-4 w-4" /> Agent Context
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleComingSoon("Settings")} className="cursor-pointer">
                 <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-xl md:text-2xl font-semibold text-foreground">
          Loom Studio
        </h1>
        <Separator orientation="vertical" className={`h-8 ${isMobile ? 'hidden' : 'block'}`} />
        <nav className={`items-center gap-2 ${isMobile ? 'hidden' : 'flex md:flex'}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleComingSoon("Projects")}>
            Projects
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleComingSoon("Documentation")}>
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
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Command Palette" onClick={() => handleComingSoon("Command Palette")}>
          <Search className="h-5 w-5" />
          <span className="sr-only">Command Palette</span>
        </Button>
        {!isMobile && (
          <>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Agent Context" onClick={() => handleComingSoon("Agent Context")}>
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Agent Context</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Settings" onClick={() => handleComingSoon("Settings")}>
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

