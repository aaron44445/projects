import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, TransactionWithRelations, PaginationMeta, DailySummary } from '../../lib/api';
import { Receipt, Plus, Loader2, ChevronLeft, ChevronRight, CreditCard, Banknote, TrendingUp } from 'lucide-react';

const TYPE_COLORS = {
  SERVICE: 'bg-blue-100 text-blue-700',
  PRODUCT: 'bg-purple-100 text-purple-700',
  REFUND: 'bg-red-100 text-red-700',
};

const PAYMENT_ICONS = {
  CASH: Banknote,
  CARD: CreditCard,
  OTHER: Receipt,
};

export default function TransactionListPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [page, dateFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txnRes, summaryRes] = await Promise.all([
        api.getTransactions({
          page,
          limit: 20,
          startDate: `${dateFilter}T00:00:00Z`,
          endDate: `${dateFilter}T23:59:59Z`,
        }),
        api.getDailySummary(dateFilter),
      ]);
      setTransactions(txnRes.data);
      setMeta(txnRes.meta);
      setSummary(summaryRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (str: string) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-teal-600" />
            Transactions
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
          <Link to="/transactions/new" className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
            <Plus className="w-5 h-5" /> New Sale
          </Link>
        </div>
      </div>

      {/* Daily Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${summary.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Services</p>
            <p className="text-xl font-bold text-blue-600">${summary.byType.SERVICE.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{summary.byType.SERVICE.count} transactions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Products</p>
            <p className="text-xl font-bold text-purple-600">${summary.byType.PRODUCT.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{summary.byType.PRODUCT.count} transactions</p>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No transactions for this date</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((txn) => {
                  const PaymentIcon = PAYMENT_ICONS[txn.paymentMethod];
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{formatTime(txn.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${TYPE_COLORS[txn.type]}`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {txn.client ? (
                          <Link to={`/clients/${txn.client.id}`} className="text-teal-600 hover:text-teal-700">
                            {txn.client.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Walk-in</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <PaymentIcon className="w-4 h-4" /> {txn.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        ${Number(txn.total).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">Page {page} of {meta.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded-lg disabled:opacity-50">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="p-2 border rounded-lg disabled:opacity-50">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
