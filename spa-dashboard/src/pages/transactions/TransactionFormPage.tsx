import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, Client, Service, Product, TransactionItem } from '../../lib/api';
import { ArrowLeft, Loader2, Plus, Minus, Trash2, DollarSign } from 'lucide-react';

export default function TransactionFormPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'OTHER'>('CARD');
  const [taxRate] = useState(0.08); // 8% tax

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [c, s, p] = await Promise.all([
        api.getClients({ limit: 100 }),
        api.getServices({ active: true, limit: 100 }),
        api.getProducts({ active: true, limit: 100 }),
      ]);
      setClients(c.data);
      setServices(s.data);
      setProducts(p.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const addServiceItem = (service: Service) => {
    const existing = items.find(i => i.type === 'service' && i.id === service.id);
    if (existing) return;
    setItems([...items, {
      type: 'service',
      id: service.id,
      name: service.name,
      quantity: 1,
      unitPrice: Number(service.price),
      total: Number(service.price),
    }]);
  };

  const addProductItem = (product: Product) => {
    const existing = items.find(i => i.type === 'product' && i.id === product.id);
    if (existing) {
      updateItemQuantity(items.indexOf(existing), existing.quantity + 1);
      return;
    }
    setItems([...items, {
      type: 'product',
      id: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: Number(product.price),
      total: Number(product.price),
    }]);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      quantity,
      total: newItems[index].unitPrice * quantity,
    };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const hasServices = items.some(i => i.type === 'service');
  const hasProducts = items.some(i => i.type === 'product');
  const transactionType = hasServices && !hasProducts ? 'SERVICE' : !hasServices && hasProducts ? 'PRODUCT' : 'SERVICE';

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsSaving(true);
    setError('');
    try {
      await api.createTransaction({
        clientId: clientId || null,
        type: transactionType,
        items,
        subtotal,
        tax,
        total,
        paymentMethod,
        status: 'COMPLETED',
      });
      navigate('/transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/transactions" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold">New Sale</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Item Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Client (optional)</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Walk-in customer</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Services */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">Services</h3>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => addServiceItem(s)}
                  disabled={items.some(i => i.type === 'service' && i.id === s.id)}
                  className="text-left p-3 border rounded-lg hover:bg-teal-50 hover:border-teal-200 disabled:opacity-50 disabled:bg-gray-50"
                >
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-teal-600 text-sm">${Number(s.price).toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">Products</h3>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => addProductItem(p)}
                  className="text-left p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-200"
                >
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-purple-600 text-sm">${Number(p.price).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{p.quantity} in stock</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="bg-white rounded-lg shadow p-4 h-fit">
          <h3 className="font-medium text-gray-900 mb-4">Cart</h3>

          {items.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No items added</p>
          ) : (
            <div className="space-y-3 mb-4">
              {items.map((item, index) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">${item.unitPrice.toFixed(2)} each</p>
                  </div>
                  {item.type === 'product' ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateItemQuantity(index, item.quantity - 1)} className="p-1 hover:bg-gray-200 rounded">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateItemQuantity(index, item.quantity + 1)} className="p-1 hover:bg-gray-200 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">x1</span>
                  )}
                  <p className="font-medium w-16 text-right">${item.total.toFixed(2)}</p>
                  <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
            <div className="flex gap-2">
              {(['CARD', 'CASH', 'OTHER'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-2 rounded-lg border ${paymentMethod === method ? 'bg-teal-50 border-teal-500 text-teal-700' : 'hover:bg-gray-50'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Complete */}
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || isSaving}
            className="w-full mt-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
            Complete Sale - ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
