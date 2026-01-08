import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Product, PaginationMeta } from '../../lib/api';
import { Package, Plus, Loader2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [showInactive, showLowStock]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const result = await api.getProducts({
        limit: 50,
        active: !showInactive ? true : undefined,
        lowStock: showLowStock ? true : undefined,
      });
      setProducts(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockCount = products.filter(p => p.isLowStock).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-teal-600" />
            Products
          </h1>
          <p className="text-gray-500 mt-1">
            {meta?.total || 0} products
            {lowStockCount > 0 && (
              <span className="ml-2 text-amber-600">
                <AlertTriangle className="w-4 h-4 inline" /> {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowLowStock(!showLowStock)} className="flex items-center gap-2 text-sm text-gray-600">
            {showLowStock ? <ToggleRight className="w-5 h-5 text-amber-600" /> : <ToggleLeft className="w-5 h-5" />}
            Low stock only
          </button>
          <button onClick={() => setShowInactive(!showInactive)} className="flex items-center gap-2 text-sm text-gray-600">
            {showInactive ? <ToggleRight className="w-5 h-5 text-teal-600" /> : <ToggleLeft className="w-5 h-5" />}
            Show inactive
          </button>
          <Link to="/products/new" className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
            <Plus className="w-5 h-5" /> Add Product
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className={`hover:bg-gray-50 cursor-pointer ${!product.isActive ? 'opacity-60' : ''}`}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.description && <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.sku || '-'}</td>
                  <td className="px-6 py-4 text-right font-medium">${Number(product.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={product.isLowStock ? 'text-amber-600 font-medium' : ''}>
                      {product.quantity}
                    </span>
                    {product.isLowStock && <AlertTriangle className="w-4 h-4 inline ml-1 text-amber-600" />}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
