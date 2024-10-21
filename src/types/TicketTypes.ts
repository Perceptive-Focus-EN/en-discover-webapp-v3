// src/types/TicketTypes.ts
import { ObjectId } from 'mongodb';

export interface Ticket {
  _id: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Closed = 'Closed',
}

export enum TicketPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  searchTerm?: string;
}

export interface TicketUpdateData {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
}

export interface TicketCreateData {
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  ticketId?: string;
}

export interface TicketResponse {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketActionResponse {
  success: boolean;
  message: string;
}
