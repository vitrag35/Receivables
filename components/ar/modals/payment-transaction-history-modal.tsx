'use client';

import { useState } from 'react';
import { Customer, PAYMENT_TYPE_LABELS } from '@/lib/ar-data';

interface PaymentTransactionHistoryModalProps {
  customer: Customer;
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
  onUnapplyPayment?: (applicationId: string) => void;
}

export default function PaymentTransactionHistoryModal({
  customer,
  paymentId,
  isOpen,
  onClose,
  onUnapplyPayment,
}: PaymentTransactionHistoryModalProps) {
  const [unapplyingId, setUnapplyingId] = useState<string | null>(null);

  // Get the payment/credit entry
  const payment = customer.payments.find((p) => p.id === paymentId) || customer.creditEntries.find((c) => c.id === paymentId);
  
  if (!isOpen || !payment) return null;

  const applications = customer.applications.filter((a) => a.paymentId === paymentId);
  const isPayment = 'type' in payment && typeof (payment as any).type === 'string' && ['CHECK', 'ACH', 'WIRE', 'CASH', 'CREDIT_CARD'].includes((payment as any).type);

  const handleUnapply = (applicationId: string) => {
    onUnapplyPayment?.(applicationId);
    setUnapplyingId(null);
  };

  const unappliedAmount = payment.amount - payment.applied;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-screen overflow-y-auto shadow-xl">
        <div className="border-b border-gray-200 p-6 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-teal-700">Transaction History</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600 leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Payment/Credit Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 flex gap-6 flex-wrap">
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Date</div>
              <div className="font-bold text-gray-800">{payment.date}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Type</div>
              <div className="font-bold text-gray-800">
                {isPayment ? PAYMENT_TYPE_LABELS[(payment as any).type] : (payment as any).type}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Reference</div>
              <div className="font-bold text-gray-800">{payment.ref}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Total Amount</div>
              <div className="font-bold text-gray-800">${payment.amount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Applied</div>
              <div className="font-bold text-teal-700">${payment.applied.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Unapplied</div>
              <div className={`font-bold ${unappliedAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ${unappliedAmount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="text-xs uppercase text-gray-600 font-bold mb-3 tracking-wide">Applied To Charges</div>

          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No applications found for this payment.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-700 text-white">
                      <th className="px-3 py-2 text-left font-semibold text-xs uppercase">Invoice #</th>
                      <th className="px-3 py-2 text-left font-semibold text-xs uppercase">Applied Date</th>
                      <th className="px-3 py-2 text-right font-semibold text-xs uppercase">Amount Applied</th>
                      <th className="px-3 py-2 text-center font-semibold text-xs uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const charge = customer.charges.find((c) => c.id === app.chargeId);
                      return (
                        <tr key={app.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-800 font-mono">{charge?.num || '-'}</td>
                          <td className="px-3 py-2 text-gray-600">{app.appliedDate || app.date}</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-800">${app.amount.toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => setUnapplyingId(app.id)}
                              className="text-red-600 font-semibold text-xs hover:text-red-800"
                            >
                              Unapply
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {unapplyingId && (
                <div className="bg-red-50 border border-red-200 rounded px-4 py-3">
                  <h4 className="font-bold text-red-700 mb-3">Confirm Unapply</h4>
                  <div className="text-sm text-gray-700 mb-4">
                    <p className="mb-2">This action will:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Remove the application from the invoice</li>
                      <li>Credit the amount back to unapplied payment</li>
                      <li>Update the invoice balance</li>
                    </ul>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setUnapplyingId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-semibold text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUnapply(unapplyingId)}
                      className="px-4 py-2 bg-red-600 text-white rounded font-semibold text-sm hover:bg-red-700"
                    >
                      Yes, Unapply It
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-semibold text-sm hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
