export type PaymentStatus = "pending" | "received" | "paid";

export interface AuditEntry {
  action: "submitted" | "marked_received" | "marked_paid";
  performedBy: string;
  role: "business" | "admin";
  timestamp: Date;
  note?: string;
  proofImageUrl?: string | null;
}

export interface PaymentRequest {
  id: string;
  refId: string;
  amount: string;
  currency: string;
  beneficiary: {
    companyName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    bankCountry: string;
    reference: string;
  };
  receiptPreview: string | null;
  transferProof: string | null;
  status: PaymentStatus;
  submittedAt: Date;
  receivedAt: Date | null;
  paidAt: Date | null;
  auditLog: AuditEntry[];
  // Admin-specific fields (optional)
  businessName?: string;
  businessEmail?: string;
  receivedBy?: string | null;
  paidBy?: string | null;
  remittanceAmount?: string | null;
  remittanceCurrency?: string | null;
  handlingFeePercent?: string;
  handlingFeeAmount?: string;
}

export interface PaymentNotification {
  id: string;
  requestId: string;
  refId: string;
  type: "received" | "paid";
  amount: string;
  currency: string;
  beneficiaryName: string;
  timestamp: Date;
  read: boolean;
}

export const STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  received: { label: "Received", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  paid: { label: "Paid", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
};
