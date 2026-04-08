'use client';

import { useState } from 'react';
import { Customer, ChargeStatus, PaymentApplication, CreditEntry, Charge, Payment } from '@/lib/ar-data';
import ApplyPaymentModal from '../modals/apply-payment-modal';
import TransactionHistoryModal from '../modals/transaction-history-modal';
import NewAdjustmentModal from '../modals/new-adjustment-modal';
import ReturnedCheckModal from '../modals/returned-check-modal';
import ReceiptModal from '../modals/receipt-modal';

interface ChargesTabProps {
  customer: Customer;
  onAddCharge: (charge: Charge) => void;
  onDeleteCharge: (chargeId: string) => void;
  onAddCreditEntry: (entry: CreditEntry) => void;
  onUnapplyPayment: (applicationId: string) => void;
  onApplyPayment?: (applications: PaymentApplication[]) => void;
}

// Combined type for displaying charges, positive adjustments, and returned checks
type ChargeItem = {
  id: string;
  num: string;
  ref: string;
  date: string;
  amount: number;
  paid: number;
  type: 'I' | 'A' | 'R'; // Invoice, Adjustment, Returned Check
  originalType: 'CHARGE' | 'ADJUSTMENT' | 'RETURNED_CHECK';
  isDeposited: boolean;
  depositDate: string | null;
  isPOS?: boolean; // true if from POS system
};

