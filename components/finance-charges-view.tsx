'use client';

import { useState, useMemo } from 'react';
import { Customer, FinanceCharge, DB } from '@/lib/ar-data';
import FinanceChargesModal from './ar/modals/finance-charges-modal';
import { X, Search } from 'lucide-react';

interface FinanceChargesViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FinanceChargesView({ isOpen, onClose }: FinanceChargesViewProps) {
  const [selectedFinanceChargeId, setSelectedFinanceChargeId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [useAllDates, setUseAllDates] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Gather all finance charges from all customers
  const allFinanceCharges: (FinanceCharge & { customerName: string; customerId: string; customerCode: string })[] = [];
  const allCustomers: { id: string; name: string; code: string }[] = [];
  
  Object.entries(DB).forEach(([customerId, customer]) => {
    allCustomers.push({ id: customer.id, name: customer.name, code: customer.code });
    customer.financeCharges?.forEach((fc) => {
      allFinanceCharges.push({
        ...fc,
        customerName: customer.name,
        customerId: customer.id,
        customerCode: customer.code,
      });
    });
  });

  // Apply filters
  const filteredCharges = useMemo(() => {
    return allFinanceCharges.filter((fc) => {
      // Customer filter
      if (customerFilter !== 'ALL' && fc.customerId !== customerFilter) {
        return false;
      }

      // Customer search
      if (customerSearch) {
        const searchLower = customerSearch.toLowerCase();
        const matchesName = fc.customerName.toLowerCase().includes(searchLower);
        const matchesCode = fc.customerCode.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesCode) {
          return false;
        }
      }

      // Date filter
      if (!useAllDates) {
        const chargeDate = fc.calculationDate;
        if (startDate && chargeDate < startDate) return false;
        if (endDate && chargeDate > endDate) return false;
      }

      return true;
    });
  }, [customerFilter, customerSearch, useAllDates, startDate, endDate, allFinanceCharges]);

  const selectedCharge = allFinanceCharges.find((fc) => fc.id === selectedFinanceChargeId);
  const selectedCustomer = selectedCustomerId ? (DB[selectedCustomerId as keyof typeof DB] as Customer) : null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PARTIAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PAID':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">View Finance Charges Log</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="max-w-full mx-auto space-y-4">
            {/* Filter Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-12 gap-4 items-end">
                {/* Date Range Filters */}
                <div className="col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Starting Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={useAllDates}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ending Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={useAllDates}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <div className="col-span-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allDates"
                    checked={useAllDates}
                    onChange={(e) => setUseAllDates(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <label htmlFor="allDates" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    All Dates
                  </label>
                </div>

                {/* Customer Filter */}
                <div className="col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer:</label>
                  <select
                    value={customerFilter}
                    onChange={(e) => {
                      setCustomerFilter(e.target.value);
                      setCustomerSearch('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="ALL">All Customers</option>
                    {allCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.code} - {cust.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

        {/* Main Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-700 text-white">
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Calc Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Principal</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Interest Rate</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Interest Charged</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Balance</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCharges.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No finance charges recorded.
                    </td>
                  </tr>
                ) : (
                  filteredCharges.map((fc) => {
                    const balanceDue = fc.interestAmount - fc.paid;
                    return (
                      <tr
                        key={fc.id}
                        onClick={() => {
                          setSelectedFinanceChargeId(fc.id);
                          setSelectedCustomerId(fc.customerId);
                        }}
                        className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                          selectedFinanceChargeId === fc.id ? 'bg-blue-100' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{fc.customerName}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {Object.values(DB)
                            .flatMap((c) => c.charges)
                            .find((ch) => ch.id === fc.chargeId)?.num}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fc.calculationDate}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ${fc.principalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{fc.interestRate}%</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ${fc.interestAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">${fc.paid.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          ${balanceDue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(
                              fc.status
                            )}`}
                          >
                            {fc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

          </div>
        </div>

        {/* Finance Charge Details Modal */}
        {selectedCharge && selectedCustomer && (
          <FinanceChargesModal
            isOpen={!!selectedFinanceChargeId}
            onClose={() => {
              setSelectedFinanceChargeId(null);
              setSelectedCustomerId(null);
            }}
            financeCharge={selectedCharge}
            customer={selectedCustomer}
          />
        )}
      </div>
    </div>
  );
}
