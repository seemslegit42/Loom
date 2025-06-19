// src/components/layout/resizable-vertical-panes.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizableVerticalPanesProps {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  initialDividerPosition?: number; // Percentage (0-100) for the top pane's height
  minPaneHeight?: number; // Minimum height in pixels for each pane
  storageKey?: string;
}

const MIN_PERCENTAGE = 5; // Minimum 5% height for a pane
const MAX_PERCENTAGE = 95; // Maximum 95% height for a pane

export function ResizableVerticalPanes({
  children,
  className,
  initialDividerPosition = 50,
  minPaneHeight = 50,
  storageKey,
}: ResizableVerticalPanesProps) {
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
  const initialDragState = useRef({ y: 0, originalPosition: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    initialDragState.current = {
      y: e.clientY,
      originalPosition: dividerPosition,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dividerPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerHeight = containerRef.current.offsetHeight;
    if (containerHeight === 0) return;

    const deltaY = e.clientY - initialDragState.current.y;
    const deltaPercentage = (deltaY / containerHeight) * 100;
    let newPosition = initialDragState.current.originalPosition + deltaPercentage;

    const minHeightPercentage = (minPaneHeight / containerHeight) * 100;
    
    newPosition = Math.max(minHeightPercentage, newPosition);
    newPosition = Math.min(100 - minHeightPercentage, newPosition);
    
    newPosition = Math.max(MIN_PERCENTAGE, newPosition);
    newPosition = Math.min(MAX_PERCENTAGE, newPosition);

    setDividerPosition(newPosition);
  }, [minPaneHeight]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, dividerPosition.toString());
    }
  }, [dividerPosition, storageKey, handleMouseMove]);

  useEffect(() => {
    return () => {
      if (isDragging.current) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  const topPaneStyle: React.CSSProperties = {
    flexBasis: `${dividerPosition}%`,
    flexGrow: 0,
    flexShrink: 0,
    minHeight: `${minPaneHeight}px`,
    overflow: 'hidden',
  };

  const bottomPaneStyle: React.CSSProperties = {
    flexBasis: `${100 - dividerPosition}%`,
    flexGrow: 0,
    flexShrink: 0,
    minHeight: `${minPaneHeight}px`,
    overflow: 'hidden',
  };

  return (
    <div ref={containerRef} className={cn("flex flex-col h-full w-full items-stretch overflow-hidden", className)}>
      <div style={topPaneStyle} className="w-full">
        {children[0]}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="h-2 w-full cursor-row-resize bg-border hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0"
        title="Resize panes"
      />
      <div style={bottomPaneStyle} className="w-full">
        {children[1]}
      </div>
    </div>
  );
}