export default function ChargesTab({ customer, onAddCharge, onDeleteCharge, onAddCreditEntry, onUnapplyPayment, onApplyPayment }: ChargesTabProps) {
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showTxnHistoryModal, setShowTxnHistoryModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showReturnedCheckModal, setShowReturnedCheckModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<Payment | CreditEntry | null>(null);
  const [selectedReceiptType, setSelectedReceiptType] = useState<'PAYMENT' | 'RETURNED_CHECK' | 'ADJUSTMENT' | null>(null);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [deletingChargeId, setDeletingChargeId] = useState<string | null>(null);

  // Helper to find deposit info for a charge
  const getDepositInfo = (chargeId: string, isAdjustment: boolean) => {
    // For adjustments, check adjustmentIds in deposits
    if (isAdjustment) {
      const deposit = customer.deposits.find((d) => !d.isDeleted && d.adjustmentIds?.includes(chargeId));
      return deposit ? { isDeposited: true, depositDate: deposit.depositDate } : { isDeposited: false, depositDate: null };
    }
    // For returned checks, check returnCheckIds
    const rcDeposit = customer.deposits.find((d) => !d.isDeleted && d.returnCheckIds?.includes(chargeId));
    if (rcDeposit) {
      return { isDeposited: true, depositDate: rcDeposit.depositDate };
    }
    // For invoices, they don't get deposited directly
    return { isDeposited: false, depositDate: null };
  };

  // Combine charges, positive adjustments, and returned checks into a unified list
  const getCombinedCharges = (): ChargeItem[] => {
    const items: ChargeItem[] = [];

    // Add regular invoices
    customer.charges.forEach((charge) => {
      // Check if this is a returned check (starts with RC-)
      const isReturnedCheck = charge.num.startsWith('RC-');
      const depositInfo = getDepositInfo(charge.id, false);
      items.push({
        id: charge.id,
        num: charge.num,
        ref: charge.ref,
        date: charge.date,
        amount: charge.amount,
        paid: charge.paid,
        type: isReturnedCheck ? 'R' : 'I',
        originalType: isReturnedCheck ? 'RETURNED_CHECK' : 'CHARGE',
        isDeposited: depositInfo.isDeposited,
        depositDate: depositInfo.depositDate,
        isPOS: charge.isPOS,
      });
    });

    // Add positive adjustments (type === 'ADJUSTMENT' means it increases what customer owes)
    customer.creditEntries
      .filter((entry) => entry.type === 'ADJUSTMENT' && !entry.isDeleted)
      .forEach((adj) => {
        // Calculate how much has been paid/applied to this adjustment
        const appliedAmount = customer.applications
          .filter((app) => app.chargeId === adj.id)
          .reduce((sum, app) => sum + app.amount, 0);
        const depositInfo = getDepositInfo(adj.id, true);

        items.push({
          id: adj.id,
          num: adj.ref || `ADJ-${adj.id}`,
          ref: adj.reason || '',
          date: adj.date,
          amount: adj.amount,
          paid: appliedAmount,
          type: 'A',
          originalType: 'ADJUSTMENT',
          isDeposited: depositInfo.isDeposited,
          depositDate: depositInfo.depositDate,
          isPOS: adj.isPOS,
        });
      });

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  };

  const allCharges = getCombinedCharges();
  const displayedCharges = showUnpaidOnly 
    ? allCharges.filter((charge) => charge.amount - charge.paid > 0)
    : allCharges;

  const selectedCharge = allCharges.find((c) => c.id === selectedChargeId);
  const originalCharge = customer.charges.find((c) => c.id === selectedChargeId);

  const handleUnapplyAll = () => {
    const chargeApplications = customer.applications.filter((a) => a.chargeId === selectedChargeId);
    if (chargeApplications.length === 0) {
      return;
    }
    chargeApplications.forEach((app) => {
      onUnapplyPayment(app.id);
    });
  };

  const getChargeStatus = (charge: ChargeItem): ChargeStatus => {
    if (charge.paid === 0) return 'UNPAID';
    if (charge.paid < charge.amount) return 'PARTIAL';
    return 'PAID';
  };

  const getStatusBadgeColor = (status: ChargeStatus) => {
    switch (status) {
      case 'UNPAID':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PARTIAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PAID':
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getTypeBadgeColor = (type: 'I' | 'A' | 'R') => {
    switch (type) {
      case 'I':
        return 'bg-gray-100 text-gray-700';
      case 'A':
        return 'bg-purple-100 text-purple-700';
      case 'R':
        return 'bg-red-100 text-red-700';
    }
  };

  const getTypeLabel = (type: 'I' | 'A' | 'R') => {
    switch (type) {
      case 'I':
        return 'Invoice';
      case 'A':
        return 'Adjustment';
      case 'R':
        return 'Returned Check';
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700">Charges / Invoices</h3>
            <p className="text-xs text-gray-500 mt-1">Click a row to select an invoice.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReturnedCheckModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              + Record Returned Check
            </button>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              + New Adjustment
            </button>
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2 bg-teal-700 text-white rounded font-semibold text-sm hover:bg-teal-600 transition-colors"
            >
              Apply Payment to Charges
            </button>
          </div>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnpaidOnly}
              onChange={(e) => setShowUnpaidOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            Show unpaid only
          </label>
        </div>

        {selectedChargeId && (
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-blue-700 font-semibold flex-1">
              {selectedCharge?.type === 'I' ? 'Invoice' : selectedCharge?.type === 'A' ? 'Adjustment' : 'Returned Check'} {selectedCharge?.num} selected
            </span>
            {selectedCharge && selectedCharge.type === 'R' && (
              <button
                onClick={() => {
                  if (originalCharge) {
                    const tempPayment: Payment = {
                      id: originalCharge.id,
                      customerId: customer.id,
                      date: originalCharge.date,
                      type: 'CHECK',
                      ref: originalCharge.ref,
                      amount: originalCharge.amount,
                      applied: originalCharge.paid,
                      transactionType: 'RETURNED_CHECK',
                    };
                    setSelectedReceiptItem(tempPayment);
                    setSelectedReceiptType('RETURNED_CHECK');
                    setShowReceiptModal(true);
                  }
                }}
                className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold hover:bg-green-100 border border-green-200"
              >
                Print/Email Receipt
              </button>
            )}
            {selectedCharge?.originalType !== 'ADJUSTMENT' && (
              <button
                onClick={() => setShowTxnHistoryModal(true)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
              >
                View Transaction History
              </button>
            )}
            <button
              onClick={handleUnapplyAll}
              className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200"
            >
              Unapply All
            </button>
            {/* Delete button - only for Returned Checks and Adjustments that are not paid */}
            {selectedCharge && (selectedCharge.type === 'R' || selectedCharge.type === 'A') && (
              <>
                {deletingChargeId === selectedChargeId ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onDeleteCharge(selectedChargeId);
                        setSelectedChargeId(null);
                        setDeletingChargeId(null);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeletingChargeId(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (selectedCharge && selectedCharge.paid === 0 && !selectedCharge.isDeposited) {
                        setDeletingChargeId(selectedChargeId);
                      }
                    }}
                    disabled={selectedCharge.paid > 0 || selectedCharge.isDeposited}
                    title={selectedCharge.isDeposited ? 'Cannot delete a deposited record' : selectedCharge.paid > 0 ? 'Cannot delete a record with payments applied' : ''}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setSelectedChargeId(null)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
            >
              Deselect
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-700 text-white">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Record ID</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Document #</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount Paid</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Balance Due</th>
              <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Deposited</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Deposit Date</th>
              <th className="px-4 py-3 text-center font-semibold text-xs uppercase">POS</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayedCharges.map((charge) => {
              const status = getChargeStatus(charge);
              const balanceDue = charge.amount - charge.paid;
              return (
                <tr
                  key={charge.id}
                  onClick={() => setSelectedChargeId(charge.id)}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedChargeId === charge.id ? 'bg-blue-100 border-l-4 border-l-teal-700' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{charge.id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${getTypeBadgeColor(charge.type)}`}
                      title={getTypeLabel(charge.type)}
                    >
                      {charge.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{charge.num}</td>
                  <td className="px-4 py-3 text-gray-600">{charge.ref}</td>
                  <td className="px-4 py-3 text-gray-600">{charge.date}</td>
                  <td className="px-4 py-3 text-right text-gray-800 font-medium">${charge.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">${charge.paid.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">${balanceDue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {charge.isDeposited ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Yes</span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{charge.depositDate || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {charge.isPOS ? (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Yes</span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ApplyPaymentModal
        customer={customer}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onApplyPayment={onApplyPayment || (() => {})}
      />

      {originalCharge && (
        <TransactionHistoryModal
          customer={customer}
          charge={originalCharge}
          isOpen={showTxnHistoryModal}
          onClose={() => setShowTxnHistoryModal(false)}
          onUnapplyPayment={onUnapplyPayment}
        />
      )}

      <NewAdjustmentModal
        customer={customer}
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onAddAdjustment={onAddCreditEntry}
      />

      <ReturnedCheckModal
        customer={customer}
        isOpen={showReturnedCheckModal}
        onClose={() => setShowReturnedCheckModal(false)}
        onRecordReturnedCheck={onAddCharge}
      />

      {selectedReceiptItem && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          item={selectedReceiptItem}
          itemType={selectedReceiptType}
          customerName={customer.name}
        />
      )}
    </>
  );
}
