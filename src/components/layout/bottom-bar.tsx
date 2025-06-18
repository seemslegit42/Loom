
// src/components/layout/bottom-bar.tsx
'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, Settings2, Bot, ListOrdered, Terminal, ShieldQuestion } from 'lucide-react';
import type { PanelVisibility } from '@/app/page';

interface BottomBarProps {
  panelVisibility: PanelVisibility;
  togglePanel: (panel: keyof PanelVisibility) => void;
}

interface NavItem {
  panel: keyof PanelVisibility;
  label: string;
  icon: React.ReactNode;
}

export function BottomBar({ panelVisibility, togglePanel }: BottomBarProps) {
  const navItems: NavItem[] = [
    { panel: 'palette', label: 'Palette', icon: <LayoutGrid className="h-5 w-5" /> },
    { panel: 'inspector', label: 'Inspector', icon: <Settings2 className="h-5 w-5" /> },
    { panel: 'agentHub', label: 'Agent Hub', icon: <Bot className="h-5 w-5" /> },
    { panel: 'actionConsole', label: 'Actions', icon: <ShieldQuestion className="h-5 w-5" /> },
    { panel: 'timeline', label: 'Timeline', icon: <ListOrdered className="h-5 w-5" /> },
    { panel: 'console', label: 'Console', icon: <Terminal className="h-5 w-5" /> },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 p-1 backdrop-blur-lg md:hidden">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => (
          <Button
            key={item.panel}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center h-auto p-1 rounded-md transition-colors ${
              panelVisibility[item.panel]
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => togglePanel(item.panel)}
            title={item.label}
          >
            {item.icon}
            <span className="mt-0.5 text-[0.6rem]">{item.label}</span>
          </Button>
        ))}
      </nav>
    </footer>
  );
}
