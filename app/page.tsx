'use client';

import { useState, useCallback } from 'react';
import { DB, Payment, PaymentApplication, CreditEntry, DeletedEntry, Charge, Deposit } from '@/lib/ar-data';
import Header from '@/components/ar/header';
import CustomerBar from '@/components/ar/customer-bar';
import ArPanel from '@/components/ar/ar-panel';
import UniversalDepositsModal from '@/components/modals/universal-deposits-modal';
import UniversalSearchModal from '@/components/modals/universal-search-modal';

interface CustomerData {
  charges: typeof DB.acme_corp.charges;
  payments: Payment[];
  creditEntries: CreditEntry[];
  applications: PaymentApplication[];
  deletedEntries: DeletedEntry[];
}

export default function Home() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Initialize customer data from DB
  const baseCustomer = selectedCustomerId ? DB[selectedCustomerId as keyof typeof DB] : null;
  const [customerData, setCustomerData] = useState<CustomerData | null>(
    baseCustomer ? {
      charges: baseCustomer.charges,
      payments: [...baseCustomer.payments],
      creditEntries: [...baseCustomer.creditEntries],
      applications: [...baseCustomer.applications],
      deletedEntries: [...baseCustomer.deletedEntries],
    } : null
  );

  const handleSelectCustomer = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = DB[customerId as keyof typeof DB];
    setCustomerData({
      charges: customer.charges,
      payments: [...customer.payments],
      creditEntries: [...customer.creditEntries],
      applications: [...customer.applications],
      deletedEntries: [...customer.deletedEntries],
    });
  }, []);

  const handleAddCharge = useCallback((newCharge: Charge) => {
    setCustomerData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        charges: [...prev.charges, newCharge],
      };
    });
  }, []);

  const handleAddPayment = useCallback((newPayment: Payment) => {
    setCustomerData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        payments: [...prev.payments, newPayment],
      };
    });
  }, []);

  const handleAddCreditEntry = useCallback((newEntry: CreditEntry) => {
    setCustomerData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        creditEntries: [...prev.creditEntries, newEntry],
      };
    });
  }, []);

  const handleDeletePayment = useCallback((paymentId: string) => {
    setCustomerData((prev) => {
      if (!prev) return prev;

      const payment = prev.payments.find((p) => p.id === paymentId);
      if (!payment) return prev;

      // Check if payment has been applied or is deposited
      const hasApplications = prev.applications.some((app) => app.paymentId === paymentId);
      if (hasApplications || payment.isDeposited) {
        return prev;
      }

      // Simply remove the unapplied payment
      return {
        ...prev,
        payments: prev.payments.filter((p) => p.id !== paymentId),
      };
    });
  }, []);

  const handleDeleteCreditEntry = useCallback((entryId: string) => {
    setCustomerData((prev) => {
      if (!prev) return prev;
      
      const entry = prev.creditEntries.find((e) => e.id === entryId);
      if (!entry) return prev;

      // Check if entry has been applied
      const hasApplications = prev.applications.some((app) => app.paymentId === entryId);
      if (hasApplications) {
        return prev;
      }

      // Move to deleted entries
      const deletedEntry: DeletedEntry = {
        id: `del_${Date.now()}`,
        entryId: entry.id,
        entryType: entry.type,
        customerName: baseCustomer?.name || '',
        amount: entry.amount,
        deletedDate: new Date().toISOString().split('T')[0],
        reason: entry.reason || 'No reason provided',
      };

      return {
        ...prev,
        creditEntries: prev.creditEntries.filter((e) => e.id !== entryId),
        deletedEntries: [...prev.deletedEntries, deletedEntry],
      };
    });
  }, [baseCustomer?.name]);

  const handleApplyPayment = useCallback((applications: PaymentApplication[]) => {
    setCustomerData((prev) => {
      if (!prev) return prev;
      
      // Update applications
      const newApplications = [...prev.applications, ...applications];
      
      // Update payment applied amounts
      const newPayments = prev.payments.map((payment) => {
        const paymentApplications = newApplications.filter((app) => app.paymentId === payment.id);
        const applied = paymentApplications.reduce((sum, app) => sum + app.amount, 0);
        return { ...payment, applied };
      });

      // Update credit entry applied amounts and track adjustments
      const adjustmentsByCharge = new Map<string, number>();
      const newCreditEntries = prev.creditEntries.map((entry) => {
        const entryApplications = newApplications.filter((app) => app.paymentId === entry.id);
        const applied = entryApplications.reduce((sum, app) => sum + app.amount, 0);
        
        // Track adjustments by charge
        entryApplications.forEach((app) => {
          const currentAdjustment = adjustmentsByCharge.get(app.chargeId) || 0;
          adjustmentsByCharge.set(app.chargeId, currentAdjustment + app.amount);
        });
        
        return { ...entry, applied };
      });

      // Update charge paid amounts and apply adjustments to amount
      const newCharges = prev.charges.map((charge) => {
        const chargeApplications = newApplications.filter((app) => app.chargeId === charge.id);
        const paid = chargeApplications.reduce((sum, app) => sum + app.amount, 0);
        const adjustment = adjustmentsByCharge.get(charge.id) || 0;
        
        return { 
          ...charge, 
          paid,
          amount: charge.amount + adjustment
        };
      });

      return {
        ...prev,
        charges: newCharges,
        payments: newPayments,
        creditEntries: newCreditEntries,
        applications: newApplications,
      };
    });
  }, []);

  const [globalDeposits, setGlobalDeposits] = useState<Deposit[]>([]);
  const [isDepositsModalOpen, setIsDepositsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleCreateDeposit = useCallback((paymentIds: string[], adjustmentIds: string[], depositDate: string, reference: string) => {
    // Generate unique deposit ID
    const depositNum = globalDeposits.length + 1;
    const depositId = `DEP-${String(depositNum).padStart(4, '0')}`;

    // Calculate totals by type
    let paymentTotal = 0;
    let adjustmentTotal = 0;
    let totalAmount = 0;

    Object.values(DB).forEach((customer) => {
      customer.payments.forEach((p) => {
        if (paymentIds.includes(p.id)) {
          const amount = p.transactionType === 'RETURNED_CHECK' ? -p.amount : p.amount;
          if (p.transactionType === 'RETURNED_CHECK') {
            totalAmount -= p.amount;
          } else {
            paymentTotal += p.amount;
            totalAmount += p.amount;
          }
        }
      });

      customer.creditEntries.forEach((c) => {
        if (adjustmentIds.includes(c.id)) {
          adjustmentTotal += c.amount;
          totalAmount += c.amount;
        }
      });
    });

    // Create new deposit (automatically posted)
    const newDeposit: Deposit = {
      id: `dep_${Date.now()}`,
      depositId,
      depositDate,
      batch: 'N/A',
      reference,
      paymentIds,
      adjustmentIds,
      returnCheckIds: [],
      paymentTotal,
      adjustmentTotal,
      returnCheckTotal: 0,
      amount: totalAmount,
      status: 'POSTED',
      createdDate: new Date().toISOString().split('T')[0],
      isDeleted: false,
    };

    // Mark items as deposited
    Object.entries(DB).forEach(([_customerId, customer]) => {
      customer.payments.forEach((p) => {
        if (paymentIds.includes(p.id)) {
          p.isDeposited = true;
          p.depositId = newDeposit.id;
        }
      });

      customer.creditEntries.forEach((c) => {
        if (adjustmentIds.includes(c.id)) {
          c.isDeposited = true;
          c.depositId = newDeposit.id;
        }
      });
    });

    setGlobalDeposits([...globalDeposits, newDeposit]);
  }, [globalDeposits]);

  const handleDeleteDeposit = useCallback((depositId: string) => {
    setGlobalDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId 
          ? { ...d, isDeleted: true, deletedDate: new Date().toISOString().split('T')[0] }
          : d
      )
    );
  }, []);

  const handleUnapplyPayment = useCallback((applicationId: string) => {
    setCustomerData((prev) => {
      if (!prev) return prev;
      
      // Remove the application
      const appToRemove = prev.applications.find((app) => app.id === applicationId);
      if (!appToRemove) return prev;

      const newApplications = prev.applications.filter((app) => app.id !== applicationId);
      
      // Update payment applied amounts
      const newPayments = prev.payments.map((payment) => {
        const paymentApplications = newApplications.filter((app) => app.paymentId === payment.id);
        const applied = paymentApplications.reduce((sum, app) => sum + app.amount, 0);
        return { ...payment, applied };
      });

      // Update credit entry applied amounts and track adjustments
      const adjustmentsByCharge = new Map<string, number>();
      const newCreditEntries = prev.creditEntries.map((entry) => {
        const entryApplications = newApplications.filter((app) => app.paymentId === entry.id);
        const applied = entryApplications.reduce((sum, app) => sum + app.amount, 0);
        
        // Track adjustments by charge
        entryApplications.forEach((app) => {
          const currentAdjustment = adjustmentsByCharge.get(app.chargeId) || 0;
          adjustmentsByCharge.set(app.chargeId, currentAdjustment + app.amount);
        });
        
        return { ...entry, applied };
      });

      // Update charge paid amounts and apply adjustments to amount
      const newCharges = prev.charges.map((charge) => {
        const chargeApplications = newApplications.filter((app) => app.chargeId === charge.id);
        const paid = chargeApplications.reduce((sum, app) => sum + app.amount, 0);
        const adjustment = adjustmentsByCharge.get(charge.id) || 0;
        
        return { 
          ...charge, 
          paid,
          amount: charge.amount + adjustment
        };
      });

      return {
        ...prev,
        charges: newCharges,
        payments: newPayments,
        creditEntries: newCreditEntries,
        applications: newApplications,
      };
    });
  }, []);

  const selectedCustomer = baseCustomer && customerData ? {
    ...baseCustomer,
    charges: customerData.charges,
    payments: customerData.payments,
    creditEntries: customerData.creditEntries,
    applications: customerData.applications,
    deletedEntries: customerData.deletedEntries,
  } : null;

  return (
    <main className="min-h-screen bg-gray-100">
      <Header 
        onOpenDeposits={() => setIsDepositsModalOpen(true)} 
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />
      <UniversalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />
      <UniversalDepositsModal
        isOpen={isDepositsModalOpen}
        onClose={() => setIsDepositsModalOpen(false)}
        deposits={globalDeposits}
        onCreateDeposit={handleCreateDeposit}
        onDeleteDeposit={handleDeleteDeposit}
      />
      <CustomerBar 
        selectedCustomerId={selectedCustomerId}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={handleSelectCustomer}
      />
      {selectedCustomer && customerData ? (
        <ArPanel 
          customer={selectedCustomer}
          onAddCharge={handleAddCharge}
          onAddPayment={handleAddPayment}
          onDeletePayment={handleDeletePayment}
          onAddCreditEntry={handleAddCreditEntry}
          onDeleteCreditEntry={handleDeleteCreditEntry}
          onApplyPayment={handleApplyPayment}
          onUnapplyPayment={handleUnapplyPayment}
        />
      ) : (
        <div className="max-w-4xl mx-auto mt-24 px-6">
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4">
            <div className="text-5xl">👤</div>
            <p className="text-lg">Select a customer above to view their Account Receivable</p>
          </div>
        </div>
      )}
    </main>
  );
}
