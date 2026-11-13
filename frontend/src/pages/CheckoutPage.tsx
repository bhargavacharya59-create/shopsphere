import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../lib/api';
import { Order, CreateOrderRequest } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { IMG_FALLBACK_SM } from '../lib/imgFallback';

type Step = 'shipping' | 'payment' | 'review';

// ── Field component defined OUTSIDE parent — never remounts on re-render ──────
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  half?: boolean;
  autoComplete?: string;
}

function Field({ label, value, onChange, type = 'text', placeholder = '', error, half, autoComplete }: FieldProps) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        className={`input-field ${error ? 'border-red-400 focus:ring-red-500' : ''}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('shipping');

  // Shipping form state
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');

  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <Link to="/login" className="btn-primary">Sign In to Checkout</Link>
      </div>
    );
  }
  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-gray-600">Your cart is empty.</p>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  const subtotal = cart.total;
  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;

  const validateShipping = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Valid email required';
    if (!address.trim()) errors.address = 'Address is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!zipCode.trim()) errors.zip_code = 'ZIP code is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = () => {
    const errors: Record<string, string> = {};
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.length < 13 || raw.length > 19) errors.card_number = 'Invalid card number';
    if (!cardName.trim()) errors.card_name = 'Cardholder name required';
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) errors.expiry = 'Format: MM/YY';
    if (!cvv || cvv.length < 3) errors.cvv = 'Invalid CVV';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const orderReq: CreateOrderRequest = {
        shipping: {
          name,
          email,
          phone: phone || undefined,
          address,
          city,
          state: stateVal || undefined,
          zip_code: zipCode,
          country,
        },
        payment_method: 'mock_card',
        card_last_four: cardNumber.replace(/\s/g, '').slice(-4),
      };
      const res = await api.post<Order>('/orders', orderReq);
      await fetchCart();
      navigate(`/orders/${res.data.id}/confirmation`, { state: { order: res.data } });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPlacing(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'shipping', label: 'Shipping' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  const clearErr = (field: string) =>
    setFieldErrors(fe => { const n = { ...fe }; delete n[field]; return n; });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i < stepIdx ? 'bg-green-500 text-white' : i === stepIdx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === stepIdx ? 'text-blue-600' : 'text-gray-500'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${i < stepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form area ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="card p-6">

            {/* SHIPPING STEP */}
            {step === 'shipping' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Full Name *" value={name} onChange={v => { setName(v); clearErr('name'); }}
                    placeholder="John Doe" error={fieldErrors.name} autoComplete="name"
                  />
                  <Field
                    label="Email Address *" value={email} onChange={v => { setEmail(v); clearErr('email'); }}
                    type="email" placeholder="john@example.com" error={fieldErrors.email} autoComplete="email"
                  />
                  <Field
                    label="Phone" value={phone} onChange={setPhone}
                    type="tel" placeholder="+1 (555) 000-0000" autoComplete="tel"
                  />
                  <Field
                    label="Country" value={country} onChange={setCountry}
                    placeholder="US" half autoComplete="country"
                  />
                  <Field
                    label="Street Address *" value={address} onChange={v => { setAddress(v); clearErr('address'); }}
                    placeholder="123 Main St" error={fieldErrors.address} autoComplete="street-address"
                  />
                  <Field
                    label="City *" value={city} onChange={v => { setCity(v); clearErr('city'); }}
                    placeholder="New York" half error={fieldErrors.city} autoComplete="address-level2"
                  />
                  <Field
                    label="State / Province" value={stateVal} onChange={setStateVal}
                    placeholder="NY" half autoComplete="address-level1"
                  />
                  <Field
                    label="ZIP / Postal Code *" value={zipCode} onChange={v => { setZipCode(v); clearErr('zip_code'); }}
                    placeholder="10001" half error={fieldErrors.zip_code} autoComplete="postal-code"
                  />
                </div>
                <button
                  onClick={() => { if (validateShipping()) setStep('payment'); }}
                  className="mt-6 btn-primary w-full py-3 rounded-xl text-base font-semibold"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* PAYMENT STEP */}
            {step === 'payment' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-gray-800">Payment Details</h2>
                  <LockClosedIcon className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-5 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                  This is a demo. Use any test values — no real payment is processed.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Card Number *" value={cardNumber}
                    onChange={v => { setCardNumber(v); clearErr('card_number'); }}
                    placeholder="4242 4242 4242 4242" error={fieldErrors.card_number}
                    autoComplete="cc-number"
                  />
                  <Field
                    label="Cardholder Name *" value={cardName}
                    onChange={v => { setCardName(v); clearErr('card_name'); }}
                    placeholder="John Doe" error={fieldErrors.card_name}
                    autoComplete="cc-name"
                  />
                  <Field
                    label="Expiry (MM/YY) *" value={expiry}
                    onChange={v => { setExpiry(v); clearErr('expiry'); }}
                    placeholder="12/26" half error={fieldErrors.expiry}
                    autoComplete="cc-exp"
                  />
                  <Field
                    label="CVV *" value={cvv}
                    onChange={v => { setCvv(v); clearErr('cvv'); }}
                    placeholder="123" half error={fieldErrors.cvv}
                    autoComplete="cc-csc"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep('shipping')} className="btn-secondary py-3 px-5 rounded-xl font-semibold">
                    Back
                  </button>
                  <button
                    onClick={() => { if (validatePayment()) setStep('review'); }}
                    className="btn-primary flex-1 py-3 rounded-xl text-base font-semibold"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* REVIEW STEP */}
            {step === 'review' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Review Your Order</h2>

                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Shipping To</p>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-sm text-gray-600">
                      {address}, {city}{stateVal ? `, ${stateVal}` : ''} {zipCode}
                    </p>
                    <p className="text-sm text-gray-600">{email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment</p>
                    <p className="text-sm">Mock Card ending in •••• {cardNumber.replace(/\s/g, '').slice(-4)}</p>
                    <p className="text-xs text-amber-600 mt-1">⚠️ Demo payment — no real charge</p>
                  </div>
                </div>

                {/* Order items */}
                <div className="divide-y divide-gray-100 mb-6">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <img
                        src={item.product.image_url || ''}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                        onError={e => (e.target as HTMLImageElement).src = IMG_FALLBACK_SM}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">${item.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep('payment')} className="btn-secondary py-3 px-5 rounded-xl font-semibold">
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="btn-primary flex-1 py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
                  >
                    {placing
                      ? <><LoadingSpinner size="sm" /> Placing Order...</>
                      : `Place Order — $${total.toFixed(2)}`
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Order Summary sidebar ────────────────────────────────────── */}
        <div className="card p-5 h-fit sticky top-24">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="truncate mr-2">{item.product.name} ×{item.quantity}</span>
                <span className="flex-shrink-0">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shippingCost === 0
                ? <span className="text-green-600">FREE</span>
                : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
