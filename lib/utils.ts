import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils.ts (or inside your config/constants file)
export const getAssetPath = (path: string) => {
  const basePath = process.env.NODE_ENV === 'production' ? '/NYCDOT-counting-app' : '';
  return `${basePath}${path}`;
};