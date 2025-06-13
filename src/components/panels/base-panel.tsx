
// src/components/panels/base-panel.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Minus, Maximize2 } from 'lucide-react';
import type React from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const sizeStyles: React.CSSProperties = {
    ...initialSize,
  };

  const handleMinimize = () => {
    toast({ title: "Panel Action", description: `Panel "${title}" minimize clicked.` });
  };

  const handleMaximize = () => {
    toast({ title: "Panel Action", description: `Panel "${title}" maximize clicked.` });
  };

  return (
    <Card
      className={`flex flex-col bg-card/80 backdrop-blur-lg border-border shadow-xl transition-all duration-300 ease-out ${className}`}
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
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-foreground/10" title="Minimize" onClick={handleMinimize}>
                <Minus className="h-3 w-3" />
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
      <CardContent className={`p-3 overflow-auto flex-grow ${contentClassName}`}>
        {children}
      </CardContent>
    </Card>
  );
}

