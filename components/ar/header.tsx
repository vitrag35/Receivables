import { Search } from 'lucide-react';

interface HeaderProps {
  onOpenDeposits?: () => void;
  onOpenSearch?: () => void;
}

export default function Header({ onOpenDeposits, onOpenSearch }: HeaderProps) {
  return (
    <div className="bg-teal-700 text-white px-6 py-3 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Account Receivables - AR Payment Module</h1>
      <div className="flex items-center gap-4">
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold transition flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        )}
        {onOpenDeposits && (
          <button
            onClick={onOpenDeposits}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold transition"
          >
            Deposits
          </button>
        )}
        <span className="text-xs opacity-80">Prototype</span>
      </div>
    </div>
  );
}
