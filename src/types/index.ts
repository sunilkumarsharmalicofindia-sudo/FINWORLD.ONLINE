export type UserRole = 'Administrator' | 'Manager' | 'Agent';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agentId?: string; // Linked agent ID if role is 'Agent'
  avatar?: string;
  lastLogin?: string;
}

export type Language = 'en' | 'hi';

export type LoanProduct = 
  | 'Home Loan'
  | 'Loan Against Property (LAP)'
  | 'Business Loan'
  | 'Personal Loan'
  | 'Car Loan'
  | 'Education Loan'
  | 'MSME / CC-OD'
  | 'Doctor / Professional Loan';

export interface ProductSlabConfig {
  product: LoanProduct;
  baseRate: number; // percentage, e.g. 0.65%
  tierBonusRate: number; // bonus % for high tickets, e.g. +0.10%
  tierThreshold: number; // threshold in INR, e.g. 5000000
  notes?: string;
}

export type FileStatus = 
  | 'Logged In'
  | 'Underwriting'
  | 'Sanctioned'
  | 'Disbursed'
  | 'Rejected'
  | 'Disputed';

export type BankPayoutStatus = 
  | 'Received'
  | 'Partially Received'
  | 'Pending'
  | 'Disputed';

export type AgentPayoutStatus = 
  | 'Paid'
  | 'Partially Paid'
  | 'Unpaid'
  | 'On Hold';

export interface Banker {
  id: string;
  name: string;
  bankName: string;
  branch: string;
  city: string;
  state: string;
  products: LoanProduct[];
  designation: string;
  mobile: string;
  email: string;
  payoutSharingRate?: number; // e.g. 0.85%
  activeStatus: 'Active' | 'Transferred' | 'Inactive';
  remarks?: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  code: string;
  name: string;
  agencyName: string;
  mobile: string;
  email: string;
  city: string;
  defaultCommissionRate: number; // e.g. 0.60%
  bankAccountNo: string;
  ifsc: string;
  panNumber: string;
  status: 'Active' | 'Suspended';
  joinedDate: string;
}

export interface LoanFile {
  id: string;
  fileNo: string;
  borrowerName: string;
  agentId: string;
  agentName: string;
  bankName: string;
  product: LoanProduct;
  loanAmount: number;
  sanctionDate: string;
  disbursedDate: string;
  status: FileStatus;
  bankOfficerName: string;
  bankOfficerMobile?: string;
  city: string;
  
  // Bank Payout Economics
  bankPayoutRate: number; // in % e.g. 1.20%
  bankPayoutAmount: number; // loanAmount * bankPayoutRate / 100
  bankPayoutReceived: number; // actual received in bank account
  bankPayoutStatus: BankPayoutStatus;
  bankPayoutReceivedDate?: string;
  bankRefNo?: string;

  // Agent Payout Economics
  agentPayoutRate: number; // in % e.g. 0.70%
  agentPayoutAmount: number; // loanAmount * agentPayoutRate / 100
  agentPayoutPaid: number;
  agentPayoutStatus: AgentPayoutStatus;
  agentPayoutPaidDate?: string;
  agentPaymentRef?: string;

  // Reconciliation
  isReconciled: boolean;
  reconciliationNotes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  category: 
    | 'Bank Commission Received'
    | 'Agent Commission Paid'
    | 'TDS Deducted'
    | 'Incentive / Bonus'
    | 'Clawback / Deduction'
    | 'Operational Expense';
  bankName: string;
  agentId?: string;
  agentName?: string;
  fileNo?: string;
  amount: number;
  paymentMode: 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'IMPS' | 'Direct Transfer';
  referenceNo: string;
  description: string;
  reconciledStatus: 'Matched' | 'Pending' | 'Mismatch';
}

export interface MonthlyReconciliation {
  id: string;
  monthYear: string; // "2026-10"
  bankName: string;
  totalDisbursedVolume: number;
  expectedBankPayout: number;
  receivedBankPayout: number;
  variance: number;
  agentCommissionCalculated: number;
  agentCommissionPaid: number;
  reconciledFilesCount: number;
  unreconciledFilesCount: number;
  status: 'Fully Reconciled' | 'Discrepancy Detected' | 'Under Review';
  lastReconciledAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category?: 'large_transaction' | 'reconciliation_completed' | 'negative_balance' | 'system';
  timestamp: string;
  read: boolean;
  emailSent?: boolean;
  emailRecipient?: string;
  amount?: number;
  actionLink?: string;
}

export interface NotificationSettings {
  largeTransactionThreshold: number; // in INR e.g. 50000
  enableEmailAlerts: boolean;
  alertEmail: string;
  notifyOnReconciliation: boolean;
  notifyOnNegativeBalance: boolean;
  notifyOnLargeTransaction: boolean;
}
