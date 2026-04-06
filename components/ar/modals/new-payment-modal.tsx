'use client';

import { useState } from 'react';
import { Customer, PAYMENT_TYPE_LABELS, PaymentType, Payment } from '@/lib/ar-data';

interface NewPaymentModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (payment: Payment) => void;
}

export default function NewPaymentModal({ customer, isOpen, onClose, onAddPayment }: NewPaymentModalProps) {
  const [paymentType, setPaymentType] = useState<PaymentType | ''>('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [dateReceived, setDateReceived] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!paymentType || !amount || !reference || !dateReceived) {
      alert('Please fill in all required fields');
      return;
    }

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      date: dateReceived,
      type: paymentType as PaymentType,
      ref: reference,
      checkDate: checkDate || undefined,
      amount: parseFloat(amount),
      applied: 0,
      notes: notes || undefined,
    };

    onAddPayment(newPayment);
    handleClose();
  };

  const handleClose = () => {
    setPaymentType('');
    setAmount('');
    setReference('');
    setDateReceived('');
    setCheckDate('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-96 overflow-y-auto shadow-xl">
        <div className="border-b border-gray-200 p-6 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-teal-700">+ Record New Payment</h2>
          <button
            onClick={handleClose}
            className="text-2xl text-gray-400 hover:text-gray-600 leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 text-sm text-blue-700">
            <strong className="block mb-1">Recording vs Applying</strong>
            Recording and applying are TWO separate steps. After saving, the payment is an unapplied credit.
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
              Payment Type <span className="text-red-600">*</span>
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">-- Select Type --</option>
              {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Amount <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Reference <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Check #, Auth code, Wire ref..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Date Received <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Check Date <span className="text-xs font-normal text-gray-600">(post-dated)</span>
              </label>
              <input
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end gap-2 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-semibold text-sm hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-700 text-white rounded font-semibold text-sm hover:bg-teal-600 transition-colors"
          >
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
}
