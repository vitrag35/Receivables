export type PaymentType = 'CHECK' | 'CASH' | 'CREDIT_CARD' | 'WIRE' | 'ACH' | 'MONEY_ORDER' | 'ZELLE' | 'OTHER';
export type PaymentStatus = 'UNAPPLIED' | 'PARTIAL' | 'APPLIED';
export type ChargeStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type FinanceChargeFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
export type FinanceChargeStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Charge {
  id: string;
  num: string;
  ref: string;
  date: string;
  due: string;
  amount: number;
  paid: number;
  isPOS?: boolean; // true if from POS system
}

export interface FinanceChargeConfig {
  id: string;
  annualInterestRate: number; // percentage, e.g., 18
  daysUntilInterestApplies: number; // e.g., 30
  calculationFrequency: FinanceChargeFrequency;
  minimumChargeAmount: number; // minimum interest to create entry, e.g., 1.00
  lastRunDate: string | null; // ISO date
  isEnabled: boolean;
}

export interface FinanceCharge {
  id: string;
  customerId: string;
  chargeId: string; // reference to original invoice
  calculationDate: string; // when the charge was calculated
  periodStartDate: string; // first day of interest calculation period
  periodEndDate: string; // last day of interest calculation period
  principalAmount: number; // amount the interest was calculated on
  interestRate: number; // annual rate used for calculation
  interestAmount: number; // calculated interest
  status: FinanceChargeStatus;
  paid: number; // amount of finance charge paid so far
  notes?: string;
  createdDate: string;
  isOverride?: boolean; // true if manually entered override, false if auto-calculated
  overrideBefore?: number; // previous charge amount before this override
}

export interface FinanceChargeLogEntry {
  customerId: string;
  chargeCount: number;
  totalAmount: number;
}

export interface FinanceChargeLog {
  id: string;
  runDate: string;
  totalChargesCreated: number;
  totalInterestAmount: number;
  chargesProcessed: FinanceChargeLogEntry[];
  errorLog?: string[];
}

