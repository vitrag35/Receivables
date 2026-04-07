'use client';

import { useState } from 'react';
import { Customer, PAYMENT_TYPE_LABELS, PaymentStatus, Payment, PaymentApplication } from '@/lib/ar-data';
import NewPaymentModal from '../modals/new-payment-modal';
import DirectApplyModal from '../modals/direct-apply-modal';
import PaymentTransactionHistoryModal from '../modals/payment-transaction-history-modal';
import ReceiptModal from '../modals/receipt-modal';

interface PaymentsTabProps {
  customer: Customer;
  onAddPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  onApplyPayment?: (applications: PaymentApplication[]) => void;
  onUnapplyPayment?: (applicationId: string) => void;
}

export default function PaymentsTab({ customer, onAddPayment, onDeletePayment, onApplyPayment, onUnapplyPayment }: PaymentsTabProps) {
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const selectedPayment = customer.payments.find((p) => p.id === selectedPaymentId);

  const getPaymentStatus = (payment: typeof customer.payments[0]): PaymentStatus => {
    if (payment.applied === 0) return 'UNAPPLIED';
    if (payment.applied < payment.amount) return 'PARTIAL';
    return 'APPLIED';
  };

  const getStatusBadgeColor = (status: PaymentStatus) => {
    switch (status) {
      case 'UNAPPLIED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'PARTIAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'APPLIED':
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const handleUnapplyAll = () => {
    const paymentApplications = customer.applications.filter((a) => a.paymentId === selectedPaymentId);
    if (paymentApplications.length === 0) {
      return;
    }
    paymentApplications.forEach((app) => {
      onUnapplyPayment?.(app.id);
    });
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700">Payments</h3>
            <p className="text-xs text-gray-500 mt-1">Click a row to select a payment.</p>
          </div>
          <button
            onClick={() => setShowNewPaymentModal(true)}
            className="px-4 py-2 bg-teal-700 text-white rounded font-semibold text-sm hover:bg-teal-600 transition-colors"
          >
            + New Payment
          </button>
        </div>

        {selectedPaymentId && (
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-blue-700 font-semibold flex-1">Payment {selectedPayment?.ref} selected</span>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold hover:bg-green-100 border border-green-200"
            >
              Print/Email Receipt
            </button>
            {selectedPayment?.applied > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
              >
                View History
              </button>
            )}
            {selectedPayment && selectedPayment.amount - selectedPayment.applied > 0 && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-3 py-1 bg-teal-50 text-teal-700 rounded text-xs font-semibold hover:bg-teal-100 border border-teal-200"
              >
                Apply
              </button>
            )}
            {selectedPayment?.applied > 0 && (
              <button
                onClick={handleUnapplyAll}
                className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200"
              >
                Unapply All
              </button>
            )}
            {deletingPaymentId === selectedPaymentId ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDeletePayment(selectedPaymentId);
                    setSelectedPaymentId(null);
                    setDeletingPaymentId(null);
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeletingPaymentId(null)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (selectedPayment && selectedPayment.amount - selectedPayment.applied === selectedPayment.amount) {
                    setDeletingPaymentId(selectedPaymentId);
                  }
                }}
                disabled={!selectedPayment || selectedPayment.amount - selectedPayment.applied !== selectedPayment.amount || selectedPayment.isDeposited}
                title={selectedPayment?.isDeposited ? 'Cannot delete a deposited payment' : ''}
                className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            )}
            <button
              onClick={() => setSelectedPaymentId(null)}
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
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Check Date</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Posting Date</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Applied</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Unapplied Credit</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Deposit ID</th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {customer.payments.map((payment) => {
              const status = getPaymentStatus(payment);
              const unapplied = payment.amount - payment.applied;
              return (
                <tr
                  key={payment.id}
                  onClick={() => setSelectedPaymentId(payment.id)}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedPaymentId === payment.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-600">{payment.checkDate || '-'}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{payment.date}</td>
                  <td className="px-4 py-3 text-gray-600">{PAYMENT_TYPE_LABELS[payment.type]}</td>
                  <td className="px-4 py-3 text-gray-600">{payment.ref}</td>
                  <td className="px-4 py-3 text-right text-gray-800 font-bold">${payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">${payment.applied.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">${unapplied.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {payment.depositId ? (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {customer.deposits.find((d) => d.id === payment.depositId)?.depositId || 'Unknown'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
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

      <NewPaymentModal
        customer={customer}
        isOpen={showNewPaymentModal}
        onClose={() => setShowNewPaymentModal(false)}
        onAddPayment={onAddPayment}
      />

      {selectedPaymentId && (
        <DirectApplyModal
          customer={customer}
          paymentId={selectedPaymentId}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onApplyPayment={onApplyPayment || (() => {})}
        />
      )}

      {selectedPaymentId && (
        <PaymentTransactionHistoryModal
          customer={customer}
          paymentId={selectedPaymentId}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          onUnapplyPayment={onUnapplyPayment}
        />
      )}

      {selectedPayment && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          item={selectedPayment}
          itemType={selectedPayment.transactionType === 'RETURNED_CHECK' ? 'RETURNED_CHECK' : 'PAYMENT'}
          customerName={customer.name}
        />
      )}
    </>
  );
}
