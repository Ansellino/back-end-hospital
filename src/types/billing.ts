/**
 * Billing related types for the healthcare management system
 */

// Invoice status options
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled"
  | "partially_paid";

// Payment method options
export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "insurance"
  | "bank_transfer"
  | "check";

// Base Invoice type
export interface Invoice {
  id: string;
  patientId: number;
  appointmentId?: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice with items
export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

// Invoice item
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  serviceCode?: string;
  taxRate?: number;
  createdAt: string;
  updatedAt: string;
}

// Payment
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  processedBy: string;
  processedDate: string;
  createdAt: string;
  updatedAt: string;
}

// Request to create a new invoice
export interface CreateInvoiceRequest {
  patientId: number;
  appointmentId?: string;
  status?: InvoiceStatus;
  dueDate: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    serviceCode?: string;
    taxRate?: number;
  }[];
}

// Request to update an existing invoice
export interface UpdateInvoiceRequest {
  patientId?: number;
  appointmentId?: string;
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
}

// Request to record a payment
export interface RecordPaymentRequest {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  processedBy: string;
  processedDate?: string;
}
