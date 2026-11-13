import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderListResponse } from '../types';
import api, { getErrorMessage } from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { EmptyState, ErrorMessage } from '../components/ui/ErrorMessage';
import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-blue',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red', refunded: 'badge-gray',
};

import { IMG_FALLBACK_SM } from '../lib/imgFallback';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<OrderListResponse>('/orders?page_size=20')
      .then(r => { setOrders(r.data.items); setTotal(r.data.total); })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        My Orders
        {total > 0 && <span className="ml-2 text-base font-normal text-gray-500">({total})</span>}
      </h1>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Start shopping to see your orders here."
          action={<Link to="/products" className="btn-primary">Browse Products</Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card p-4 block hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 font-mono">{order.order_number}</p>
                    <span className={clsx('badge', STATUS_STYLES[order.status] || 'badge-gray')}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {order.payment?.status === 'failed' && (
                      <span className="badge badge-red">Payment Failed</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {order.items.slice(0, 3).map(item => (
                      <img
                        key={item.id}
                        src={item.product_image || IMG_FALLBACK_SM}
                        alt={item.product_name}
                        className="w-8 h-8 object-cover rounded bg-gray-100"
                        onError={e => (e.target as HTMLImageElement).src = IMG_FALLBACK_SM}
                      />
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-gray-400">+{order.items.length - 3} more</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-blue-600 mt-1">View Details →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
