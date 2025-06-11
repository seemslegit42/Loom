// src/components/layout/top-bar.tsx
import type { GenerateFlowFormState } from '@/lib/actions/ai';
import { AiFlowGeneratorForm } from '@/components/ai/ai-flow-generator-form';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BrainCircuit, Search, Settings, UserCircle } from 'lucide-react';

interface TopBarProps {
  onFlowGenerated: (data: GenerateFlowFormState) => void;
}

export function TopBar({ onFlowGenerated }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-2xl font-semibold text-foreground">
          Loom Studio
        </h1>
        <Separator orientation="vertical" className="h-8" />
        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Projects
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Docs
          </Button>
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 lg:px-8">
        <div className="w-full max-w-xl">
         <AiFlowGeneratorForm onFlowGenerated={onFlowGenerated} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Command Palette">
          <Search className="h-5 w-5" />
          <span className="sr-only">Command Palette</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Agent Context">
          <UserCircle className="h-5 w-5" />
          <span className="sr-only">Agent Context</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Settings">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  );
}
