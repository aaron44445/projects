import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Loader2, Save, Trash2, Plus, Minus } from 'lucide-react';

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: 0,
    cost: 0,
    quantity: 0,
    reorderLevel: 10,
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [adjustQty, setAdjustQty] = useState(0);
  const [showAdjust, setShowAdjust] = useState(false);

  useEffect(() => {
    if (isEditing && id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const product = await api.getProduct(id!);
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        price: Number(product.price),
        cost: product.cost ? Number(product.cost) : 0,
        quantity: product.quantity,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const data = {
        ...formData,
        description: formData.description || null,
        sku: formData.sku || null,
        cost: formData.cost || null,
      };
      if (isEditing) {
        await api.updateProduct(id!, data);
      } else {
        await api.createProduct(data);
      }
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustQuantity = async () => {
    if (adjustQty === 0) return;
    try {
      await api.adjustProductQuantity(id!, adjustQty, 'Manual adjustment');
      setFormData(p => ({ ...p, quantity: p.quantity + adjustQty }));
      setAdjustQty(0);
      setShowAdjust(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteProduct(id!);
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/products" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Product' : 'New Product'}</h1>
        </div>
        {isEditing && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdjust(true)} className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm">
              Adjust Stock
            </button>
            <button onClick={() => setShowDelete(true)} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input type="number" value={formData.cost} onChange={(e) => setFormData(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" value={formData.quantity} onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} min={0} disabled={isEditing} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-gray-100" />
              {isEditing && <p className="text-xs text-gray-500 mt-1">Use "Adjust Stock" to change quantity</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input type="number" value={formData.reorderLevel} onChange={(e) => setFormData(p => ({ ...p, reorderLevel: parseInt(e.target.value) || 0 }))} min={0} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-teal-600 rounded" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Link to="/products" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </form>

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Adjust Stock</h3>
            <p className="text-sm text-gray-500 mb-4">Current: {formData.quantity} units</p>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setAdjustQty(q => q - 1)} className="p-2 border rounded-lg hover:bg-gray-50"><Minus className="w-5 h-5" /></button>
              <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)} className="w-24 text-center px-3 py-2 border rounded-lg" />
              <button onClick={() => setAdjustQty(q => q + 1)} className="p-2 border rounded-lg hover:bg-gray-50"><Plus className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">New quantity: {formData.quantity + adjustQty}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowAdjust(false); setAdjustQty(0); }} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleAdjustQuantity} disabled={adjustQty === 0} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Product</h3>
            <p className="text-gray-600 mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
