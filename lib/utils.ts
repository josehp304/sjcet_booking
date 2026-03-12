import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TIME_SLOTS = [
  { id: "08:00-09:00", label: "8:00 AM – 9:00 AM", short: "8 AM" },
  { id: "09:00-10:00", label: "9:00 AM – 10:00 AM", short: "9 AM" },
  { id: "10:00-11:00", label: "10:00 AM – 11:00 AM", short: "10 AM" },
  { id: "11:00-12:00", label: "11:00 AM – 12:00 PM", short: "11 AM" },
  { id: "12:00-13:00", label: "12:00 PM – 1:00 PM", short: "12 PM" },
  { id: "13:00-14:00", label: "1:00 PM – 2:00 PM", short: "1 PM" },
  { id: "14:00-15:00", label: "2:00 PM – 3:00 PM", short: "2 PM" },
  { id: "15:00-16:00", label: "3:00 PM – 4:00 PM", short: "3 PM" },
  { id: "16:00-17:00", label: "4:00 PM – 5:00 PM", short: "4 PM" },
  { id: "17:00-18:00", label: "5:00 PM – 6:00 PM", short: "5 PM" }
];

export function formatSession(session: string) {
  if (session === "FORENOON") return "🌅 Forenoon";
  if (session === "AFTERNOON") return "🌇 Afternoon";
  const slot = TIME_SLOTS.find(t => t.id === session);
  return slot ? `🕒 ${slot.label}` : session;
}

export function getSessionColor(session: string) {
  if (session === "FORENOON") return "bg-sky-100 text-sky-700";
  if (session === "AFTERNOON") return "bg-violet-100 text-violet-700";
  return "bg-blue-100 text-blue-700";
}
