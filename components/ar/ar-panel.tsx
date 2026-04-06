'use client';

import { useState } from 'react';
import { Customer, Payment, PaymentApplication, CreditEntry, Charge, Deposit } from '@/lib/ar-data';
import ChargesTab from './tabs/charges-tab';
import PaymentsTab from './tabs/payments-tab';
import RefundsTab from './tabs/refunds-tab';
import DepositsTab from './tabs/deposits-tab';

interface ArPanelProps {
  customer: Customer;
  onAddPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  onAddCharge: (charge: Charge) => void;
  onAddCreditEntry: (entry: CreditEntry) => void;
  onDeleteCreditEntry: (entryId: string) => void;
  onApplyPayment: (applications: PaymentApplication[]) => void;
  onUnapplyPayment: (applicationId: string) => void;
  onCreateDeposit: (paymentIds: string[]) => void;
  onFinalizeDeposit: (depositId: string) => void;
  onRemoveFromDeposit: (depositId: string, paymentId: string) => void;
}

export default function ArPanel({ customer, onAddPayment, onDeletePayment, onAddCharge, onAddCreditEntry, onDeleteCreditEntry, onApplyPayment, onUnapplyPayment, onCreateDeposit, onFinalizeDeposit, onRemoveFromDeposit }: ArPanelProps) {
  const [activeTab, setActiveTab] = useState<'charges' | 'payments' | 'refunds' | 'deposits'>('charges'); // v2

  const tabs = [
    { id: 'charges', label: 'Charges' },
    { id: 'payments', label: 'Payments' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'deposits', label: 'Deposits' },
  ];

  return (
    <div className="max-w-6xl mx-auto mt-6 px-6">
      {/* Tabs */}
      <div className="border-b-2 border-gray-200 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-4 -mb-0.5 ${
              activeTab === tab.id
                ? 'text-teal-700 border-teal-700 font-semibold'
                : 'text-gray-600 border-transparent hover:text-teal-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-5 shadow-sm">
        {activeTab === 'charges' && <ChargesTab customer={customer} onAddCharge={onAddCharge} onAddCreditEntry={onAddCreditEntry} onUnapplyPayment={onUnapplyPayment} onApplyPayment={onApplyPayment} />}
        {activeTab === 'payments' && <PaymentsTab customer={customer} onAddPayment={onAddPayment} onDeletePayment={onDeletePayment} onApplyPayment={onApplyPayment} onUnapplyPayment={onUnapplyPayment} />}
        {activeTab === 'refunds' && <RefundsTab customer={customer} onDeleteCreditEntry={onDeleteCreditEntry} onApplyPayment={onApplyPayment} onUnapplyPayment={onUnapplyPayment} />}
        {activeTab === 'deposits' && <DepositsTab customer={customer} onCreateDeposit={onCreateDeposit} onFinalizeDeposit={onFinalizeDeposit} onRemoveFromDeposit={onRemoveFromDeposit} />}
      </div>
    </div>
  );
}
