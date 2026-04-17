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
  const [showDeletedRecordsModal, setShowDeletedRecordsModal] = useState(false);

  return (
    <div className="mt-8 px-6 pb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">Complete view of all charges, payments, and credits</p>
        </div>
        <button
          onClick={() => setShowDeletedRecordsModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
          title="View Deleted Records"
        >
          <Trash2 className="w-4 h-4" />
          <span>Deleted Records</span>
          <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded">
            {customer.deletedEntries.length}
          </span>
        </button>
      </div>

      {/* Vertical Stacked Layout with Fixed Height Tables */}
      <div className="space-y-6">
        {/* Charges Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Charges</h3>
              <span className="text-sm font-semibold text-blue-100 bg-blue-800 px-3 py-1 rounded-full">
                {customer.charges.length} invoices
              </span>
            </div>
          </div>
          <div className="overflow-hidden flex-1" style={{ height: '420px' }}>
            <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <ChargesTab 
                customer={customer} 
                onAddCharge={onAddCharge} 
                onDeleteCharge={onDeleteCharge} 
                onAddCreditEntry={onAddCreditEntry} 
                onUnapplyPayment={onUnapplyPayment} 
                onApplyPayment={onApplyPayment} 
              />
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 border-b border-green-800">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Payments</h3>
              <span className="text-sm font-semibold text-green-100 bg-green-800 px-3 py-1 rounded-full">
                {customer.payments.length} payments
              </span>
            </div>
          </div>
          <div className="overflow-hidden flex-1" style={{ height: '420px' }}>
            <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <PaymentsTab 
                customer={customer} 
                onAddPayment={onAddPayment} 
                onDeletePayment={onDeletePayment} 
                onApplyPayment={onApplyPayment} 
                onUnapplyPayment={onUnapplyPayment} 
              />
            </div>
          </div>
        </div>

        {/* Credits Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 border-b border-purple-800">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Credits</h3>
              <span className="text-sm font-semibold text-purple-100 bg-purple-800 px-3 py-1 rounded-full">
                {customer.creditEntries.length} credits
              </span>
            </div>
          </div>
          <div className="overflow-hidden flex-1" style={{ height: '420px' }}>
            <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <RefundsTab 
                customer={customer} 
                onDeleteCreditEntry={onDeleteCreditEntry} 
                onAddCreditEntry={onAddCreditEntry} 
                onApplyPayment={onApplyPayment} 
                onUnapplyPayment={onUnapplyPayment} 
              />
            </div>
          </div>
        </div>
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
