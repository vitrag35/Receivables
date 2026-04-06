'use client';

import { useState } from 'react';
import { Customer, Charge, PAYMENT_TYPE_LABELS } from '@/lib/ar-data';

interface TransactionHistoryModalProps {
  customer: Customer;
  charge: Charge;
  isOpen: boolean;
  onClose: () => void;
  onUnapplyPayment?: (applicationId: string) => void;
}

export default function TransactionHistoryModal({
  customer,
  charge,
  isOpen,
  onClose,
  onUnapplyPayment,
}: TransactionHistoryModalProps) {
  const [unapplyingId, setUnapplyingId] = useState<string | null>(null);

  const applications = customer.applications.filter((a) => a.chargeId === charge.id);

  const handleUnapply = (applicationId: string) => {
    onUnapplyPayment?.(applicationId);
    setUnapplyingId(null);
  };

  if (!isOpen) return null;

  const balanceDue = charge.amount - charge.paid;

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
          {/* Invoice Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 flex gap-6 flex-wrap">
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Invoice #</div>
              <div className="font-bold text-gray-800">{charge.num}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Invoice Date</div>
              <div className="font-bold text-gray-800">{charge.date}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Due Date</div>
              <div className="font-bold text-gray-800">{charge.due}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Invoice Amount</div>
              <div className="font-bold text-gray-800">${charge.amount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Amount Paid</div>
              <div className="font-bold text-gray-800">${charge.paid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-semibold text-gray-600 mb-1">Balance Due</div>
              <div className={`font-bold ${balanceDue > 0 ? 'text-red-700' : 'text-green-600'}`}>
                ${balanceDue.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="text-xs uppercase text-gray-600 font-bold mb-3 tracking-wide">Payment Applications</div>

          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No payment applications found for this invoice.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-700 text-white">
                      <th className="px-3 py-2 text-left font-semibold text-xs uppercase">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-xs uppercase">Payment Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-xs uppercase">Reference</th>
                      <th className="px-3 py-2 text-right font-semibold text-xs uppercase">Amount Applied</th>
                      <th className="px-3 py-2 text-center font-semibold text-xs uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const payment = customer.payments.find((p) => p.id === app.paymentId);
                      return (
                        <tr key={app.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-800">{app.appliedDate || app.date}</td>
                          <td className="px-3 py-2 text-gray-600">{payment ? PAYMENT_TYPE_LABELS[payment.type] : '-'}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{payment?.ref}</td>
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
                      <li>Remove the payment application from this invoice</li>
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
