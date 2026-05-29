import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toDate(firestoreDate: any): Date {
  if (!firestoreDate) return new Date();
  if (firestoreDate instanceof Date) return firestoreDate;
  if (typeof firestoreDate.toDate === 'function') return firestoreDate.toDate();
  if (typeof firestoreDate === 'string' || typeof firestoreDate === 'number') return new Date(firestoreDate);
  return new Date();
}
