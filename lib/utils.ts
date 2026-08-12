import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAssetPath = (path: string) => {
  const basePath = process.env.NODE_ENV === 'production' ? '/NYCDOT-counting-app' : '';
  return `${basePath}${path}`;
}

export function extractTimeFromFilename(filename: string): Date | null {
  const datePattern = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/
  const match = filename.match(datePattern)
  if (match) {
    const [, year, month, day, hour, minute, second] = match
    const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
    )
    if (!isNaN(date.getTime())) return date
  }
  return null
}

export function formatTime(timeInSeconds: number): string {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00"
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export function formatLastSaved(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}