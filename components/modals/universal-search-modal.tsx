'use client';

import { useState, useMemo } from 'react';
import { DB, Payment, CreditEntry, Charge, PAYMENT_TYPE_LABELS } from '@/lib/ar-data';
import { Search } from 'lucide-react';

type SearchField = 'amount' | 'invoice' | 'reference' | 'customer';
type TransactionType = 'ALL' | 'INVOICE' | 'PAYMENT' | 'RETURNED_CHECK' | 'ADJUSTMENT';

interface SearchResult {
  id: string;
  customerId: string;
  customerName: string;
  transactionType: TransactionType;
  typeLabel: string;
  amount: number;
  date: string;
  invoice: string;
  reference: string;
  raw: Charge | Payment | CreditEntry;
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export default function UniversalSearchModal({
  isOpen,
  onClose,
  onSelectCustomer,
}: UniversalSearchModalProps) {
  const [searchField, setSearchField] = useState<SearchField>('amount');
  const [transactionType, setTransactionType] = useState<TransactionType>('ALL');
  const [searchValue, setSearchValue] = useState('');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Gather all transactions from all customers
  const allTransactions = useMemo(() => {
    const transactions: SearchResult[] = [];

    Object.values(DB).forEach((customer) => {
      // Add invoices (charges)
      customer.charges.forEach((charge) => {
        transactions.push({
          id: charge.id,
          customerId: customer.id,
          customerName: customer.name,
          transactionType: 'INVOICE',
          typeLabel: 'I',
          amount: charge.amount,
          date: charge.date,
          invoice: charge.num,
          reference: charge.ref,
          raw: charge,
        });
      });

      // Add payments
      customer.payments.forEach((payment) => {
        const isReturnedCheck = payment.transactionType === 'RETURNED_CHECK';
        transactions.push({
          id: payment.id,
          customerId: customer.id,
          customerName: customer.name,
          transactionType: isReturnedCheck ? 'RETURNED_CHECK' : 'PAYMENT',
          typeLabel: isReturnedCheck ? 'RC' : 'P',
          amount: isReturnedCheck ? -payment.amount : payment.amount,
          date: payment.date,
          invoice: '',
          reference: payment.ref,
          raw: payment,
        });
      });

      // Add credit entries (adjustments)
      customer.creditEntries.forEach((entry) => {
        if (!entry.isDeleted) {
          transactions.push({
            id: entry.id,
            customerId: customer.id,
            customerName: customer.name,
            transactionType: 'ADJUSTMENT',
            typeLabel: 'A',
            amount: entry.type === 'ADJUSTMENT' ? -entry.amount : entry.amount,
            date: entry.date,
            invoice: '',
            reference: entry.ref || '',
            raw: entry,
          });
        }
      });
    });

    // Sort by date descending
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Filter transactions based on search criteria
  const filteredResults = useMemo(() => {
    let results = [...allTransactions];

    // Filter by transaction type
    if (transactionType !== 'ALL') {
      results = results.filter((t) => t.transactionType === transactionType);
    }

    // Filter by search value
    if (searchValue.trim()) {
      const value = searchValue.trim().toLowerCase();
      
      switch (searchField) {
        case 'amount':
          const numericValue = parseFloat(value);
          if (!isNaN(numericValue)) {
            results = results.filter((t) => Math.abs(t.amount) === numericValue);
          }
          break;
        case 'invoice':
          results = results.filter((t) => 
            t.invoice.toLowerCase().includes(value)
          );
          break;
        case 'reference':
          results = results.filter((t) => 
            t.reference.toLowerCase().includes(value)
          );
          break;
        case 'customer':
          results = results.filter((t) => 
            t.customerName.toLowerCase().includes(value)
          );
          break;
      }
    }

    return results;
  }, [allTransactions, searchField, transactionType, searchValue]);

  const handleSearch = () => {
    // Trigger re-render with current filters (already handled by useMemo)
    setSelectedResult(null);
  };

  const handleGoToAccount = () => {
    if (selectedResult) {
      onSelectCustomer(selectedResult.customerId);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
    return amount < 0 ? `(${formatted})` : formatted;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-700 to-teal-600 text-white px-6 py-4 flex items-center justify-between border-b border-teal-800">
          <h2 className="text-2xl font-bold">Accounts Receivable Search</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-teal-800 rounded px-3 py-1 transition"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {/* Results List */}
          <div className="flex-1 border border-gray-300 rounded overflow-hidden mb-6">
            <div className="bg-blue-50 overflow-y-auto h-[300px]">
              {filteredResults.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No transactions found. Adjust your search criteria.
                </div>
              ) : (
                <div className="font-mono text-sm">
                  {filteredResults.map((result) => (
                    <div
                      key={`${result.transactionType}-${result.id}`}
                      onClick={() => setSelectedResult(result)}
                      className={`px-4 py-1 cursor-pointer border-b border-blue-100 ${
                        selectedResult?.id === result.id && selectedResult?.transactionType === result.transactionType
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-blue-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-[280px] truncate">
                          Customer: {result.customerName}
                        </span>
                        <span className="w-[30px] text-center">{result.typeLabel}</span>
                        <span className="w-[100px] text-right">
                          Amount: {formatCurrency(result.amount)}
                        </span>
                        <span className="w-[120px]">
                          Date: {formatDate(result.date)}
                        </span>
                        <span className="w-[130px]">
                          Doc#: {result.invoice || 'N/A'}
                        </span>
                        <span className="flex-1 truncate">
                          Ref: {result.reference || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Controls */}
          <div className="flex items-end gap-8">
            {/* Left side - Search fields */}
            <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center">
              <label className="text-sm font-medium text-gray-700 text-right">
                Search For:
              </label>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[200px]"
              >
                <option value="amount">Amount</option>
                <option value="invoice">Document Number</option>
                <option value="reference">Reference</option>
                <option value="customer">Customer Name</option>
              </select>

              <label className="text-sm font-medium text-gray-700 text-right">
                A/R Type:
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[200px]"
              >
                <option value="ALL">All Transaction Types</option>
                <option value="INVOICE">Invoice</option>
                <option value="PAYMENT">Payment</option>
                <option value="RETURNED_CHECK">Returned Check</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>

              <label className="text-sm font-medium text-gray-700 text-right">
                Search For Value:
              </label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={
                  searchField === 'amount' 
                    ? 'Enter amount (e.g., 100)' 
                    : searchField === 'invoice'
                    ? 'Enter document number'
                    : searchField === 'reference'
                    ? 'Enter reference'
                    : 'Enter customer name'
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[200px]"
              />
            </div>

            {/* Right side - Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSearch}
                className="px-6 py-2 border-2 border-gray-400 rounded text-gray-700 font-medium hover:bg-gray-50 transition min-w-[180px]"
              >
                Search / Refresh
              </button>
              <button
                onClick={handleGoToAccount}
                disabled={!selectedResult}
                className={`px-6 py-2 border-2 border-gray-400 rounded font-medium transition min-w-[180px] ${
                  selectedResult
                    ? 'text-gray-700 hover:bg-gray-50'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Go To Selected Account
              </button>
            </div>
          </div>

          {/* Exit Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-8 py-2 border-2 border-gray-400 rounded text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
