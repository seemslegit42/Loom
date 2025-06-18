// src/components/panels/base-panel.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Minus, Maximize2, PlusSquare, GripHorizontal } from 'lucide-react';
import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  isResizable?: boolean; 
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

const getStorageKey = (panelTitle: string) => `panel-size-${panelTitle.replace(/\s+/g, '-').toLowerCase()}`;

export function BasePanel({
  title,
  icon,
  children,
  className,
  contentClassName,
  initialSize: initialSizeProp = {}, // Renamed to avoid conflict in useState initializer
  onClose,
  isMobile,
  isResizable = false,
}: BasePanelProps) {
  const { toast } = useToast();
  const [isMinimized, setIsMinimized] = useState(false);

  const [currentSize, setCurrentSize] = useState<{ width: number; height: number }>(() => {
    let initialW = 300; // Default width
    let initialH = 200; // Default height

    if (typeof window !== 'undefined' && isResizable && !isMobile) {
      const storageKey = getStorageKey(title);
      const savedSize = localStorage.getItem(storageKey);
      if (savedSize) {
        try {
          const parsed = JSON.parse(savedSize);
          if (parsed && typeof parsed.width === 'number' && typeof parsed.height === 'number') {
            return {
              width: Math.max(parsed.width, MIN_WIDTH),
              height: Math.max(parsed.height, MIN_HEIGHT),
            };
          }
        } catch (e) {
          console.warn(`Failed to parse saved size for panel "${title}" from localStorage.`, e);
        }
      }
    }

    // If no saved size, try to use initialSize prop (for pixel values) or fallback to defaults
    const propW = parseInt(initialSizeProp.width || '', 10);
    const propH = parseInt(initialSizeProp.height || '', 10);

    initialW = !isNaN(propW) && propW > 0 ? Math.max(propW, MIN_WIDTH) : initialW;
    initialH = !isNaN(propH) && propH > 0 ? Math.max(propH, MIN_HEIGHT) : initialH;
    
    return { width: initialW, height: initialH };
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const initialResizeState = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  const handleMouseDownResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isResizable || isMobile) return;
    e.preventDefault();
    isResizing.current = true;
    initialResizeState.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: panelRef.current?.offsetWidth || currentSize.width,
      height: panelRef.current?.offsetHeight || currentSize.height,
    };
    document.addEventListener('mousemove', handleMouseMoveResize);
    document.addEventListener('mouseup', handleMouseUpResize);
  }, [isResizable, isMobile, currentSize.width, currentSize.height]); // Added handleMouseMoveResize, handleMouseUpResize to dependencies

  const handleMouseMoveResize = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !isResizable || isMobile) return;
    const dx = e.clientX - initialResizeState.current.mouseX;
    const dy = e.clientY - initialResizeState.current.mouseY;

    let newWidth = initialResizeState.current.width + dx;
    let newHeight = initialResizeState.current.height + dy;

    newWidth = Math.max(newWidth, MIN_WIDTH);
    newHeight = Math.max(newHeight, MIN_HEIGHT);
    
    // Optional: Add max width/height constraints (e.g., based on viewport)
    // newWidth = Math.min(newWidth, window.innerWidth - 50); 
    // newHeight = Math.min(newHeight, window.innerHeight - 50);

    setCurrentSize({ width: newWidth, height: newHeight });
  }, [isResizable, isMobile]);

  const handleMouseUpResize = useCallback(() => {
    if (!isResizing.current || !isResizable || isMobile) return;
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMoveResize);
    document.removeEventListener('mouseup', handleMouseUpResize);

    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey(title);
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentSize));
      } catch (e) {
        console.error(`Failed to save size for panel "${title}" to localStorage.`, e);
        toast({
          title: "Storage Error",
          description: "Could not save panel size. Local storage might be full or disabled.",
          variant: "destructive",
        });
      }
    }
  }, [isResizable, isMobile, handleMouseMoveResize, title, currentSize, toast]);


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
    toast({ 
      title: "Panel Action", 
      description: `Maximize action for panel "${title}" not yet implemented.` 
    });
  };
  
  // Apply size styles only if resizable and not on mobile
  // Otherwise, rely on className for sizing (e.g., for mobile full-screen panels or non-resizable panels)
  const sizeStyles: React.CSSProperties = isResizable && !isMobile
    ? { width: `${currentSize.width}px`, height: `${currentSize.height}px` }
    : {};


  return (
    <Card
      ref={panelRef}
      className={cn(
        'flex flex-col bg-card/80 backdrop-blur-lg border-border shadow-xl transition-all duration-300 ease-out relative',
        isMinimized && !isMobile && 'h-auto', // This allows it to shrink when minimized
        className
      )}
      style={sizeStyles} // Apply dynamic size styles
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
        "p-3 overflow-auto flex-grow", // Ensure content can scroll if panel is smaller
        contentClassName,
        isMinimized && !isMobile && "hidden"
      )}>
        {children}
      </CardContent>
      {isResizable && !isMobile && (
        <div
          ref={resizeHandleRef}
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 text-muted-foreground/50 hover:text-primary z-20"
          title="Resize panel"
        >
          <GripHorizontal className="h-3 w-3 rotate-45 transform " />
        </div>
      )}
    </Card>
  );
}
