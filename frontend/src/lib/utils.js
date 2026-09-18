import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines class names with tailwind-merge and clsx
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 