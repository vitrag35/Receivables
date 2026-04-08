'use client';

import { useState } from 'react';
import { Customer, PaymentApplication } from '@/lib/ar-data';
import DirectApplyModal from '../modals/direct-apply-modal';
import PaymentTransactionHistoryModal from '../modals/payment-transaction-history-modal';

interface RefundsTabProps {
  customer: Customer;
  onDeleteCreditEntry: (entryId: string) => void;
  onAddCreditEntry?: (entry: any) => void;
  onApplyPayment?: (applications: PaymentApplication[]) => void;
  onUnapplyPayment: (applicationId: string) => void;
}

export default function RefundsTab({
  customer,
  onDeleteCreditEntry,
  onAddCreditEntry,
  onApplyPayment,
  onUnapplyPayment,
}: RefundsTabProps) {
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [deletingRefundId, setDeletingRefundId] = useState<string | null>(null);
  const [showUnappliedOnly, setShowUnappliedOnly] = useState(false);

  // Get negative adjustments (credit memo)
  const refunds = customer.creditEntries.filter((entry) => entry.type === 'REFUND');
  const displayedRefunds = showUnappliedOnly
    ? refunds.filter((r) => r.amount - r.applied > 0)
    : refunds;
  const selectedRefund = refunds.find((r) => r.id === selectedRefundId);

  const getRefundStatusColor = (applied: number, total: number) => {
    if (applied === 0) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (applied < total) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  const handleUnapplyAll = () => {
    const refundApplications = customer.applications.filter((a) => a.paymentId === selectedRefundId);
    if (refundApplications.length === 0) {
      return;
    }
    refundApplications.forEach((app) => {
      onUnapplyPayment(app.id);
    });
  };

  const handleDelete = () => {
    const refund = refunds.find((r) => r.id === selectedRefundId);
    if (!refund) return;

    // Check if applied
    const hasApplications = customer.applications.some((app) => app.paymentId === selectedRefundId);
    if (hasApplications) {
      setDeletingRefundId(null);
      return;
    }

    onDeleteCreditEntry(selectedRefundId);
    setSelectedRefundId(null);
    setDeletingRefundId(null);
  };

  return (
    <>
      <div className="mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700">Credits</h3>
          <p className="text-xs text-gray-500 mt-1">Click a row to select a credit.</p>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-2 mb-4 mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnappliedOnly}
              onChange={(e) => setShowUnappliedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            Show unapplied only
          </label>
        </div>

        {selectedRefundId && (
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-blue-700 font-semibold flex-1">Refund {selectedRefund?.ref} selected</span>
            {selectedRefund?.applied > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
              >
                View History
              </button>
            )}
            {selectedRefund && selectedRefund.amount - selectedRefund.applied > 0 && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-3 py-1 bg-teal-50 text-teal-700 rounded text-xs font-semibold hover:bg-teal-100 border border-teal-200"
              >
                Apply
              </button>
            )}
            {selectedRefund?.applied > 0 && (
              <button
                onClick={handleUnapplyAll}
                className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200"
              >
                Unapply All
              </button>
            )}
            {deletingRefundId === selectedRefundId ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeletingRefundId(null)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (selectedRefund) {
                    const hasApplications = customer.applications.some((app) => app.paymentId === selectedRefundId);
                    if (!hasApplications) {
                      setDeletingRefundId(selectedRefundId);
                    }
                  }
                }}
                disabled={!selectedRefund || customer.applications.some((app) => app.paymentId === selectedRefundId)}
                className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            )}
            <button
              onClick={() => setSelectedRefundId(null)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
            >
              Deselect
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {displayedRefunds.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">
            {showUnappliedOnly ? 'No unapplied credits.' : 'No credits yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-teal-700 text-white">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Record ID</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Document #</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Applied</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Available</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Deposited</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Deposit Date</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase">POS</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedRefunds.map((refund) => {
                const status =
                  refund.applied === 0
                    ? 'UNAPPLIED'
                    : refund.applied < refund.amount
                    ? 'PARTIAL'
                    : 'APPLIED';
                
                // Find deposit info
                const deposit = customer.deposits.find((d) => !d.isDeleted && d.adjustmentIds?.includes(refund.id));

                return (
                  <tr
                    key={refund.id}
                    onClick={() => setSelectedRefundId(refund.id)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedRefundId === refund.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{refund.id}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
                        C
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm font-mono">{refund.ref || '-'}</td>
                    <td className="px-4 py-3 text-gray-800 text-sm">{refund.date}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">${refund.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-700">${refund.applied.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      ${(refund.amount - refund.applied).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {refund.isDeposited || deposit ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Yes</span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{deposit?.depositDate || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {refund.isPOS ? (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Yes</span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded border ${getRefundStatusColor(
                          refund.applied,
                          refund.amount
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
      )}

      {selectedRefundId && (
        <DirectApplyModal
          customer={customer}
          paymentId={selectedRefundId}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onApplyPayment={onApplyPayment || (() => {})}
        />
      )}

      {selectedRefundId && (
        <PaymentTransactionHistoryModal
          customer={customer}
          paymentId={selectedRefundId}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          onUnapplyPayment={onUnapplyPayment}
        />
      )}
    </>
  );
}
