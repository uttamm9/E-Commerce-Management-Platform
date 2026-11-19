import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

const CartItem = ({ item, onUpdateQuantity, onRemove, loading = false }) => {
  const product = item.product || {};
  const currentPrice = item.unitPrice || product.discountPrice || product.price || 0;
  const image =
    product.images && product.images.length > 0
      ? product.images[0].url
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';

  const canIncrease = item.quantity < (product.stock || 99);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-b-0">
      {/* Product Image & Details */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Link
          to={`/products/${product.slug || product._id}`}
          className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100"
        >
          <img
            src={image}
            alt={item.name || product.name}
            className="w-full h-full object-cover"
          />
        </Link>
        <div className="flex-1">
          <Link
            to={`/products/${product.slug || product._id}`}
            className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
          >
            {item.name || product.name}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">
            SKU: {item.sku || product.sku}
          </p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            Unit Price: {formatPrice(currentPrice)}
          </p>
        </div>
      </div>

      {/* Quantity & Subtotal Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
        {/* Quantity Toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => onUpdateQuantity(product._id, item.quantity - 1)}
            disabled={item.quantity <= 1 || loading}
            className="p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            title="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center text-xs font-semibold text-gray-800">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(product._id, item.quantity + 1)}
            disabled={!canIncrease || loading}
            className="p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            title={canIncrease ? 'Increase quantity' : 'Maximum stock reached'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right min-w-[90px]">
          <p className="text-sm font-bold text-gray-900">
            {formatPrice(item.subtotal || currentPrice * item.quantity)}
          </p>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onRemove(product._id)}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
