'use client';

import { useState } from 'react';
import { Customer, CreditEntry } from '@/lib/ar-data';

interface NewAdjustmentModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onAddAdjustment: (entry: CreditEntry) => void;
}

export default function NewAdjustmentModal({
  customer,
  isOpen,
  onClose,
  onAddAdjustment,
}: NewAdjustmentModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    setAmount('');
    setReason('');
    setReference('');
    setNotes('');
    onClose();
  };

  const handleSave = () => {
    if (!amount || !reason || !reference) {
      return;
    }

    const numAmount = parseFloat(amount);
    const newEntry: CreditEntry = {
      id: `adj_${Date.now()}`,
      type: numAmount > 0 ? 'ADJUSTMENT' : 'REFUND',
      date: new Date().toISOString().split('T')[0],
      reason,
      amount: Math.abs(numAmount),
      applied: 0,
      ref: reference,
      notes: notes || undefined,
    };

    onAddAdjustment(newEntry);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Create Adjustment</h2>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (+ to increase owed, - to decrease)
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 50.00 or -25.50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select a reason...</option>
            <option value="PRICE_CORRECTION">Price Correction</option>
            <option value="DAMAGE_CREDIT">Damage Credit</option>
            <option value="WRITE_OFF">Balance Write-off</option>
            <option value="PROMOTIONAL">Promotional Credit</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Reference */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference *</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., ADJ-001, CM-123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Preview */}
        {amount && (
          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-6 text-sm">
            <p className="text-gray-700">
              {parseFloat(amount) > 0
                ? `Adding $${Math.abs(parseFloat(amount)).toFixed(2)} to what customer owes`
                : `Reducing customer balance by $${Math.abs(parseFloat(amount)).toFixed(2)}`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-md font-medium hover:bg-teal-700"
          >
            Create Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}
