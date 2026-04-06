'use client';

import { useState, useCallback } from 'react';
import { DB, Payment, PaymentApplication, CreditEntry, DeletedEntry, Charge, Deposit } from '@/lib/ar-data';
import Header from '@/components/ar/header';
import CustomerBar from '@/components/ar/customer-bar';
import ArPanel from '@/components/ar/ar-panel';

interface CustomerData {
  charges: typeof DB.acme_corp.charges;
  payments: Payment[];
  creditEntries: CreditEntry[];
  applications: PaymentApplication[];
  deletedEntries: DeletedEntry[];
  deposits: Deposit[];
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
      deposits: [...baseCustomer.deposits],
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
      deposits: [...customer.deposits],
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

  const handleCreateDeposit = useCallback((paymentIds: string[]) => {
    setCustomerData((prev) => {
      if (!prev) return prev;

      // Generate unique deposit ID
      const depositNum = prev.deposits.length + 1;
      const depositId = `DEP-${String(depositNum).padStart(4, '0')}`;
      
      // Calculate total amount
      const totalAmount = prev.payments
        .filter((p) => paymentIds.includes(p.id))
        .reduce((sum, p) => sum + p.amount, 0);

      // Create new deposit
      const newDeposit: Deposit = {
        id: `dep_${Date.now()}`,
        depositId,
        date: new Date().toISOString().split('T')[0],
        amount: totalAmount,
        paymentIds,
        status: 'PENDING',
        createdDate: new Date().toISOString().split('T')[0],
      };

      // Mark payments as deposited
      const updatedPayments = prev.payments.map((p) =>
        paymentIds.includes(p.id) 
          ? { ...p, isDeposited: true, depositId: newDeposit.id }
          : p
      );

      return {
        ...prev,
        deposits: [...prev.deposits, newDeposit],
        payments: updatedPayments,
      };
    });
  }, []);

  const handleFinalizeDeposit = useCallback((depositId: string) => {
    setCustomerData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        deposits: prev.deposits.map((d) =>
          d.id === depositId ? { ...d, status: 'FINALIZED' } : d
        ),
      };
    });
  }, []);

  const handleRemoveFromDeposit = useCallback((depositId: string, paymentId: string) => {
    setCustomerData((prev) => {
      if (!prev) return prev;

      const deposit = prev.deposits.find((d) => d.id === depositId);
      if (!deposit || deposit.status === 'FINALIZED') return prev;

      const updatedPaymentIds = deposit.paymentIds.filter((id) => id !== paymentId);
      const newAmount = prev.payments
        .filter((p) => updatedPaymentIds.includes(p.id))
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        ...prev,
        deposits: prev.deposits.map((d) =>
          d.id === depositId
            ? { ...d, paymentIds: updatedPaymentIds, amount: newAmount }
            : d
        ),
        payments: prev.payments.map((p) =>
          p.id === paymentId
            ? { ...p, isDeposited: false, depositId: undefined }
            : p
        ),
      };
    });
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
    deposits: customerData.deposits,
  } : null;

  return (
    <main className="min-h-screen bg-gray-100">
      <Header />
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
          onCreateDeposit={handleCreateDeposit}
          onFinalizeDeposit={handleFinalizeDeposit}
          onRemoveFromDeposit={handleRemoveFromDeposit}
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
