import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique node ID.
 * @param type - The type of node ('ai' or 'manual').
 * @param baseName - The base name for the ID, typically a workflow name or node title.
 * @param index - A unique index or timestamp.
 * @returns A string representing the unique node ID.
 */
export const generateNodeId = (type: 'ai' | 'manual', baseName: string, index: number | string): string => {
  const safeBaseName = baseName.replace(/\s+/g, '-').toLowerCase();
  return `${type}-node-${safeBaseName}-${index}`;
};
