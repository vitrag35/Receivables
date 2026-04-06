'use client';

import { useState } from 'react';
import { Customer, PAYMENT_TYPE_LABELS, PaymentApplication } from '@/lib/ar-data';

interface DirectApplyModalProps {
  customer: Customer;
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyPayment: (applications: PaymentApplication[]) => void;
}

export default function DirectApplyModal({
  customer,
  paymentId,
  isOpen,
  onClose,
  onApplyPayment,
}: DirectApplyModalProps) {
  const [selectedCharges, setSelectedCharges] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  // Get the payment or credit entry
  const allCredits = [
    ...customer.payments.map(p => ({ ...p, type: 'PAYMENT' as const })),
    ...customer.creditEntries.map(c => ({ ...c, type: c.type }))
  ];
  
  const selectedCredit = allCredits.find((c) => c.id === paymentId);
  if (!selectedCredit) return null;

  const availableCredit = selectedCredit.amount - selectedCredit.applied;
  const unpaidCharges = customer.charges.filter((charge) => charge.paid < charge.amount);

  const handleChargeToggle = (chargeId: string, chargeAmount: number, isPaid: number) => {
    const outstanding = chargeAmount - isPaid;
    
    setSelectedCharges((prev) => {
      const newSelected = { ...prev };
      
      if (newSelected[chargeId]) {
        delete newSelected[chargeId];
      } else {
        newSelected[chargeId] = Math.min(outstanding, availableCredit);
      }
      
      return newSelected;
    });
  };

  const handleAmountChange = (chargeId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelectedCharges((prev) => ({
      ...prev,
      [chargeId]: Math.max(0, numAmount),
    }));
  };

  const totalApplying = Object.values(selectedCharges).reduce((sum, amt) => sum + amt, 0);
  const remainingAfter = availableCredit - totalApplying;

  const handleApply = () => {
    if (Object.keys(selectedCharges).length === 0) {
      return;
    }

    const newApplications: PaymentApplication[] = Object.entries(selectedCharges).map(([chargeId, amount]) => ({
      id: `app_${Date.now()}_${chargeId}`,
      paymentId: selectedCredit.id,
      chargeId,
      amount,
      appliedDate: new Date().toISOString().split('T')[0],
    }));

    onApplyPayment(newApplications);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCharges({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-teal-700">Apply to Charges</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCredit.type === 'PAYMENT' ? PAYMENT_TYPE_LABELS[(selectedCredit as any).type] : selectedCredit.type} - {selectedCredit.ref}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Credit Details */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Total Amount</div>
                <div className="text-xl font-bold text-teal-700">${selectedCredit.amount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Already Applied</div>
                <div className="text-xl font-bold text-orange-600">${selectedCredit.applied.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Available</div>
                <div className="text-xl font-bold text-blue-700">${availableCredit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Will Apply</div>
                <div className={`text-xl font-bold ${totalApplying > availableCredit ? 'text-red-600' : 'text-green-600'}`}>
                  ${totalApplying.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Charges Table */}
          {unpaidCharges.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
              <p className="text-gray-500 text-sm">No unpaid charges available.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Apply Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidCharges.map((charge) => {
                    const outstanding = charge.amount - charge.paid;
                    const isSelected = !!selectedCharges[charge.id];
                    const applyAmount = selectedCharges[charge.id] || 0;

                    return (
                      <tr key={charge.id} className={`border-b border-gray-100 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3 text-gray-800 font-semibold">{charge.num}</td>
                        <td className="px-4 py-3 text-gray-600">{charge.due}</td>
                        <td className="px-4 py-3 text-right text-gray-800 font-bold">${charge.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-teal-700 font-bold">${charge.paid.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-800 font-bold">${outstanding.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleChargeToggle(charge.id, charge.amount, charge.paid)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            {isSelected && (
                              <input
                                type="number"
                                value={applyAmount}
                                onChange={(e) => handleAmountChange(charge.id, e.target.value)}
                                max={outstanding}
                                min="0"
                                step="0.01"
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={Object.keys(selectedCharges).length === 0}
              className="px-6 py-2 bg-teal-700 text-white rounded font-semibold text-sm hover:bg-teal-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Apply ${totalApplying.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
