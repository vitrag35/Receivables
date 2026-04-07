'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Customer, DB } from '@/lib/ar-data';

interface CustomerBarProps {
  selectedCustomerId: string;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customerId: string) => void;
}

export default function CustomerBar({
  selectedCustomerId,
  selectedCustomer,
  onSelectCustomer,
}: CustomerBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalDue = selectedCustomer
    ? selectedCustomer.charges.reduce((sum, charge) => sum + (charge.amount - charge.paid), 0)
    : 0;

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return Object.values(DB);
    
    const query = searchQuery.toLowerCase();
    return Object.values(DB).filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const displayText = selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.code})` : '';

  const handleSelectCustomer = (customerId: string) => {
    onSelectCustomer(customerId);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-5">
      <label className="text-xs font-semibold text-gray-600 uppercase">Customer:</label>
      
      <div className="relative min-w-72" ref={dropdownRef}>
        <input
          type="text"
          placeholder="-- Select a Customer --"
          value={isDropdownOpen ? searchQuery : displayText}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
        
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer.id)}
                  className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">{customer.name}</div>
                  <div className="text-xs text-gray-500">ID: {customer.code}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="ml-auto bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex flex-col items-end">
          <div className="text-xs uppercase font-semibold text-gray-600">Balance Due</div>
          <div className={`text-2xl font-bold ${totalDue > 0 ? 'text-red-700' : 'text-green-600'}`}>
            ${totalDue.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
