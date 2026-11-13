import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, ArrowLeftIcon, CheckIcon, TruckIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Product } from '../types';
import api, { getErrorMessage } from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StarRating } from '../components/ui/StarRating';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

import { IMG_FALLBACK } from '../lib/imgFallback';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Product>(`/products/${id}`);
        setProduct(res.data);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!product?.in_stock) return;
    setAdding(true);
    setAddError('');
    try {
      await addItem(product.id, quantity);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (e) {
      setAddError(getErrorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !product) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <ErrorMessage message={error || 'Product not found'} />
      <Link to="/products" className="btn-primary mt-4 inline-block">Back to Products</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category_id=${product.category.id}`} className="hover:text-blue-600">{product.category.name}</Link>
        <span>/</span>
        <span className="text-gray-800 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            <img
              src={product.image_url || IMG_FALLBACK}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => (e.target as HTMLImageElement).src = IMG_FALLBACK}
            />
          </div>
          {product.discount_percentage > 0 && (
            <span className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm">
              -{product.discount_percentage}% OFF
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {product.category.name}
            </span>
            {product.brand && (
              <span className="ml-2 text-sm text-gray-500">{product.brand}</span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.rating} reviewCount={product.review_count} size="md" />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xl text-gray-400 line-through">${product.original_price.toFixed(2)}</span>
            )}
            {product.discount_percentage > 0 && (
              <span className="text-green-600 font-semibold">
                Save ${((product.original_price || 0) - product.price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-6">
            {product.in_stock ? (
              <>
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">In Stock</span>
                <span className="text-sm text-gray-400">({product.stock_quantity} available)</span>
              </>
            ) : (
              <span className="text-sm text-red-500 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Quantity */}
          {product.in_stock && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >-</button>
                <span className="px-4 py-2 text-sm font-semibold text-gray-800 min-w-[2.5rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >+</button>
              </div>
            </div>
          )}

          {addError && <ErrorMessage message={addError} onDismiss={() => setAddError('')} className="mb-4" />}

          {/* Add to Cart */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock || adding}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all duration-200',
                product.in_stock
                  ? addSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {adding ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : addSuccess ? (
                <>
                  <CheckIcon className="h-5 w-5" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5" />
                  {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                </>
              )}
            </button>
            <Link
              to="/cart"
              className="btn-secondary py-3 px-5 rounded-xl font-semibold"
            >
              View Cart
            </Link>
          </div>

          {/* Shipping info */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <TruckIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Free Shipping on orders over $50</p>
              <p className="text-xs text-gray-500 mt-0.5">Estimated delivery: 3–5 business days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-10">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    </div>
  );
}
