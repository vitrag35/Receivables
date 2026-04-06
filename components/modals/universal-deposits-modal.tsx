'use client';

import { useState } from 'react';
import { DB, Deposit, Payment } from '@/lib/ar-data';

interface DepositPaymentItem {
  customerId: string;
  customerName: string;
  payment: Payment;
}

interface UniversalDepositsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: Deposit[];
  onCreateDeposit: (paymentIds: string[]) => void;
  onFinalizeDeposit: (depositId: string) => void;
  onRemoveFromDeposit: (depositId: string, paymentId: string) => void;
}

export default function UniversalDepositsModal({
  isOpen,
  onClose,
  deposits,
  onCreateDeposit,
  onFinalizeDeposit,
  onRemoveFromDeposit,
}: UniversalDepositsModalProps) {
  const [selectedView, setSelectedView] = useState<'create' | 'manage'>('create');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);

  // Gather all undeposited payments from all customers
  const getAllUnDepositedPayments = (): DepositPaymentItem[] => {
    const items: DepositPaymentItem[] = [];
    Object.entries(DB).forEach(([customerId, customer]) => {
      customer.payments.forEach((payment) => {
        if (!payment.isDeposited) {
          items.push({
            customerId,
            customerName: customer.name,
            payment,
          });
        }
      });
    });
    return items;
  };

  const unDepositedPayments = getAllUnDepositedPayments();

  const handleSelectPayment = (paymentId: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleCreateDeposit = () => {
    if (selectedPayments.size > 0) {
      onCreateDeposit(Array.from(selectedPayments));
      setSelectedPayments(new Set());
      setSelectedView('manage');
    }
  };

  const handleSelectAllPayments = () => {
    if (selectedPayments.size === unDepositedPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(unDepositedPayments.map((item) => item.payment.id)));
    }
  };

  const getTotalAmount = (): number => {
    let total = 0;
    selectedPayments.forEach((paymentId) => {
      const item = unDepositedPayments.find((p) => p.payment.id === paymentId);
      if (item) {
        total += item.payment.amount;
      }
    });
    return total;
  };

  const getDepositPayments = (depositId: string): DepositPaymentItem[] => {
    const deposit = deposits.find((d) => d.id === depositId);
    if (!deposit) return [];

    const items: DepositPaymentItem[] = [];
    Object.entries(DB).forEach(([customerId, customer]) => {
      customer.payments.forEach((payment) => {
        if (deposit.paymentIds.includes(payment.id)) {
          items.push({
            customerId,
            customerName: customer.name,
            payment,
          });
        }
      });
    });
    return items;
  };

  const selectedDeposit = selectedDepositId
    ? deposits.find((d) => d.id === selectedDepositId)
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Bank Deposits Management</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-teal-800 rounded-full p-1 transition"
          >
            ✕
          </button>
        </div>

        {/* View Selector */}
        <div className="border-b border-gray-200 px-6 py-4 flex gap-4">
          <button
            onClick={() => {
              setSelectedView('create');
              setSelectedDepositId(null);
            }}
            className={`px-4 py-2 rounded font-semibold text-sm transition ${
              selectedView === 'create'
                ? 'bg-teal-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Create New Deposit
          </button>
          <button
            onClick={() => setSelectedView('manage')}
            className={`px-4 py-2 rounded font-semibold text-sm transition ${
              selectedView === 'manage'
                ? 'bg-teal-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manage Deposits ({deposits.length})
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {selectedView === 'create' ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Select Payments to Deposit
                </h3>
                <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <input
                    type="checkbox"
                    checked={
                      unDepositedPayments.length > 0 &&
                      selectedPayments.size === unDepositedPayments.length
                    }
                    onChange={handleSelectAllPayments}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-blue-900">
                    {selectedPayments.size === unDepositedPayments.length
                      ? 'Deselect All'
                      : 'Select All'}{' '}
                    ({unDepositedPayments.length} available)
                  </span>
                </div>

                {unDepositedPayments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No undeposited payments available</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded p-4">
                    {unDepositedPayments.map((item) => (
                      <div
                        key={item.payment.id}
                        className="flex items-center gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPayments.has(item.payment.id)}
                          onChange={() => handleSelectPayment(item.payment.id)}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {item.customerName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.payment.type} • Ref: {item.payment.ref}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-800">
                                ${item.payment.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-600">
                                Posted: {item.payment.date}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total and Action */}
              <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-800">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-teal-700">
                    ${getTotalAmount().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCreateDeposit}
                  disabled={selectedPayments.size === 0}
                  className="w-full px-4 py-3 bg-teal-700 text-white rounded font-bold hover:bg-teal-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Create Deposit ({selectedPayments.size} payments)
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedDeposit ? (
                <div>
                  <button
                    onClick={() => setSelectedDepositId(null)}
                    className="mb-4 px-3 py-1 text-teal-700 font-semibold hover:bg-teal-50 rounded transition"
                  >
                    ← Back to Deposits
                  </button>

                  <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          Deposit ID
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {selectedDeposit.depositId}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          Date
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {selectedDeposit.date}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          Amount
                        </p>
                        <p className="text-lg font-bold text-teal-700">
                          ${selectedDeposit.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            selectedDeposit.status === 'FINALIZED'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          }`}
                        >
                          {selectedDeposit.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    Payments in Deposit
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-4 mb-6">
                    {getDepositPayments(selectedDeposit.id).map((item) => (
                      <div
                        key={item.payment.id}
                        className="flex items-center justify-between p-3 border border-gray-100 rounded hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {item.customerName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.payment.type} • Ref: {item.payment.ref}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-800">
                            ${item.payment.amount.toFixed(2)}
                          </span>
                          {selectedDeposit.status === 'PENDING' && (
                            <button
                              onClick={() =>
                                onRemoveFromDeposit(selectedDeposit.id, item.payment.id)
                              }
                              className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100 transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedDeposit.status === 'PENDING' && (
                    <button
                      onClick={() => onFinalizeDeposit(selectedDeposit.id)}
                      className="w-full px-4 py-3 bg-green-700 text-white rounded font-bold hover:bg-green-800 transition"
                    >
                      Finalize Deposit
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    All Deposits
                  </h3>
                  {deposits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No deposits created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deposits.map((deposit) => (
                        <button
                          key={deposit.id}
                          onClick={() => setSelectedDepositId(deposit.id)}
                          className="w-full text-left p-4 border border-gray-200 rounded hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800">
                                {deposit.depositId}
                              </p>
                              <p className="text-sm text-gray-600">
                                {deposit.paymentIds.length} payments • {deposit.date}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-teal-700">
                                ${deposit.amount.toFixed(2)}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  deposit.status === 'FINALIZED'
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                }`}
                              >
                                {deposit.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
