import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Labels for a closed Base UI select. Without this, the trigger shows the raw value. */
export function selectItems(
  options: readonly { value: string; label: string }[]
): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.value, option.label]));
}
