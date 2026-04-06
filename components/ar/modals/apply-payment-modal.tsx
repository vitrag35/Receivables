'use client';

import { useState } from 'react';
import { Customer, PAYMENT_TYPE_LABELS, PaymentApplication } from '@/lib/ar-data';

interface ApplyPaymentModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onApplyPayment: (applications: PaymentApplication[]) => void;
  preSelectedPaymentId?: string;
}

export default function ApplyPaymentModal({ customer, isOpen, onClose, onApplyPayment, preSelectedPaymentId }: ApplyPaymentModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(preSelectedPaymentId || '');
  const [selectedCharges, setSelectedCharges] = useState<Record<string, number>>({});

  // Get both payments and credit entries
  const allCredits = [
    ...customer.payments.map(p => ({ ...p, type: 'PAYMENT' as const })),
    ...customer.creditEntries.map(c => ({ ...c, type: c.type }))
  ];
  
  const selectedCredit = allCredits.find((c) => c.id === selectedPaymentId);
  const availableCredit = selectedCredit ? selectedCredit.amount - selectedCredit.applied : 0;
  const totalApplying = Object.values(selectedCharges).reduce((sum, amt) => sum + amt, 0);
  const remainingAfter = availableCredit - totalApplying;

  const handleChargeToggle = (chargeId: string) => {
    if (selectedCharges[chargeId]) {
      const newCharges = { ...selectedCharges };
      delete newCharges[chargeId];
      setSelectedCharges(newCharges);
    } else {
      const charge = customer.charges.find((c) => c.id === chargeId);
      if (charge) {
        const balanceDue = charge.amount - charge.paid;
        setSelectedCharges({
          ...selectedCharges,
          [chargeId]: Math.min(balanceDue, availableCredit - totalApplying),
        });
      }
    }
  };

  const handleChargeAmountChange = (chargeId: string, amount: number) => {
    if (amount <= 0) {
      const newCharges = { ...selectedCharges };
      delete newCharges[chargeId];
      setSelectedCharges(newCharges);
    } else {
      setSelectedCharges({ ...selectedCharges, [chargeId]: amount });
    }
  };

  const handleAutoSelectInvoices = () => {
    const newCharges: Record<string, number> = {};
    let remaining = availableCredit;

    const sortedCharges = [...customer.charges].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const charge of sortedCharges) {
      if (remaining <= 0) break;
      const balanceDue = charge.amount - charge.paid;
      const applyAmount = Math.min(balanceDue, remaining);
      if (applyAmount > 0) {
        newCharges[charge.id] = applyAmount;
        remaining -= applyAmount;
      }
    }

    setSelectedCharges(newCharges);
  };

  const handleConfirm = () => {
    if (Object.keys(selectedCharges).length === 0) {
      return;
    }

    // Create payment applications
    const newApplications: PaymentApplication[] = Object.entries(selectedCharges).map(([chargeId, amount]) => ({
      id: `app_${Date.now()}_${chargeId}`,
      paymentId: selectedPaymentId,
      chargeId,
      amount,
      appliedDate: new Date().toISOString().split('T')[0],
    }));

    onApplyPayment(newApplications);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPaymentId('');
    setSelectedCharges({});
    onClose();
  };

  if (!isOpen) return null;

  const unappliedPayments = customer.payments.filter((p) => p.applied < p.amount);
  const unappliedCredits = customer.creditEntries.filter((c) => c.applied < c.amount);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-screen overflow-y-auto shadow-xl">
        <div className="border-b border-gray-200 p-6 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-teal-700">Apply Payment to Charges</h2>
          <button
            onClick={handleClose}
            className="text-2xl text-gray-400 hover:text-gray-600 leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-4 text-sm text-blue-700">
                <label className="block font-semibold mb-2">Step 1 - Select Available Payment</label>
                <select
                  value={selectedPaymentId}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 mt-2"
                >
                  <option value="">-- Select Payment or Credit --</option>
                  {unappliedPayments.length > 0 && (
                    <optgroup label="Payments">
                      {unappliedPayments.map((payment) => (
                        <option key={payment.id} value={payment.id}>
                          {payment.date} - {PAYMENT_TYPE_LABELS[payment.type]} - ${payment.amount.toFixed(2)} ({payment.ref})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {unappliedCredits.length > 0 && (
                    <optgroup label="Adjustments & Refunds">
                      {unappliedCredits.map((credit) => (
                        <option key={credit.id} value={credit.id}>
                          {credit.date} - {credit.type === 'ADJUSTMENT' ? 'Adj' : 'Ref'} - ${credit.amount.toFixed(2)} ({credit.ref})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {selectedCredit && (
                <>
                  <div className="bg-white border border-gray-200 rounded px-4 py-3 mb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 font-semibold uppercase">Date</div>
                        <div className="text-sm font-semibold text-teal-700">{selectedCredit.date}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 font-semibold uppercase">Type</div>
                        <div className="text-sm font-semibold text-teal-700">
                          {selectedCredit.type === 'PAYMENT' ? PAYMENT_TYPE_LABELS[(selectedCredit as any).type] : selectedCredit.type}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 font-semibold uppercase">Reference</div>
                        <div className="text-sm font-semibold text-orange-600">{selectedCredit.ref}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-800 text-sm">Step 2 - Select Invoices to Apply</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAutoSelectInvoices}
                          className="px-3 py-1 bg-white border-2 border-teal-700 text-teal-700 rounded text-xs font-semibold hover:bg-teal-700 hover:text-white transition-colors"
                        >
                          Auto Select (Oldest First)
                        </button>
                        <button
                          onClick={() => setSelectedCharges({})}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold hover:bg-gray-300"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left w-8">
                              <input type="checkbox" disabled />
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-xs">Invoice #</th>
                            <th className="px-3 py-2 text-left font-semibold text-xs">Date</th>
                            <th className="px-3 py-2 text-right font-semibold text-xs">Invoice Amount</th>
                            <th className="px-3 py-2 text-right font-semibold text-xs">Already Paid</th>
                            <th className="px-3 py-2 text-right font-semibold text-xs">Balance Due</th>
                            <th className="px-3 py-2 text-right font-semibold text-xs">Apply Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customer.charges.map((charge) => {
                            const balanceDue = charge.amount - charge.paid;
                            const isSelected = !!selectedCharges[charge.id];
                            return (
                              <tr key={charge.id} className={`border-b border-gray-100 ${isSelected ? 'bg-blue-50' : ''}`}>
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleChargeToggle(charge.id)}
                                    className="w-4 h-4 cursor-pointer"
                                  />
                                </td>
                                <td className="px-3 py-2 font-semibold text-gray-800">{charge.num}</td>
                                <td className="px-3 py-2 text-gray-600">{charge.date}</td>
                                <td className="px-3 py-2 text-right text-gray-800">${charge.amount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-gray-600">${charge.paid.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-semibold">${balanceDue.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">
                                  {isSelected && (
                                    <input
                                      type="number"
                                      value={selectedCharges[charge.id]}
                                      onChange={(e) => handleChargeAmountChange(charge.id, parseFloat(e.target.value) || 0)}
                                      min="0"
                                      step="0.01"
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm outline-none focus:border-teal-700"
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Available Credit:</span>
                        <span className="font-semibold">${availableCredit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Total Applying:</span>
                        <span className="font-semibold text-orange-600">${totalApplying.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2">
                        <span>Remaining After:</span>
                        <span>${remainingAfter.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded px-4 py-3 mb-4 text-sm text-green-700">
                <strong className="block mb-1">Review Before Applying</strong>
                Confirm the applications below.
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left font-semibold">Invoice #</th>
                      <th className="px-3 py-2 text-right font-semibold">Current Balance</th>
                      <th className="px-3 py-2 text-right font-semibold">Applying</th>
                      <th className="px-3 py-2 text-right font-semibold">Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.charges
                      .filter((c) => selectedCharges[c.id])
                      .map((charge) => {
                        const currentBalance = charge.amount - charge.paid;
                        const applyAmount = selectedCharges[charge.id];
                        const balanceAfter = currentBalance - applyAmount;
                        return (
                          <tr key={charge.id} className="border-b border-gray-100">
                            <td className="px-3 py-2 font-semibold">{charge.num}</td>
                            <td className="px-3 py-2 text-right">${currentBalance.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-orange-600 font-semibold">${applyAmount.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-semibold">${balanceAfter.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3">
                <div className="flex justify-between text-sm mb-2">
                  <span>Payment Credit:</span>
                  <span className="font-semibold">${availableCredit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Total Applied:</span>
                  <span className="font-semibold text-orange-600">${totalApplying.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2">
                  <span>Remaining Credit:</span>
                  <span>${remainingAfter.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end gap-2 bg-gray-50">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-semibold text-sm hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-semibold text-sm hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          {step === 1 && selectedCredit && (
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-orange-500 text-white rounded font-semibold text-sm hover:bg-orange-600 transition-colors"
            >
              Preview
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors"
            >
              Confirm and Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
