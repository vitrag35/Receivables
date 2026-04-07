'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { USERS, DB } from '@/lib/ar-data';

interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'PAYMENT' | 'ADJUSTMENT' | 'RETURNED_CHECK';
  subType: string;
  date: string;
  amount: number;
  reference: string;
  user: string;
  raw: any;
}

interface CreateNewDepositViewProps {
  allTransactions: Transaction[];
  onCreateDeposit: (paymentIds: string[], adjustmentIds: string[], depositDate: string, reference: string) => void;
  onExit: () => void;
}

export default function CreateNewDepositView({
  allTransactions,
  onCreateDeposit,
  onExit,
}: CreateNewDepositViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'ALL' | 'PAYMENT' | 'ADJUSTMENT' | 'RETURNED_CHECK'>('ALL');
  const [filterSubType, setFilterSubType] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterAllDates, setFilterAllDates] = useState(true);
  const [filterCustomer, setFilterCustomer] = useState<string>('ALL');
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Get unique values for filters
  const uniqueSubTypes = useMemo(() => {
    const types = new Set<string>();
    allTransactions.forEach((t) => types.add(t.subType));
    return Array.from(types).sort();
  }, [allTransactions]);

  const uniqueCustomers = useMemo(() => {
    const customers = new Set<string>();
    allTransactions.forEach((t) => customers.add(t.customerName));
    return Array.from(customers).sort();
  }, [allTransactions]);

  // Get filtered customers for dropdown
  const filteredCustomersForDropdown = useMemo(() => {
    if (!customerSearchQuery) return uniqueCustomers;

    const query = customerSearchQuery.toLowerCase();
    return uniqueCustomers.filter((customerName) => {
      const customer = Object.values(DB).find((c) => c.name === customerName);
      return (
        customerName.toLowerCase().includes(query) ||
        (customer && customer.code.toLowerCase().includes(query))
      );
    });
  }, [customerSearchQuery, uniqueCustomers]);

  const getDisplayCustomerName = () => {
    return filterCustomer === 'ALL' ? 'All Customers' : filterCustomer;
  };

  const handleSelectCustomerFilter = (customerName: string) => {
    setFilterCustomer(customerName);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      if (filterSubType !== 'ALL' && t.subType !== filterSubType) return false;
      if (!filterAllDates) {
        const tDate = new Date(t.date);
        if (filterStartDate && tDate < new Date(filterStartDate)) return false;
        if (filterEndDate && tDate > new Date(filterEndDate)) return false;
      }
      if (filterCustomer !== 'ALL' && t.customerName !== filterCustomer) return false;
      if (filterUser !== 'ALL' && t.user !== filterUser) return false;
      return true;
    });
  }, [allTransactions, filterType, filterSubType, filterStartDate, filterEndDate, filterAllDates, filterCustomer, filterUser]);

  // Calculate totals
  const paymentTotal = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => filteredTransactions.find((t) => t.id === id))
      .filter((t) => t && (t.type === 'PAYMENT' && (t.raw.transactionType === 'PAYMENT' || t.raw.transactionType === undefined)))
      .reduce((sum, t) => sum + (t?.amount || 0), 0);
  }, [selectedIds, filteredTransactions]);

  const adjustmentTotal = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => filteredTransactions.find((t) => t.id === id))
      .filter((t) => t && t.type === 'ADJUSTMENT')
      .reduce((sum, t) => sum + (t?.amount || 0), 0);
  }, [selectedIds, filteredTransactions]);

  const returnCheckTotal = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => filteredTransactions.find((t) => t.id === id))
      .filter((t) => t && (t.type === 'RETURNED_CHECK' || (t.type === 'PAYMENT' && t.raw.transactionType === 'RETURNED_CHECK')))
      .reduce((sum, t) => sum + (t?.amount || 0), 0);
  }, [selectedIds, filteredTransactions]);

  const totalAmount = paymentTotal + adjustmentTotal + returnCheckTotal;

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleCreateDeposit = () => {
    if (selectedIds.size === 0) return;

    const paymentIds: string[] = [];
    const adjustmentIds: string[] = [];

    Array.from(selectedIds).forEach((id) => {
      const transaction = filteredTransactions.find((t) => t.id === id);
      if (transaction) {
        if (transaction.type === 'ADJUSTMENT') {
          adjustmentIds.push(id);
        } else {
          paymentIds.push(id);
        }
      }
    });

    onCreateDeposit(paymentIds, adjustmentIds, depositDate, reference);
    // Reset form
    setSelectedIds(new Set());
    setDepositDate(new Date().toISOString().split('T')[0]);
    setReference('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filters</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Transaction Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            >
              <option value="ALL">All Types</option>
              <option value="PAYMENT">Payment</option>
              <option value="RETURNED_CHECK">Returned Check</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Sub Type
            </label>
            <select
              value={filterSubType}
              onChange={(e) => setFilterSubType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            >
              <option value="ALL">All Sub Types</option>
              {uniqueSubTypes.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Customer
            </label>
            <div ref={customerDropdownRef} className="relative">
              <input
                type="text"
                placeholder="All Customers"
                value={isCustomerDropdownOpen ? customerSearchQuery : getDisplayCustomerName()}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setIsCustomerDropdownOpen(true);
                }}
                onFocus={() => setIsCustomerDropdownOpen(true)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
              />
              
              {isCustomerDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                  <div
                    onClick={() => handleSelectCustomerFilter('ALL')}
                    className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-sm border-b border-gray-100"
                  >
                    <div className="font-semibold text-gray-800">All Customers</div>
                  </div>
                  {filteredCustomersForDropdown.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                  ) : (
                    filteredCustomersForDropdown.map((customerName) => {
                      const customer = Object.values(DB).find((c) => c.name === customerName);
                      return (
                        <div
                          key={customerName}
                          onClick={() => handleSelectCustomerFilter(customerName)}
                          className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-semibold text-gray-800">{customerName}</div>
                          {customer && <div className="text-xs text-gray-500">ID: {customer.code}</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              User
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            >
              <option value="ALL">All Users</option>
              {USERS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterAllDates}
                onChange={(e) => setFilterAllDates(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-xs font-semibold text-gray-700">All Dates</span>
            </label>
          </div>
        </div>

        {!filterAllDates && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-4 p-4 bg-blue-50 border-b border-blue-200">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
            onChange={selectAll}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-sm font-semibold text-blue-900">
            {selectedIds.size === filteredTransactions.length ? 'Deselect All' : 'Select All'} ({filteredTransactions.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-teal-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase w-8"></th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Sub Type</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase">User</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No transactions match the selected filters
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(transaction.id)}
                        onChange={() => toggleSelection(transaction.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {transaction.type === 'PAYMENT' ? 'P' : transaction.type === 'ADJUSTMENT' ? 'A' : 'R'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{transaction.subType}</td>
                    <td className="px-4 py-3 text-gray-600">{transaction.date}</td>
                    <td className="px-4 py-3 text-gray-600">{transaction.reference}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{transaction.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{transaction.user}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      ${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Payment Total</p>
          <p className="text-2xl font-bold text-blue-900">${paymentTotal.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Adjustment Total</p>
          <p className="text-2xl font-bold text-purple-900">${adjustmentTotal.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Returned Check Total</p>
          <p className="text-2xl font-bold text-orange-900">${returnCheckTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Deposit Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Deposit Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
              Deposit Date
            </label>
            <input
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter reference (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </div>
        </div>
        <div className="mt-4 p-3 bg-white border border-gray-300 rounded">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Total Deposit Amount</p>
          <p className="text-3xl font-bold text-teal-700">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pb-4">
        <button
          onClick={onExit}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-400 transition"
        >
          Exit
        </button>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
        >
          Print
        </button>
        <button
          onClick={handleCreateDeposit}
          disabled={selectedIds.size === 0}
          className="px-6 py-2 bg-green-700 text-white rounded font-semibold hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Create Deposit
        </button>
      </div>
    </div>
  );
}
