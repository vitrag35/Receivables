'use client';

import { Customer } from '@/lib/ar-data';

interface DepositDetailModalProps {
  customer: Customer;
  depositId: string;
  isOpen: boolean;
  onClose: () => void;
  onFinalizeDeposit: (depositId: string) => void;
  onRemoveFromDeposit: (depositId: string, paymentId: string) => void;
}

export default function DepositDetailModal({
  customer,
  depositId,
  isOpen,
  onClose,
  onFinalizeDeposit,
  onRemoveFromDeposit,
}: DepositDetailModalProps) {
  const deposit = customer.deposits.find((d) => d.id === depositId);

  if (!isOpen || !deposit) return null;

  const depositPayments = customer.payments.filter((p) => deposit.paymentIds.includes(p.id));
  const isFinalized = deposit.status === 'FINALIZED';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 text-white border-b border-teal-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{deposit.depositId}</h2>
            <p className="text-sm text-teal-100 mt-1">Deposit Created: {deposit.createdDate}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-teal-800 rounded-full p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Deposit Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 uppercase font-semibold">Deposit Date</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{deposit.date}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 uppercase font-semibold">Total Amount</p>
              <p className="text-xl font-bold text-gray-800 mt-1">${deposit.amount.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 uppercase font-semibold">Status</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  isFinalized ? 'text-green-700' : 'text-yellow-700'
                }`}
              >
                {deposit.status}
              </p>
            </div>
          </div>

          {/* Status Warning */}
          {isFinalized && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-sm text-green-700 font-semibold">
                ✓ This deposit has been finalized and cannot be modified. All payments are locked.
              </p>
            </div>
          )}

          {/* Payments in Deposit */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Payments in Deposit ({deposit.paymentIds.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Posting Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Applied</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Unapplied</th>
                    {!isFinalized && <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {depositPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">{payment.date}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {payment.type === 'CHECK' ? 'Check' : payment.type === 'ACH' ? 'ACH' : payment.type === 'WIRE' ? 'Wire' : payment.type}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{payment.ref}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-bold">${payment.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">${payment.applied.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">${(payment.amount - payment.applied).toFixed(2)}</td>
                      {!isFinalized && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onRemoveFromDeposit(depositId, payment.id)}
                            className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100 border border-red-200"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {!isFinalized && (
            <button
              onClick={() => {
                onFinalizeDeposit(depositId);
                onClose();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors"
            >
              Finalize Deposit
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold text-sm hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
