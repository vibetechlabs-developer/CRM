import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Ticket } from "./data";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportTicketsToCSV(tickets: Ticket[], filename: string) {
  if (!tickets || tickets.length === 0) {
    return;
  }

  const headers = [
    "Ticket No",
    "Client Name",
    "Client Phone",
    "Client Email",
    "Type",
    "Insurance Type",
    "Stage",
    "Priority",
    "Assigned To",
    "Created Date"
  ];

  const rows = tickets.map(t => [
    t.ticket_no || "",
    t.clientName || "",
    t.clientPhone || "",
    t.clientEmail || "",
    t.type || "",
    t.insuranceType || "",
    t.stage || "",
    t.priority || "",
    t.assignedTo || "",
    t.createdAtRaw ? format(new Date(t.createdAtRaw), "MMM dd, yyyy") : (t.createdDate || "")
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
