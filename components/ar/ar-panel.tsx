'use client';

import { useState } from 'react';
import { Customer, Payment, PaymentApplication, CreditEntry, Charge } from '@/lib/ar-data';
import ChargesTab from './tabs/charges-tab';
import PaymentsTab from './tabs/payments-tab';
import RefundsTab from './tabs/refunds-tab';
import DeletedRecordsModal from '@/components/modals/deleted-records-modal';
import { Trash2 } from 'lucide-react';

interface ArPanelProps {
  customer: Customer;
  onAddPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  onAddCharge: (charge: Charge) => void;
  onDeleteCharge: (chargeId: string) => void;
  onAddCreditEntry: (entry: CreditEntry) => void;
  onDeleteCreditEntry: (entryId: string) => void;
  onApplyPayment: (applications: PaymentApplication[]) => void;
  onUnapplyPayment: (applicationId: string) => void;
}

export default function ArPanel({ customer, onAddPayment, onDeletePayment, onAddCharge, onDeleteCharge, onAddCreditEntry, onDeleteCreditEntry, onApplyPayment, onUnapplyPayment }: ArPanelProps) {
  const [activeTab, setActiveTab] = useState<'charges' | 'payments' | 'refunds'>('charges'); // v2
  const [showDeletedRecordsModal, setShowDeletedRecordsModal] = useState(false);

  const tabs = [
    { id: 'charges', label: 'Charges' },
    { id: 'payments', label: 'Payments' },
    { id: 'refunds', label: 'Credits' },
  ];

  return (
    <div className="max-w-6xl mx-auto mt-6 px-6">
      {/* Tabs */}
      <div className="border-b-2 border-gray-200 flex items-center justify-between">
        <div className="flex">
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
        <button
          onClick={() => setShowDeletedRecordsModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="View Deleted Records"
        >
          <Trash2 className="w-4 h-4" />
          <span>Deleted Records ({customer.deletedEntries.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-5 shadow-sm">
        {activeTab === 'charges' && <ChargesTab customer={customer} onAddCharge={onAddCharge} onDeleteCharge={onDeleteCharge} onAddCreditEntry={onAddCreditEntry} onUnapplyPayment={onUnapplyPayment} onApplyPayment={onApplyPayment} />}
        {activeTab === 'payments' && <PaymentsTab customer={customer} onAddPayment={onAddPayment} onDeletePayment={onDeletePayment} onApplyPayment={onApplyPayment} onUnapplyPayment={onUnapplyPayment} />}
        {activeTab === 'refunds' && <RefundsTab customer={customer} onDeleteCreditEntry={onDeleteCreditEntry} onAddCreditEntry={onAddCreditEntry} onApplyPayment={onApplyPayment} onUnapplyPayment={onUnapplyPayment} />}
      </div>

      {/* Deleted Records Modal */}
      <DeletedRecordsModal
        isOpen={showDeletedRecordsModal}
        onClose={() => setShowDeletedRecordsModal(false)}
        deletedEntries={customer.deletedEntries}
        customerName={customer.name}
      />
    </div>
  );
}
