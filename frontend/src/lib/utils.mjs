const { clsx } = await import("clsx");
const { twMerge } = await import("tailwind-merge");

export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}