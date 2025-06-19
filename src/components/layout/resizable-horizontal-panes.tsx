// src/components/layout/resizable-horizontal-panes.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizableHorizontalPanesProps {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  initialDividerPosition?: number; // Percentage (0-100) for the left pane
  minPaneWidth?: number; // Minimum width in pixels for each pane
  storageKey?: string;
}

const MIN_PERCENTAGE = 5; // Minimum 5% for a pane
const MAX_PERCENTAGE = 95; // Maximum 95% for a pane

export function ResizableHorizontalPanes({
  children,
  className,
  initialDividerPosition = 50,
  minPaneWidth = 50,
  storageKey,
}: ResizableHorizontalPanesProps) {
  const [dividerPosition, setDividerPosition] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const storedPosition = localStorage.getItem(storageKey);
      if (storedPosition) {
        const numPosition = parseFloat(storedPosition);
        if (!isNaN(numPosition) && numPosition >= MIN_PERCENTAGE && numPosition <= MAX_PERCENTAGE) {
          return numPosition;
        }
      }
    }
    return initialDividerPosition;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const initialDragState = useRef({ x: 0, originalPosition: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    initialDragState.current = {
      x: e.clientX,
      originalPosition: dividerPosition,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dividerPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    if (containerWidth === 0) return;

    const deltaX = e.clientX - initialDragState.current.x;
    const deltaPercentage = (deltaX / containerWidth) * 100;
    let newPosition = initialDragState.current.originalPosition + deltaPercentage;

    // Clamp based on minPaneWidth
    const minWidthPercentage = (minPaneWidth / containerWidth) * 100;
    
    newPosition = Math.max(minWidthPercentage, newPosition);
    newPosition = Math.min(100 - minWidthPercentage, newPosition);
    
    // General clamp for safety
    newPosition = Math.max(MIN_PERCENTAGE, newPosition);
    newPosition = Math.min(MAX_PERCENTAGE, newPosition);

    setDividerPosition(newPosition);
  }, [minPaneWidth]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, dividerPosition.toString());
    }
  }, [dividerPosition, storageKey, handleMouseMove]); // Added handleMouseMove to dependencies

  useEffect(() => {
    // Cleanup listeners if component unmounts while dragging
    return () => {
      if (isDragging.current) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp]);


  const leftPaneStyle: React.CSSProperties = {
    flexBasis: `${dividerPosition}%`,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: `${minPaneWidth}px`,
    overflow: 'hidden', // Prevents content from pushing pane
  };

  const rightPaneStyle: React.CSSProperties = {
    flexBasis: `${100 - dividerPosition}%`,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: `${minPaneWidth}px`,
    overflow: 'hidden', // Prevents content from pushing pane
  };

  return (
    <div ref={containerRef} className={cn("flex h-full w-full items-stretch overflow-hidden", className)}>
      <div style={leftPaneStyle} className="h-full">
        {children[0]}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="w-2 h-full cursor-col-resize bg-border hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0"
        title="Resize panes"
      />
      <div style={rightPaneStyle} className="h-full">
        {children[1]}
      </div>
    </div>
  );
}
