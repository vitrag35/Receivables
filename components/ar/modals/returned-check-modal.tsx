'use client';

import { useState } from 'react';
import { Customer, Charge } from '@/lib/ar-data';

interface ReturnedCheckModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onRecordReturnedCheck: (charge: Charge) => void;
}

const RETURN_REASONS = [
  'NSF (Insufficient Funds)',
  'Account Closed',
  'Stop Payment',
  'Post Dated',
  'Stale Dated',
  'Altered Check',
  'Missing Endorsement',
  'Other',
];

export default function ReturnedCheckModal({
  customer,
  isOpen,
  onClose,
  onRecordReturnedCheck,
}: ReturnedCheckModalProps) {
  const [checkNumber, setCheckNumber] = useState('');
  const [checkAmount, setCheckAmount] = useState('');
  const [returnReason, setReturnReason] = useState('NSF (Insufficient Funds)');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkNumber.trim() || !checkAmount.trim()) {
      return;
    }

    const amount = parseFloat(checkAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    // Create a new charge for the returned check
    const newCharge: Charge = {
      id: `chg_${Date.now()}`,
      num: `RC-${checkNumber}`,
      ref: checkNumber,
      date: new Date().toISOString().split('T')[0],
      due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: amount,
      paid: 0,
    };

    onRecordReturnedCheck(newCharge);
    
    // Reset form
    setCheckNumber('');
    setCheckAmount('');
    setReturnReason('NSF (Insufficient Funds)');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Record Returned Check</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Check Number *
            </label>
            <input
              type="text"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              placeholder="e.g., 1001"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Check Amount *
            </label>
            <input
              type="number"
              value={checkAmount}
              onChange={(e) => setCheckAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Return Reason
            </label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            >
              {RETURN_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              Record Returned Check
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
