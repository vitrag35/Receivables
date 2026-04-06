'use client';

import { useState } from 'react';
import { Customer, ChargeStatus, PaymentApplication, CreditEntry, Charge } from '@/lib/ar-data';
import ApplyPaymentModal from '../modals/apply-payment-modal';
import TransactionHistoryModal from '../modals/transaction-history-modal';
import NewAdjustmentModal from '../modals/new-adjustment-modal';
import ReturnedCheckModal from '../modals/returned-check-modal';

interface ChargesTabProps {
  customer: Customer;
  onAddCharge: (charge: Charge) => void;
  onAddCreditEntry: (entry: CreditEntry) => void;
  onUnapplyPayment: (applicationId: string) => void;
  onApplyPayment?: (applications: PaymentApplication[]) => void;
}

export default function ChargesTab({ customer, onAddCharge, onAddCreditEntry, onUnapplyPayment, onApplyPayment }: ChargesTabProps) {
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showTxnHistoryModal, setShowTxnHistoryModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showReturnedCheckModal, setShowReturnedCheckModal] = useState(false);

  const selectedCharge = customer.charges.find((c) => c.id === selectedChargeId);

  const handleUnapplyAll = () => {
    const chargeApplications = customer.applications.filter((a) => a.chargeId === selectedChargeId);
    if (chargeApplications.length === 0) {
      return;
    }
    chargeApplications.forEach((app) => {
      onUnapplyPayment(app.id);
    });
  };

  const getChargeStatus = (charge: typeof customer.charges[0]): ChargeStatus => {
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

        {selectedChargeId && (
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-blue-700 font-semibold flex-1">Invoice {selectedCharge?.num} selected</span>
            <button
              onClick={() => setShowTxnHistoryModal(true)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
            >
              View Transaction History
            </button>
            <button
              onClick={handleUnapplyAll}
              className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200"
            >
              Unapply All
            </button>
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
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Invoice #</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Invoice Date</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Due Date</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Invoice Amount</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount Paid</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Balance Due</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {customer.charges.map((charge) => {
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
                  <td className="px-4 py-3 text-gray-800 font-medium">{charge.num}</td>
                  <td className="px-4 py-3 text-gray-600">{charge.ref}</td>
                  <td className="px-4 py-3 text-gray-600">{charge.date}</td>
                  <td className="px-4 py-3 text-gray-600">{charge.due}</td>
                  <td className="px-4 py-3 text-right text-gray-800 font-medium">${charge.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">${charge.paid.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">${balanceDue.toFixed(2)}</td>
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

      {selectedCharge && (
        <TransactionHistoryModal
          customer={customer}
          charge={selectedCharge}
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
    </>
  );
}
