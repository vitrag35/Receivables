'use client';

import { useState } from 'react';
import { Payment, CreditEntry, DB } from '@/lib/ar-data';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Payment | CreditEntry | null;
  itemType: 'PAYMENT' | 'RETURNED_CHECK' | 'ADJUSTMENT' | null;
  customerName: string;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  item,
  itemType,
  customerName,
}: ReceiptModalProps) {
  const [email, setEmail] = useState('');

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    const payment = item as Payment;
    const isPayment = itemType === 'PAYMENT';
    const isReturnedCheck = itemType === 'RETURNED_CHECK';
    const isAdjustment = itemType === 'ADJUSTMENT';

    let receiptContent = '';

    if (isPayment || isReturnedCheck) {
      const payment = item as Payment;
      receiptContent = `
        PAYMENT RECEIPT
        ===============
        Customer: ${customerName}
        Payment ID: ${payment.id}
        Type: ${payment.type}
        Reference: ${payment.ref}
        Amount: $${payment.amount.toFixed(2)}
        ${payment.checkDate ? `Check Date: ${payment.checkDate}` : ''}
        Posting Date: ${payment.date}
        ${payment.user ? `Processed By: ${payment.user}` : ''}
        
        Status: ${payment.applied > 0 ? 'Applied' : 'Unapplied'}
        Applied Amount: $${payment.applied.toFixed(2)}
        Unapplied Amount: $${(payment.amount - payment.applied).toFixed(2)}
        
        ${isReturnedCheck ? 'NOTE: This is a RETURNED CHECK' : ''}
      `;
    } else if (isAdjustment) {
      const entry = item as CreditEntry;
      receiptContent = `
        ADJUSTMENT RECEIPT
        ==================
        Customer: ${customerName}
        Adjustment ID: ${entry.id}
        Type: ${entry.type}
        Reason: ${entry.reason || 'N/A'}
        Reference: ${entry.ref || 'N/A'}
        Amount: $${entry.amount.toFixed(2)}
        Date: ${entry.date}
        ${entry.user ? `Processed By: ${entry.user}` : ''}
        
        Applied Amount: $${entry.applied.toFixed(2)}
        Unapplied Amount: $${(entry.amount - entry.applied).toFixed(2)}
      `;
    }

    const printWindow = window.open('', '', 'width=700,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEmail = () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    // Simulate sending email
    alert(`Receipt would be sent to: ${email}`);
    onClose();
  };

  const title = itemType === 'PAYMENT' ? 'Payment Receipt' : 
                itemType === 'RETURNED_CHECK' ? 'Returned Check Receipt' : 
                'Adjustment Receipt';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-teal-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-teal-800 rounded px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Customer:</span> {customerName}
            </p>
            {item && 'ref' in item && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Reference:</span> {(item as Payment).ref}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Amount:</span> ${item.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Date:</span> {item.date}
            </p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address (for sending receipt)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
          >
            Print
          </button>
          <button
            onClick={handleEmail}
            className="flex-1 px-4 py-2 bg-teal-700 text-white rounded font-semibold hover:bg-teal-800 transition"
          >
            Email
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