export interface Payment {
  id: string;
  customerId: string;
  date: string;
  type: PaymentType;
  ref: string;
  checkDate?: string;
  amount: number;
  applied: number;
  notes?: string;
  depositId?: string;
  isDeposited?: boolean;
  user?: string;
  transactionType: 'PAYMENT' | 'RETURNED_CHECK';
  isPOS?: boolean; // true if from POS system
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

export type DepositStatus = 'POSTED';

export interface Deposit {
  id: string;
  depositId: string;
  depositDate: string;
  batch: string;
  reference: string;
  paymentIds: string[];
  adjustmentIds: string[];
  returnCheckIds: string[];
  paymentTotal: number;
  adjustmentTotal: number;
  returnCheckTotal: number;
  amount: number;
  status: DepositStatus;
  createdDate: string;
  isDeleted?: boolean;
  deletedDate?: string;
  transactionSource?: 'AR' | 'POS'; // posted A/R or posted POS
}

export type CreditType = 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';

export interface CreditEntry {
  id: string;
  customerId: string;
  type: 'ADJUSTMENT' | 'RETURN' | 'DISCOUNT';
  date: string;
  reason: string;
  amount: number;
  applied: number;
  ref: string;
  user?: string;
  isPOS?: boolean; // true if from POS system
}

export type DeletedEntryType = 'PAYMENT' | 'ADJUSTMENT' | 'REFUND' | 'RETURNED_CHECK';

export interface DeletedEntry {
  id: string;
  entryId: string;
  entryType: DeletedEntryType;
  customerName: string;
  customerId: string;
  amount: number;
  date: string;
  deletedDate: string;
  reason: string;
  reference?: string;
  documentNum?: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  user?: string;
  charges: Charge[];
  payments: Payment[];
  creditEntries: CreditEntry[];
  applications: Application[];
  deletedEntries: DeletedEntry[];
  deposits: Deposit[];
  financeCharges: FinanceCharge[];
}

export const USERS = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Anderson'];

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

export const DEFAULT_FINANCE_CHARGE_CONFIG: FinanceChargeConfig = {
  id: 'fcc-default',
  annualInterestRate: 18,
  daysUntilInterestApplies: 30,
  calculationFrequency: 'MONTHLY',
  minimumChargeAmount: 1.0,
  lastRunDate: '2024-03-01',
  isEnabled: true,
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
      { id: 'p1', customerId: 'c1', date: '2024-03-08', type: 'CHECK', ref: 'CHK-1024', amount: 1500, applied: 1500, notes: '', user: 'John Smith', transactionType: 'PAYMENT' },
      { id: 'p2', customerId: 'c1', date: '2024-03-20', type: 'ACH', ref: 'ACH-5544', amount: 2500, applied: 0, notes: 'Customer deposit', user: 'Sarah Johnson', transactionType: 'PAYMENT' },
    ],
    creditEntries: [
      { id: 'ce1', customerId: 'c1', type: 'ADJUSTMENT', date: '2024-03-22', reason: 'Volume discount', amount: 250, applied: 0, ref: 'ADJ-001', user: 'John Smith' },
    ],
    applications: [
      { id: 'a1', paymentId: 'p1', chargeId: 'i3', amount: 1500, appliedDate: '2024-03-08' },
    ],
    deletedEntries: [],
    deposits: [],
    financeCharges: [
      { id: 'fc1', customerId: 'c1', chargeId: 'i1', calculationDate: '2024-03-01', periodStartDate: '2024-02-15', periodEndDate: '2024-03-01', principalAmount: 1500, interestRate: 18, interestAmount: 22.50, status: 'UNPAID', paid: 0, createdDate: '2024-03-01' },
      { id: 'fc2', customerId: 'c1', chargeId: 'i2', calculationDate: '2024-03-01', periodStartDate: '2024-03-10', periodEndDate: '2024-03-01', principalAmount: 2200, interestRate: 18, interestAmount: 17.60, status: 'UNPAID', paid: 0, createdDate: '2024-03-01' },
    ],
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
      { id: 'p3', customerId: 'c2', date: '2024-03-10', type: 'WIRE', ref: 'WIRE-789', amount: 3800, applied: 3800, notes: '', user: 'Mike Davis', transactionType: 'PAYMENT' },
    ],
    creditEntries: [
      { id: 'ce2', customerId: 'c2', type: 'ADJUSTMENT', date: '2024-03-15', reason: 'Late fee waived', amount: 100, applied: 0, ref: 'ADJ-002', user: 'Sarah Johnson' },
    ],
    applications: [
      { id: 'a2', paymentId: 'p3', chargeId: 'i5', amount: 3800, appliedDate: '2024-03-10' },
    ],
    deletedEntries: [],
    deposits: [],
    financeCharges: [
      { id: 'fc3', customerId: 'c2', chargeId: 'i4', calculationDate: '2024-03-01', periodStartDate: '2024-03-01', periodEndDate: '2024-03-01', principalAmount: 5200, interestRate: 18, interestAmount: 78.00, status: 'UNPAID', paid: 0, createdDate: '2024-03-01' },
    ],
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
      { id: 'p4', customerId: 'c3', date: '2024-02-25', type: 'CASH', ref: 'CASH-001', amount: 2000, applied: 2000, notes: 'In person', user: 'Lisa Anderson', transactionType: 'PAYMENT' },
      { id: 'p5', customerId: 'c3', date: '2024-03-15', type: 'CREDIT_CARD', ref: 'CC-1234-5678', amount: 4500, applied: 0, notes: 'Via Stripe', user: 'John Smith', transactionType: 'PAYMENT' },
      { id: 'p6', customerId: 'c3', date: '2024-03-18', type: 'CHECK', ref: 'CHK-5555', checkDate: '2024-03-18', amount: 1200, applied: 0, notes: 'Returned check', user: 'Mike Davis', transactionType: 'RETURNED_CHECK' },
    ],
    creditEntries: [
      { id: 'ce3', customerId: 'c3', type: 'ADJUSTMENT', date: '2024-03-20', reason: 'Discount', amount: 500, applied: 0, ref: 'ADJ-003', user: 'Lisa Anderson' },
    ],
    applications: [
      { id: 'a3', paymentId: 'p4', chargeId: 'i6', amount: 2000, appliedDate: '2024-02-25' },
    ],
    deletedEntries: [],
    deposits: [],
    financeCharges: [
      { id: 'fc4', customerId: 'c3', chargeId: 'i6', calculationDate: '2024-03-01', periodStartDate: '2024-02-20', periodEndDate: '2024-03-01', principalAmount: 2500, interestRate: 18, interestAmount: 37.50, status: 'UNPAID', paid: 0, createdDate: '2024-03-01' },
    ],
  },
};
