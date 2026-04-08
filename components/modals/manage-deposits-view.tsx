'use client';

import { useState } from 'react';
import { Deposit, DB } from '@/lib/ar-data';

interface ManageDepositsViewProps {
  deposits: Deposit[];
  onDeleteDeposit: (depositId: string) => void;
}

export default function ManageDepositsView({
  deposits,
  onDeleteDeposit,
}: ManageDepositsViewProps) {
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');
  const [transactionSourceFilter, setTransactionSourceFilter] = useState<'ALL' | 'AR' | 'POS'>('ALL');

  // Filter active and deleted deposits
  let activeDeposits = deposits.filter((d) => !d.isDeleted);
  let deletedDeposits = deposits.filter((d) => d.isDeleted);

  // Apply transaction source filter
  if (transactionSourceFilter !== 'ALL') {
    activeDeposits = activeDeposits.filter((d) => d.transactionSource === transactionSourceFilter);
    deletedDeposits = deletedDeposits.filter((d) => d.transactionSource === transactionSourceFilter);
  }

  const handleDeleteDeposit = (depositId: string) => {
    if (window.confirm('Are you sure you want to delete this deposit?')) {
      onDeleteDeposit(depositId);
    }
  };

  const handlePrint = (deposit: Deposit) => {
    // Simple print implementation
    const content = `
      DEPOSIT RECEIPT
      ===============
      Deposit ID: ${deposit.depositId}
      Deposit Date: ${deposit.depositDate}
      Reference: ${deposit.reference || 'N/A'}
      
      Payment Total: $${deposit.paymentTotal.toFixed(2)}
      Adjustment Total: $${deposit.adjustmentTotal.toFixed(2)}
      Return Check Total: $${deposit.returnCheckTotal.toFixed(2)}
      
      Total Amount: $${deposit.amount.toFixed(2)}
    `;
    
    const printWindow = window.open('', '', 'width=600,height=400');
    if (printWindow) {
      printWindow.document.write('<pre>' + content + '</pre>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* View Mode Tabs */}
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 font-semibold transition ${
              viewMode === 'active'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Active Deposits ({activeDeposits.length})
          </button>
          <button
            onClick={() => setViewMode('deleted')}
            className={`px-4 py-2 font-semibold transition ${
              viewMode === 'deleted'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            View Deleted Deposits ({deletedDeposits.length})
          </button>
        </div>

        {/* Transaction Source Filter */}
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
          <label className="font-semibold text-gray-700 text-sm">Transaction Source:</label>
          <select
            value={transactionSourceFilter}
            onChange={(e) => setTransactionSourceFilter(e.target.value as 'ALL' | 'AR' | 'POS')}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Transactions</option>
            <option value="AR">Posted A/R</option>
            <option value="POS">Posted POS</option>
          </select>
        </div>
      </div>

      {/* Active Deposits */}
      {viewMode === 'active' && (
        <div>
          {activeDeposits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No active deposits</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Deposit Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Batch</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Payment Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Adjustment Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Return Check Total</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Transaction Source</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDeposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-bold text-gray-800">{deposit.depositId}</td>
                      <td className="px-4 py-3 text-gray-600">{deposit.depositDate}</td>
                      <td className="px-4 py-3 text-gray-600">{deposit.batch || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600">{deposit.reference || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-semibold">${deposit.paymentTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-semibold">${deposit.adjustmentTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-semibold">${deposit.returnCheckTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          deposit.transactionSource === 'AR' 
                            ? 'bg-purple-100 text-purple-700' 
                            : deposit.transactionSource === 'POS'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {deposit.transactionSource === 'AR' ? 'Posted A/R' : deposit.transactionSource === 'POS' ? 'Posted POS' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                          POSTED
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePrint(deposit)}
                            className="px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 rounded transition"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => handleDeleteDeposit(deposit.id)}
                            className="px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 rounded transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Deleted Deposits */}
      {viewMode === 'deleted' && (
        <div>
          {deletedDeposits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No deleted deposits</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Deposit Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Reference</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Payment Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Adjustment Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Return Check Total</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Transaction Source</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Deleted Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedDeposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-gray-200 hover:bg-gray-50 transition opacity-75">
                      <td className="px-4 py-3 font-bold text-gray-600">{deposit.depositId}</td>
                      <td className="px-4 py-3 text-gray-500">{deposit.depositDate}</td>
                      <td className="px-4 py-3 text-gray-500">{deposit.reference || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-600 font-semibold">${deposit.paymentTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 font-semibold">${deposit.adjustmentTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 font-semibold">${deposit.returnCheckTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          deposit.transactionSource === 'AR' 
                            ? 'bg-purple-100 text-purple-700' 
                            : deposit.transactionSource === 'POS'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {deposit.transactionSource === 'AR' ? 'Posted A/R' : deposit.transactionSource === 'POS' ? 'Posted POS' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{deposit.deletedDate || 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handlePrint(deposit)}
                          className="px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 rounded transition"
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
