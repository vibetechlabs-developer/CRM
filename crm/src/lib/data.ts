// Mock data for Insurance CRM

export type Priority = "High" | "Medium" | "Low";
export type RequestType = "New Policy" | "Renewal" | "Adjustment" | "Cancellation";
export type InsuranceType = "Home Insurance" | "Auto Insurance" | "Life Insurance" | "Business Insurance" | "Health Insurance";
export type PipelineStage = "Lead/Inquiry" | "Document Collection" | "Processing" | "Completed" | "Discarded Leads";
export type UserRole = "Admin" | "Agent";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  policies: number;
  addedDate: string;
}

export interface Ticket {
  id: string;
  clientName: string;
  clientEmail: string;
  type: RequestType;
  insuranceType: InsuranceType;
  stage: PipelineStage;
  priority: Priority;
  assignedTo: string;
  createdDate: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export const clients: Client[] = [
  { id: "C-1013", name: "User 1", email: "user1@example.com", phone: "1234567890", address: "123 Oak Street, Downtown", policies: 0, addedDate: "Feb 26, 2026" },
  { id: "C-1011", name: "User 2", email: "user2@example.com", phone: "1234567891", address: "456 Maple Avenue, Uptown", policies: 0, addedDate: "Feb 26, 2026" },
  { id: "C-1009", name: "User 3", email: "user3@example.com", phone: "1234567123", address: "789 Pine Road, Midtown", policies: 0, addedDate: "Feb 24, 2026" },
  { id: "C-1007", name: "User 4", email: "user4@example.com", phone: "1234567890", address: "321 Elm Lane, Westside", policies: 1, addedDate: "Feb 24, 2026" },
  { id: "C-1006", name: "User 5", email: "user5@example.com", phone: "0987654321", address: "654 Birch Blvd, Eastside", policies: 1, addedDate: "Feb 24, 2026" },
  { id: "C-1005", name: "User 6", email: "user6@example.com", phone: "1234567890", address: "987 Cedar Court, Northside", policies: 1, addedDate: "Feb 24, 2026" },
  { id: "C-1004", name: "User 7", email: "user7@example.com", phone: "9876543210", address: "159 Walnut Drive, Southside", policies: 2, addedDate: "Feb 23, 2026" },
];

export const tickets: Ticket[] = [
  { id: "INS-00001", clientName: "User 7", clientEmail: "user7@example.com", type: "New Policy", insuranceType: "Home Insurance", stage: "Lead/Inquiry", priority: "Medium", assignedTo: "Agent 1", createdDate: "Feb 25, 2026" },
  { id: "INS-00002", clientName: "User 2", clientEmail: "user2@example.com", type: "New Policy", insuranceType: "Business Insurance", stage: "Processing", priority: "Medium", assignedTo: "Agent 2", createdDate: "Feb 25, 2026" },
  { id: "INS-00003", clientName: "User 3", clientEmail: "user3@example.com", type: "Renewal", insuranceType: "Life Insurance", stage: "Completed", priority: "Low", assignedTo: "Agent 2", createdDate: "Feb 25, 2026" },
  { id: "INS-00004", clientName: "User 1", clientEmail: "user1@example.com", type: "New Policy", insuranceType: "Home Insurance", stage: "Discarded Leads", priority: "Medium", assignedTo: "Agent 2", createdDate: "Feb 25, 2026" },
  { id: "INS-00005", clientName: "User 6", clientEmail: "user6@example.com", type: "New Policy", insuranceType: "Auto Insurance", stage: "Document Collection", priority: "Medium", assignedTo: "Agent 2", createdDate: "Feb 25, 2026" },
  { id: "INS-00006", clientName: "User 4", clientEmail: "user4@example.com", type: "Adjustment", insuranceType: "Life Insurance", stage: "Completed", priority: "High", assignedTo: "Agent 3", createdDate: "Feb 25, 2026" },
  { id: "INS-00007", clientName: "User 5", clientEmail: "user5@example.com", type: "Cancellation", insuranceType: "Home Insurance", stage: "Completed", priority: "High", assignedTo: "Agent 4", createdDate: "Feb 25, 2026" },
  { id: "INS-00008", clientName: "User 7", clientEmail: "user7@example.com", type: "New Policy", insuranceType: "Business Insurance", stage: "Completed", priority: "Low", assignedTo: "Agent 2", createdDate: "Feb 25, 2026" },
];

export const users: User[] = [
  { id: "1", name: "Agent 4", email: "agent4@example.com", role: "Agent", permissions: ["Cancellation"] },
  { id: "2", name: "Agent 3", email: "agent3@example.com", role: "Agent", permissions: ["Adjustment"] },
  { id: "3", name: "Agent 1", email: "agent1@example.com", role: "Agent", permissions: ["New Policy", "Renewal"] },
  { id: "4", name: "Agent 2", email: "agent2@example.com", role: "Agent", permissions: ["New Policy"] },
  { id: "5", name: "Admin", email: "admin@gmail.com", role: "Admin", permissions: [] },
];

export const pipelineStages: PipelineStage[] = [
  "Lead/Inquiry",
  "Document Collection",
  "Processing",
  "Completed",
];

export const insuranceTypes: InsuranceType[] = [
  "Home Insurance",
  "Auto Insurance",
  "Life Insurance",
  "Business Insurance",
  "Health Insurance",
];

export const requestTypes: { type: RequestType; description: string; icon: string }[] = [
  { type: "New Policy", description: "New quote request", icon: "FileText" },
  { type: "Renewal", description: "Policy renewal", icon: "RefreshCw" },
  { type: "Adjustment", description: "Update details", icon: "SlidersHorizontal" },
  { type: "Cancellation", description: "Terminate policy", icon: "Ban" },
];

export const priorities: Priority[] = ["High", "Medium", "Low"];
