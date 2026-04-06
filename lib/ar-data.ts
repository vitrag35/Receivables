export type PaymentType = 'CHECK' | 'CASH' | 'CREDIT_CARD' | 'WIRE' | 'ACH' | 'MONEY_ORDER' | 'ZELLE' | 'OTHER';
export type PaymentStatus = 'UNAPPLIED' | 'PARTIAL' | 'APPLIED';
export type ChargeStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Charge {
  id: string;
  num: string;
  ref: string;
  date: string;
  due: string;
  amount: number;
  paid: number;
}

export interface Payment {
  id: string;
  date: string;
  type: PaymentType;
  ref: string;
  checkDate?: string;
  amount: number;
  applied: number;
  notes?: string;
  depositId?: string;
  isDeposited?: boolean;
}

export interface Application {
  id: string;
  paymentId: string;
  chargeId: string;
  amount: number;
  appliedDate?: string;
  date?: string;
}

export type PaymentApplication = Application;

export type DepositStatus = 'PENDING' | 'FINALIZED';

export interface Deposit {
  id: string;
  depositId: string;
  date: string;
  amount: number;
  paymentIds: string[];
  status: DepositStatus;
  createdDate: string;
}

export type CreditType = 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';

export interface CreditEntry {
  id: string;
  type: CreditType;
  date: string;
  reason?: string;
  amount: number;
  applied: number;
  ref?: string;
  isDeleted?: boolean;
  deletedDate?: string;
  notes?: string;
}

export interface DeletedEntry {
  id: string;
  entryId: string;
  entryType: CreditType;
  customerName: string;
  amount: number;
  deletedDate: string;
  reason: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  charges: Charge[];
  payments: Payment[];
  creditEntries: CreditEntry[];
  applications: Application[];
  deletedEntries: DeletedEntry[];
  deposits: Deposit[];
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CHECK: 'Check (C)',
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  WIRE: 'Wire Transfer',
  ACH: 'ACH / EFT',
  MONEY_ORDER: 'Money Order',
  ZELLE: 'Zelle',
  OTHER: 'Other',
};

export const DB: Record<string, Customer> = {
  c1: {
    id: 'c1',
    name: 'Acme Corp',
    code: 'C001',
    charges: [
      { id: 'i1', num: 'INV-2024-001', ref: 'PO-4421', date: '2024-01-15', due: '2024-02-15', amount: 1500, paid: 0 },
      { id: 'i2', num: 'INV-2024-002', ref: 'PO-4422', date: '2024-02-10', due: '2024-03-10', amount: 2200, paid: 0 },
      { id: 'i3', num: 'INV-2024-003', ref: 'PO-4455', date: '2024-03-05', due: '2024-04-05', amount: 3100, paid: 1500 },
    ],
    payments: [
      { id: 'p1', date: '2024-03-08', type: 'CHECK', ref: 'CHK-1024', amount: 1500, applied: 1500, notes: '' },
      { id: 'p2', date: '2024-03-20', type: 'ACH', ref: 'ACH-5544', amount: 2500, applied: 0, notes: 'Customer deposit' },
    ],
    creditEntries: [],
    applications: [
      { id: 'a1', paymentId: 'p1', chargeId: 'i3', amount: 1500, appliedDate: '2024-03-08' },
    ],
    deletedEntries: [],
    deposits: [],
  },
  c2: {
    id: 'c2',
    name: 'BuildRight LLC',
    code: 'C002',
    charges: [
      { id: 'i4', num: 'INV-2024-010', ref: 'PO-5500', date: '2024-02-01', due: '2024-03-01', amount: 5200, paid: 0 },
      { id: 'i5', num: 'INV-2024-011', ref: 'PO-5501', date: '2024-02-15', due: '2024-03-15', amount: 3800, paid: 3800 },
    ],
    payments: [
      { id: 'p3', date: '2024-03-10', type: 'WIRE', ref: 'WIRE-789', amount: 3800, applied: 3800, notes: '' },
    ],
    creditEntries: [],
    applications: [
      { id: 'a2', paymentId: 'p3', chargeId: 'i5', amount: 3800, appliedDate: '2024-03-10' },
    ],
    deletedEntries: [],
    deposits: [],
  },
  c3: {
    id: 'c3',
    name: 'Creative Studio',
    code: 'C003',
    charges: [
      { id: 'i6', num: 'INV-2024-020', ref: 'PO-6600', date: '2024-01-20', due: '2024-02-20', amount: 4500, paid: 2000 },
      { id: 'i7', num: 'INV-2024-021', ref: 'PO-6601', date: '2024-02-20', due: '2024-03-20', amount: 3200, paid: 0 },
    ],
    payments: [
      { id: 'p4', date: '2024-02-25', type: 'CASH', ref: 'CASH-001', amount: 2000, applied: 2000, notes: 'In person' },
      { id: 'p5', date: '2024-03-15', type: 'CREDIT_CARD', ref: 'CC-1234-5678', amount: 4500, applied: 0, notes: 'Via Stripe' },
    ],
    creditEntries: [],
    applications: [
      { id: 'a3', paymentId: 'p4', chargeId: 'i6', amount: 2000, appliedDate: '2024-02-25' },
    ],
    deletedEntries: [],
    deposits: [],
  },
};
