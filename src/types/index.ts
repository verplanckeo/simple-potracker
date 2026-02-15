export type ID = string;

export interface Training {
  id: ID;
  name: string;
}

export interface Customer {
  id: ID;
  name: string;
}

export interface Producer {
  id: ID;
  name: string;
  rate: number;
  markup: number;
}

export interface Session {
  id: ID;
  date: string;
  producerId: ID | "";
  units: number;
  note?: string;
}

export type POStatus = "draft" | "sent" | "paid";

export const PO_STATUSES: { value: POStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
];

export interface PO {
  id: ID;
  poNumber: string;
  trainingId: ID | "";
  customerId: ID | "";
  status: POStatus;
  sessions: Session[];
  note?: string;
}

export interface StoreV1 {
  version: 1;
  trainings: Training[];
  customers: Customer[];
  producers: Producer[];
  pos: PO[];
}

export interface POComputed {
  sessionCount: number;
  startDate: string;
  endDate: string;
  price: number;
  profit: number;
  producerIds: ID[];
}

export type SimpleEntity = { id: ID; name: string };

export type EntityKind = "trainings" | "customers";

export type ViewKey = "pos" | "trainings" | "customers" | "producers";
