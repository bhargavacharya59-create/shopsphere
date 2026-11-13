import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Order } from '../types';
import api, { getErrorMessage } from '../lib/api';
import { PageLoader } from '../components/ui/LoadingSpinner';

import { IMG_FALLBACK_SM } from '../lib/imgFallback';

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order && orderId) {
      api.get<Order>(`/orders/${orderId}`)
        .then(r => setOrder(r.data))
        .catch(e => setError(getErrorMessage(e)))
        .finally(() => setLoading(false));
    }
  }, [orderId, order]);

  if (loading) return <PageLoader />;
  if (error || !order) return <div className="text-center py-16"><p className="text-red-500">{error || 'Order not found'}</p></div>;

  const paymentOk = order.payment?.status === 'completed';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      {/* Status Banner */}
      <div className={`rounded-2xl p-8 text-center mb-8 ${paymentOk ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        {paymentOk ? (
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-3" />
        ) : (
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-3" />
        )}
        <h1 className={`text-2xl font-bold mb-2 ${paymentOk ? 'text-green-800' : 'text-red-800'}`}>
          {paymentOk ? 'Order Confirmed! 🎉' : 'Payment Failed'}
        </h1>
        <p className={`text-sm ${paymentOk ? 'text-green-600' : 'text-red-600'}`}>
          {paymentOk
            ? `Your order ${order.order_number} has been placed successfully.`
            : order.payment?.failure_reason || 'Payment could not be processed. Please try again later.'}
        </p>
      </div>

      {/* Order Details Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Order Details</h2>
          <span className="badge-blue font-mono">{order.order_number}</span>
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100 mb-4">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-3">
              <img
                src={item.product_image || IMG_FALLBACK_SM}
                alt={item.product_name}
                className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                onError={e => (e.target as HTMLImageElement).src = IMG_FALLBACK_SM}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
              </div>
              <p className="text-sm font-semibold">${item.subtotal.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shipping_cost === 0 ? <span className="text-green-600">FREE</span> : `$${order.shipping_cost.toFixed(2)}`}</span></div>
          <div className="flex justify-between text-gray-600"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Shipping Info */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Shipping To</h3>
        <p className="text-sm text-gray-700 font-medium">{order.shipping_name}</p>
        <p className="text-sm text-gray-600">{order.shipping_address}</p>
        <p className="text-sm text-gray-600">{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
        <p className="text-sm text-gray-600">{order.shipping_email}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/orders" className="btn-secondary flex-1 py-3 text-center rounded-xl font-semibold">
          View All Orders
        </Link>
        <Link to="/products" className="btn-primary flex-1 py-3 text-center rounded-xl font-semibold flex items-center justify-center gap-2">
          Continue Shopping
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
