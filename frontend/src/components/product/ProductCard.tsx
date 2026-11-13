import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { Product } from '../../types';
import { StarRating } from '../ui/StarRating';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IMG_FALLBACK } from '../../lib/imgFallback';
import clsx from 'clsx';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const { addItem, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wished, setWished] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!product.in_stock) return;
    setAdding(true);
    try {
      await addItem(product.id, 1);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 1500);
    } catch {
      // Error handled by context
    } finally {
      setAdding(false);
    }
  };

  const imgSrc = product.image_url || IMG_FALLBACK;

  return (
    <Link to={`/products/${product.id}`} className="group card hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = IMG_FALLBACK;
          }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount_percentage > 0 && (
            <span className="badge bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              -{product.discount_percentage}%
            </span>
          )}
          {product.is_trending && (
            <span className="badge bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              🔥 Trending
            </span>
          )}
        </div>

        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          onClick={(e) => { e.preventDefault(); setWished(!wished); }}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wished
            ? <HeartSolid className="h-4 w-4 text-red-500" />
            : <HeartIcon className="h-4 w-4 text-gray-500" />
          }
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-blue-600 font-medium mb-1">{product.category.name}</p>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-xs text-gray-400 mb-2">{product.brand}</p>
        )}
        <StarRating rating={product.rating} reviewCount={product.review_count} />

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-base font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-gray-400 line-through ml-1.5">${product.original_price.toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock || adding}
            className={clsx(
              'p-2 rounded-lg transition-all duration-200',
              product.in_stock
                ? addSuccess
                  ? 'bg-green-500 text-white scale-95'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-110'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
            aria-label="Add to cart"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
