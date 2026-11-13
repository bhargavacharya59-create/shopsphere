import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Order } from '../types';
import api, { getErrorMessage } from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-blue',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red', refunded: 'badge-gray',
};

import { IMG_FALLBACK_SM } from '../lib/imgFallback';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Order>(`/orders/${orderId}`)
      .then(r => setOrder(r.data))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <PageLoader />;
  if (error || !order) return <div className="max-w-2xl mx-auto px-4 py-16"><ErrorMessage message={error || 'Order not found'} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/orders" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 font-mono">{order.order_number}</h1>
            <span className={clsx('badge', STATUS_STYLES[order.status] || 'badge-gray')}>
              {order.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Items */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Items ({order.items.length})</h2>
            <div className="divide-y divide-gray-100">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-3 py-3">
                  <img
                    src={item.product_image || IMG_FALLBACK_SM}
                    alt={item.product_name}
                    className="w-14 h-14 object-cover rounded-lg bg-gray-100"
                    onError={e => (e.target as HTMLImageElement).src = IMG_FALLBACK_SM}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">${item.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          {order.payment && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={clsx('badge', order.payment.status === 'completed' ? 'badge-green' : 'badge-red')}>{order.payment.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Method</span><span>{order.payment.payment_method}</span></div>
                {order.payment.card_last_four && <div className="flex justify-between"><span className="text-gray-500">Card</span><span>•••• {order.payment.card_last_four}</span></div>}
                {order.payment.transaction_id && <div className="flex justify-between"><span className="text-gray-500">Transaction</span><span className="font-mono text-xs">{order.payment.transaction_id}</span></div>}
                {order.payment.failure_reason && <div className="text-red-600 bg-red-50 rounded-lg p-2 text-xs">{order.payment.failure_reason}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Summary + Shipping */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Order Total</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shipping_cost === 0 ? <span className="text-green-600">FREE</span> : `$${order.shipping_cost.toFixed(2)}`}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Shipping Address</h2>
            <address className="not-italic text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-800">{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}{order.shipping_state && `, ${order.shipping_state}`} {order.shipping_zip}</p>
              <p>{order.shipping_country}</p>
              <p className="text-gray-500">{order.shipping_email}</p>
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}
