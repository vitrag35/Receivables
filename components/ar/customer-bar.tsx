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
  const totalDue = selectedCustomer
    ? selectedCustomer.charges.reduce((sum, charge) => sum + (charge.amount - charge.paid), 0)
    : 0;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-5">
      <label className="text-xs font-semibold text-gray-600 uppercase">Customer:</label>
      <select
        value={selectedCustomerId}
        onChange={(e) => onSelectCustomer(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm min-w-72 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
      >
        <option value="">-- Select a Customer --</option>
        {Object.values(DB).map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name} ({customer.code})
          </option>
        ))}
      </select>

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
