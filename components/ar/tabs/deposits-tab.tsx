'use client';

import { useState } from 'react';
import { Customer, Payment, DepositStatus } from '@/lib/ar-data';
import DepositDetailModal from '@/components/ar/modals/deposit-detail-modal';

interface DepositsTabProps {
  customer: Customer;
  onCreateDeposit: (paymentIds: string[]) => void;
  onFinalizeDeposit: (depositId: string) => void;
  onRemoveFromDeposit: (depositId: string, paymentId: string) => void;
}

export default function DepositsTab({ customer, onCreateDeposit, onFinalizeDeposit, onRemoveFromDeposit }: DepositsTabProps) {
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);

  // Get undeposited payments
  const unDepositedPayments = customer.payments.filter((p) => !p.isDeposited);
  const selectedPaymentTotal = customer.payments
    .filter((p) => selectedPaymentIds.has(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  const togglePaymentSelection = (paymentId: string) => {
    const newSelected = new Set(selectedPaymentIds);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPaymentIds(newSelected);
  };

  const handleCreateDeposit = () => {
    if (selectedPaymentIds.size > 0) {
      onCreateDeposit(Array.from(selectedPaymentIds));
      setSelectedPaymentIds(new Set());
    }
  };

  const getDepositBadgeColor = (status: DepositStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'FINALIZED':
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Create Deposit Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Create New Deposit</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-blue-700 font-semibold">
                {selectedPaymentIds.size} payment{selectedPaymentIds.size !== 1 ? 's' : ''} selected
                {selectedPaymentIds.size > 0 && ` - Total: $${selectedPaymentTotal.toFixed(2)}`}
              </span>
            </div>
            <div className="flex gap-2">
              {selectedPaymentIds.size > 0 && (
                <button
                  onClick={() => setSelectedPaymentIds(new Set())}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200"
                >
                  Clear Selection
                </button>
              )}
              <button
                onClick={handleCreateDeposit}
                disabled={selectedPaymentIds.size === 0}
                className="px-4 py-1 bg-teal-700 text-white rounded text-xs font-semibold hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Deposit
              </button>
            </div>
          </div>

          {/* Undeposited Payments List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase w-12">
                    <input
                      type="checkbox"
                      checked={selectedPaymentIds.size === unDepositedPayments.length && unDepositedPayments.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPaymentIds(new Set(unDepositedPayments.map((p) => p.id)));
                        } else {
                          setSelectedPaymentIds(new Set());
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Posting Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Applied</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Unapplied</th>
                </tr>
              </thead>
              <tbody>
                {unDepositedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      No undeposited payments available
                    </td>
                  </tr>
                ) : (
                  unDepositedPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedPaymentIds.has(payment.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPaymentIds.has(payment.id)}
                          onChange={() => togglePaymentSelection(payment.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{payment.date}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {payment.type === 'CHECK' ? 'Check' : payment.type === 'ACH' ? 'ACH' : payment.type === 'WIRE' ? 'Wire' : payment.type}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{payment.ref}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-bold">${payment.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">${payment.applied.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">${(payment.amount - payment.applied).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deposits List Section */}
        {customer.deposits.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Bank Deposits</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-700 text-white">
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Deposit ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Date</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Payments</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.deposits.map((deposit) => (
                    <tr
                      key={deposit.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-gray-800 font-medium">{deposit.depositId}</td>
                      <td className="px-4 py-3 text-gray-600">{deposit.date}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-bold">${deposit.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-600 font-semibold">{deposit.paymentIds.length}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getDepositBadgeColor(
                            deposit.status
                          )}`}
                        >
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedDepositId(deposit.id);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold hover:bg-blue-100 border border-blue-200"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedDepositId && (
        <DepositDetailModal
          customer={customer}
          depositId={selectedDepositId}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDepositId(null);
          }}
          onFinalizeDeposit={onFinalizeDeposit}
          onRemoveFromDeposit={onRemoveFromDeposit}
        />
      )}
    </>
  );
}
