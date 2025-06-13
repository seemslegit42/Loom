
// src/components/panels/base-panel.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Minus, Maximize2, PlusSquare } from 'lucide-react'; // Added PlusSquare for potential icon change
import type React from 'react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BasePanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  initialSize?: { width?: string; height?: string };
  onClose?: () => void;
  isMobile?: boolean;
  isDraggable?: boolean; // Future use
  isResizable?: boolean; // Future use
}

export function BasePanel({
  title,
  icon,
  children,
  className,
  contentClassName,
  initialSize = {},
  onClose,
  isMobile,
}: BasePanelProps) {
  const { toast } = useToast();
  const [isMinimized, setIsMinimized] = useState(false);

  const sizeStyles: React.CSSProperties = {
    ...initialSize,
  };

  const handleMinimize = () => {
    if (!isMobile) {
      setIsMinimized(!isMinimized);
      toast({ 
        title: "Panel Action", 
        description: `Panel "${title}" ${!isMinimized ? 'minimized' : 'restored'}.` 
      });
    } else {
      toast({ 
        title: "Panel Action", 
        description: `Minimize action is for desktop view.` 
      });
    }
  };

  const handleMaximize = () => {
    // Maximize could also be desktop-specific
    toast({ 
      title: "Panel Action", 
      description: `Maximize action for panel "${title}" not yet implemented.` 
    });
  };

  return (
    <Card
      className={cn(
        'flex flex-col bg-card/80 backdrop-blur-lg border-border shadow-xl transition-all duration-300 ease-out',
        isMinimized && !isMobile && 'h-auto', // Allow panel to shrink if content is hidden
        className
      )}
      style={sizeStyles}
    >
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-border/50 cursor-grab select-none">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <CardTitle className="text-sm font-medium font-headline">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-foreground/10" title={isMinimized ? "Restore" : "Minimize"} onClick={handleMinimize}>
                {isMinimized ? <PlusSquare className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-foreground/10" title="Maximize" onClick={handleMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            </>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(
        "p-3 overflow-auto flex-grow",
        contentClassName,
        isMinimized && !isMobile && "hidden" // Hide content when minimized on desktop
      )}>
        {children}
      </CardContent>
    </Card>
  );
}

