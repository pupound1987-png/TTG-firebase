
export enum Status {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CONFIRMATION = 'WAITING_CONFIRMATION',
  CLOSED = 'CLOSED'
}

export type Priority = 'Low' | 'Medium' | 'High';

export type SystemType = 'IT' | 'MAINTENANCE';

export type Department = 
  | 'Packing' | 'Purchasing' | 'Accounting' | 'Marketing' | 'Maintenance' 
  | 'Import/Export' | 'HR' | 'Safety' | 'Filingsoldering' | 'Stone setting' 
  | 'Executive secretary' | 'QA-QC' | 'Wax' | 'Waxsetting' | 'Store inventory' | 'IT';

export type RequestType = 
  | 'Software' | 'Hardware' | 'Network' | 'Printer' | 'Electrical' 
  | 'Plumbing' | 'Aircon' | 'Building' | 'Furniture' | 'Utility' | 'Other';

export interface Ticket {
  ticketId: string;
  systemType: SystemType;
  requesterName: string;
  department: Department;
  type: RequestType;
  priority: Priority;
  detail: string;
  imageUrl: string;
  status: Status;
  technician: string;
  fixDetail: string;
  startDate: string;
  closeDate: string;
  month: string;
  rating?: string;
  feedback?: string;
}

export interface User {
  username: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'USER';
  fullName: string;
  systemAccess?: SystemType | 'BOTH';
}
