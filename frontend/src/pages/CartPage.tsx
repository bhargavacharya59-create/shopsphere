import { Link, useNavigate } from 'react-router-dom';
import { TrashIcon, ShoppingBagIcon, ArrowRightIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

import { IMG_FALLBACK, IMG_FALLBACK_SM } from '../lib/imgFallback';

export default function CartPage() {
  const { cart, isLoading, error, updateItem, removeItem, clearError } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Sign in to view your cart</h2>
        <p className="text-gray-500 mb-6">Your cart items are saved when you're logged in.</p>
        <Link to="/login" className="btn-primary mr-3">Sign In</Link>
        <Link to="/register" className="btn-secondary">Create Account</Link>
      </div>
    );
  }

  if (isLoading && !cart) return <PageLoader />;

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  const subtotal = cart?.total ?? 0;
  const shipping = subtotal >= 50 ? 0 : (subtotal > 0 ? 9.99 : 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Shopping Cart
        {!isEmpty && <span className="ml-2 text-base font-normal text-gray-500">({cart?.item_count} items)</span>}
      </h1>

      {error && <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />}

      {isEmpty ? (
        <div className="text-center py-20">
          <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some products to get started.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card p-4 flex gap-4">
                <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
                  <img
                    src={item.product.image_url || IMG_FALLBACK_SM}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={e => (e.target as HTMLImageElement).src = IMG_FALLBACK_SM}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-xs text-blue-600 mb-0.5">{item.product.category.name}</p>
                      <Link to={`/products/${item.product.id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600 line-clamp-2">
                        {item.product.name}
                      </Link>
                      {item.product.brand && <p className="text-xs text-gray-400">{item.product.brand}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-gray-900">${item.subtotal.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">${item.product.price.toFixed(2)} each</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                        disabled={isLoading}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold text-gray-800 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isLoading || item.quantity >= item.product.stock_quantity}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="hidden sm:block">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart?.item_count} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    <span>${shipping.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-5 btn-primary py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRightIcon className="h-4 w-4" />
              </button>

              <Link to="/products" className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-3">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
