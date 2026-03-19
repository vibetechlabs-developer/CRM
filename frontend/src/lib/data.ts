// Mock data for Insurance CRM

export type Priority = "High" | "Medium" | "Low";
export type RequestType = "New Policy" | "Renewal" | "Adjustment" | "Cancellation";
export type InsuranceType = "Home Insurance" | "Auto Insurance" | "Life Insurance" | "Business Insurance" | "Health Insurance";
export type PipelineStage = "Lead/Inquiry" | "Document Collection" | "Processing" | "Completed" | "Discarded Leads";
export type UserRole = "Admin" | "Agent";

export interface Client {
  // Backend primary key (as string)
  id: string;
  // Business/client-facing code like "CL-ACC34D"
  clientCode?: string;
  // Display name
  name: string;
  // Optional raw first/last names when available from backend
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  address: string;
  policies: number;
  // Human-readable "added" date
  addedDate: string;
}

export interface Ticket {
  id: string;
  ticket_no?: string;
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

// ===== Backend ticket DTO + UI ticket model (used by Tickets page) =====

export type TicketTypeCode = "NEW" | "RENEWAL" | "ADJUSTMENT" | "CANCELLATION" | (string & {});
export type TicketStatusCode = "LEAD" | "DOCS" | "PROCESSING" | "COMPLETED" | "DISCARDED" | (string & {});
export type TicketPriorityCode = "LOW" | "MEDIUM" | "HIGH" | (string & {});

export interface BackendUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

export interface BackendTicketNote {
  id: number;
  content: string;
  created_at: string;
}

export interface BackendTicket {
  id: number;
  ticket_no: string;
  client?: number;
  client_name?: string;
  client_last_name?: string;
  client_email?: string;
  ticket_type: TicketTypeCode;
  insurance_type?: string;
  status: TicketStatusCode;
  priority: TicketPriorityCode;
  assigned_to?: number | BackendUser | null;
  assigned_to_name?: string;
  assigned_to_username?: string;
  created_at: string;
}

export interface TicketRow {
  id: number;
  ticket_no: string;
  clientName: string;
  clientEmail: string;
  type: RequestType | string;
  insuranceType: string;
  stage: PipelineStage | string;
  priority: Priority | string;
  assignedTo: string;
  assignedToId: number | null;
  createdDate: string;
}

export const getTypeDisplay = (typeCode: TicketTypeCode): RequestType | string => {
  switch (typeCode) {
    case "NEW":
      return "New Policy";
    case "RENEWAL":
      return "Renewal";
    case "ADJUSTMENT":
      return "Adjustment";
    case "CANCELLATION":
      return "Cancellation";
    default:
      return typeCode;
  }
};

export const getStatusDisplay = (statusCode: TicketStatusCode): PipelineStage | string => {
  switch (statusCode) {
    case "LEAD":
      return "Lead/Inquiry";
    case "DOCS":
      return "Document Collection";
    case "PROCESSING":
      return "Processing";
    case "COMPLETED":
      return "Completed";
    case "DISCARDED":
      return "Discarded Leads";
    default:
      return statusCode;
  }
};

export const getStatusBackendCode = (statusDisplay: PipelineStage | string): TicketStatusCode => {
  switch (statusDisplay) {
    case "Lead/Inquiry":
      return "LEAD";
    case "Document Collection":
      return "DOCS";
    case "Processing":
      return "PROCESSING";
    case "Completed":
      return "COMPLETED";
    case "Discarded Leads":
      return "DISCARDED";
    default:
      return "LEAD";
  }
};

export const getPriorityDisplay = (priorityCode: TicketPriorityCode): Priority | string => {
  switch (priorityCode) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    default:
      return "Medium";
  }
};

export const getPriorityBackendCode = (priorityDisplay: Priority | string): TicketPriorityCode => {
  switch (priorityDisplay) {
    case "Low":
      return "LOW";
    case "Medium":
      return "MEDIUM";
    case "High":
      return "HIGH";
    default:
      return "MEDIUM";
  }
};

export const formatBackendTicket = (t: BackendTicket): TicketRow => {
  const { client_name = "", client_last_name = "" } = t;
  const computedName = `${client_name} ${client_last_name}`.trim();

  // Get agent name - prefer assigned_to_name, fallback to assigned_to_username, then "Unassigned"
  let assignedToDisplay = "Unassigned";
  if (t.assigned_to_name) {
    assignedToDisplay = t.assigned_to_name;
  } else if (t.assigned_to_username) {
    assignedToDisplay = t.assigned_to_username;
  } else if (t.assigned_to) {
    assignedToDisplay =
      typeof t.assigned_to === "object"
        ? t.assigned_to.username || "Unknown"
        : `User ${t.assigned_to}`;
  }

  const assignedToId =
    typeof t.assigned_to === "number"
      ? t.assigned_to
      : (t.assigned_to?.id ?? null);

  return {
    id: t.id,
    ticket_no: t.ticket_no,
    clientName: computedName || (t.client ? `Client ${t.client}` : "Unknown Client"),
    clientEmail: t.client_email || "N/A",
    type: getTypeDisplay(t.ticket_type),
    insuranceType: t.insurance_type || "",
    stage: getStatusDisplay(t.status),
    priority: getPriorityDisplay(t.priority),
    assignedTo: assignedToDisplay,
    assignedToId,
    createdDate: new Date(t.created_at).toLocaleDateString(),
  };
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export const clients: Client[] = [
  {
    id: "1",
    clientCode: "C-1013",
    name: "User 1",
    email: "user1@example.com",
    phone: "1234567890",
    address: "123 Oak Street, Downtown",
    policies: 0,
    addedDate: "Feb 26, 2026",
  },
  {
    id: "2",
    clientCode: "C-1011",
    name: "User 2",
    email: "user2@example.com",
    phone: "1234567891",
    address: "456 Maple Avenue, Uptown",
    policies: 0,
    addedDate: "Feb 26, 2026",
  },
  {
    id: "3",
    clientCode: "C-1009",
    name: "User 3",
    email: "user3@example.com",
    phone: "1234567123",
    address: "789 Pine Road, Midtown",
    policies: 0,
    addedDate: "Feb 24, 2026",
  },
  {
    id: "4",
    clientCode: "C-1007",
    name: "User 4",
    email: "user4@example.com",
    phone: "1234567890",
    address: "321 Elm Lane, Westside",
    policies: 1,
    addedDate: "Feb 24, 2026",
  },
  {
    id: "5",
    clientCode: "C-1006",
    name: "User 5",
    email: "user5@example.com",
    phone: "0987654321",
    address: "654 Birch Blvd, Eastside",
    policies: 1,
    addedDate: "Feb 24, 2026",
  },
  {
    id: "6",
    clientCode: "C-1005",
    name: "User 6",
    email: "user6@example.com",
    phone: "1234567890",
    address: "987 Cedar Court, Northside",
    policies: 1,
    addedDate: "Feb 24, 2026",
  },
  {
    id: "7",
    clientCode: "C-1004",
    name: "User 7",
    email: "user7@example.com",
    phone: "9876543210",
    address: "159 Walnut Drive, Southside",
    policies: 2,
    addedDate: "Feb 23, 2026",
  },
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
