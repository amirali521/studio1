
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatNumberCompact(number: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(number);
}

export function formatCurrencyCompact(amount: number, currency: string = 'USD') {
    if (Math.abs(amount) < 1000) {
        return formatCurrency(amount, currency);
    }
    const formatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
    return formatter.format(amount);
}

    