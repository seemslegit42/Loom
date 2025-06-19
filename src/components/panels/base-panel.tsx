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
  initialSize?: { width?: string | 'auto'; height?: string | 'auto' };
  onClose?: () => void;
  isMobile?: boolean;
  isResizable?: boolean; 
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 200;

const getStorageKey = (panelTitle: string) => `panel-size-${panelTitle.replace(/\s+/g, '-').toLowerCase()}`;

export function BasePanel({
  title,
  icon,
  children,
  className,
  contentClassName,
  initialSize: initialSizeProp = {},
  onClose,
  isMobile,
  isResizable = false,
}: BasePanelProps) {
  const { toast } = useToast();
  const [isMinimized, setIsMinimized] = useState(false);

  const [currentSize, setCurrentSize] = useState<{ width: number | null; height: number | null }>(() => {
    let parsedWidth: number | null = DEFAULT_WIDTH;
    let parsedHeight: number | null = DEFAULT_HEIGHT;

    if (typeof window !== 'undefined' && isResizable && !isMobile) {
      const storageKey = getStorageKey(title);
      const savedSize = localStorage.getItem(storageKey);
      if (savedSize) {
        try {
          const parsed = JSON.parse(savedSize);
          if (parsed) {
            if (typeof parsed.width === 'number' && parsed.width >= MIN_WIDTH) {
              parsedWidth = parsed.width;
            }
            if (typeof parsed.height === 'number' && parsed.height >= MIN_HEIGHT) {
              parsedHeight = parsed.height;
            }
          }
        } catch (e) {
          console.warn(`Failed to parse saved size for panel "${title}" from localStorage.`, e);
        }
      }
    }
    
    // Override with initialSizeProp if provided and valid
    if (initialSizeProp.width === 'auto') {
      parsedWidth = null; // Indicates CSS should control it
    } else if (typeof initialSizeProp.width === 'string') {
      const propW = parseInt(initialSizeProp.width, 10);
      if (!isNaN(propW) && propW >= MIN_WIDTH) {
        parsedWidth = propW;
      } else if (parsedWidth === DEFAULT_WIDTH && isNaN(propW)) { // Only use default if prop was invalid and no localStorage
         // Keep localStorage or default if prop is invalid
      }
    } else if (initialSizeProp.width === undefined && parsedWidth === DEFAULT_WIDTH) {
       // keep default or localstorage
    }


    if (initialSizeProp.height === 'auto') {
      parsedHeight = null; // Indicates CSS should control it
    } else if (typeof initialSizeProp.height === 'string') {
      const propH = parseInt(initialSizeProp.height, 10);
      if (!isNaN(propH) && propH >= MIN_HEIGHT) {
        parsedHeight = propH;
      } else if (parsedHeight === DEFAULT_HEIGHT && isNaN(propH)) {
        // Keep localStorage or default if prop is invalid
      }
    } else if (initialSizeProp.height === undefined && parsedHeight === DEFAULT_HEIGHT) {
      // keep default or localstorage
    }
    
    // Ensure defaults if still at initial default and no valid prop/localStorage
    if (initialSizeProp.width === undefined && parsedWidth === DEFAULT_WIDTH && !localStorage.getItem(getStorageKey(title))?.includes('"width"')) {
        // If initialSizeProp.width is undefined, and we haven't overridden default with localStorage, it remains default.
        // If isResizable is true, it should be a number unless 'auto' was specified.
        // So, if parsedWidth is still default and width was not 'auto', ensure it's the number.
    }
     if (initialSizeProp.height === undefined && parsedHeight === DEFAULT_HEIGHT && !localStorage.getItem(getStorageKey(title))?.includes('"height"')) {
        // Same for height.
    }


    return { width: parsedWidth, height: parsedHeight };
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const initialResizeState = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  const handleMouseMoveResize = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !isResizable || isMobile) return;
    const dx = e.clientX - initialResizeState.current.mouseX;
    const dy = e.clientY - initialResizeState.current.mouseY;

    let newWidth = initialResizeState.current.width + dx;
    let newHeight = initialResizeState.current.height + dy;

    setCurrentSize(prevSize => ({
      width: Math.max(newWidth, MIN_WIDTH), // Becomes number here
      height: Math.max(newHeight, MIN_HEIGHT) // Becomes number here
    }));
  }, [isResizable, isMobile]); 

  const handleMouseUpResize = useCallback(() => {
    if (!isResizing.current || !isResizable || isMobile) return;
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMoveResize);
    document.removeEventListener('mouseup', handleMouseUpResize); 

    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey(title);
      // Only save if currentSize dimensions are numbers (i.e., pixel values)
      const sizeToSave: Partial<{width: number, height: number}> = {};
      if (typeof currentSize.width === 'number') sizeToSave.width = currentSize.width;
      if (typeof currentSize.height === 'number') sizeToSave.height = currentSize.height;

      if (Object.keys(sizeToSave).length > 0) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(sizeToSave));
        } catch (e) {
            console.error(`Failed to save size for panel "${title}" to localStorage.`, e);
            toast({
            title: "Storage Error",
            description: "Could not save panel size. Local storage might be full or disabled.",
            variant: "destructive",
            });
        }
      }
    }
  }, [isResizable, isMobile, handleMouseMoveResize, title, currentSize, toast]); 

  const handleMouseDownResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isResizable || isMobile) return;
    e.preventDefault();
    isResizing.current = true;
    initialResizeState.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: panelRef.current?.offsetWidth || (typeof currentSize.width === 'number' ? currentSize.width : DEFAULT_WIDTH),
      height: panelRef.current?.offsetHeight || (typeof currentSize.height === 'number' ? currentSize.height : DEFAULT_HEIGHT),
    };
    document.addEventListener('mousemove', handleMouseMoveResize);
    document.addEventListener('mouseup', handleMouseUpResize);
  }, [isResizable, isMobile, currentSize.width, currentSize.height, handleMouseMoveResize, handleMouseUpResize]);


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
  
  const sizeStyles: React.CSSProperties = isResizable && !isMobile
    ? { 
        width: typeof currentSize.width === 'number' ? `${currentSize.width}px` : undefined, 
        height: typeof currentSize.height === 'number' ? `${currentSize.height}px` : undefined 
      }
    : {};


  return (
    <Card
      ref={panelRef}
      className={cn(
        'flex flex-col bg-card/80 backdrop-blur-lg border-border shadow-xl transition-all duration-300 ease-out relative',
        isMinimized && !isMobile && 'h-auto', 
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
        (isMinimized && !isMobile) && "hidden"
      )}>
        {children}
      </CardContent>
      {isResizable && !isMobile && !isMinimized && (
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
