import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ShoppingBagIcon, UsersIcon, CurrencyDollarIcon, ExclamationTriangleIcon,
  CheckCircleIcon, XCircleIcon, ArrowPathIcon, BoltIcon, CpuChipIcon,
  CircleStackIcon, CreditCardIcon, ServerIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface SimStatus {
  simulation_enabled: boolean;
  environment: string;
  active_scenarios: Record<string, { activated_at: string; config: Record<string, unknown> }>;
}

interface RecentOrder {
  id: number;
  order_number: string;
  status: string;
  total: number;
  shipping_name: string;
  created_at: string;
  payment: { status: string } | null;
}

const SCENARIOS = [
  {
    key: 'db-latency',
    label: 'DB Latency',
    desc: 'Products & orders load slowly',
    devinsight: 'High database query latency',
    icon: CircleStackIcon,
    color: 'yellow',
  },
  {
    key: 'payment-failure',
    label: 'Payment Failure',
    desc: 'All checkouts fail with HTTP 500',
    devinsight: 'Payment API errors',
    icon: CreditCardIcon,
    color: 'red',
  },
  {
    key: 'order-service',
    label: 'Order Service Crash',
    desc: 'Users cannot place orders (503)',
    devinsight: 'Service unavailable',
    icon: ServerIcon,
    color: 'red',
  },
  {
    key: 'error-spike',
    label: 'HTTP 500 Spike',
    desc: 'Random requests fail',
    devinsight: 'Increased server error rate',
    icon: ExclamationTriangleIcon,
    color: 'orange',
  },
  {
    key: 'cpu-spike',
    label: 'CPU Spike',
    desc: 'Website becomes slow',
    devinsight: 'Abnormally high CPU usage',
    icon: CpuChipIcon,
    color: 'purple',
  },
  {
    key: 'memory-spike',
    label: 'Memory Spike',
    desc: 'Application gradually slows',
    devinsight: 'Increasing memory usage',
    icon: ChartBarIcon,
    color: 'blue',
  },
];

const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
};

export default function AdminPage() {
  const { user } = useAuth();

  const [simStatus, setSimStatus] = useState<SimStatus | null>(null);
  const [simEnabled, setSimEnabled] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Redirect non-admins
  if (!user?.is_admin) return <Navigate to="/" replace />;

  const fetchStatus = async () => {
    try {
      const [simRes, ordersRes] = await Promise.all([
        api.get<SimStatus>('/dev/simulate/status'),
        api.get('/orders?page_size=5'),
      ]);
      setSimStatus(simRes.data);
      setSimEnabled(simRes.data.simulation_enabled);
      setRecentOrders(ordersRes.data.items || []);
    } catch {
      // simulation may be disabled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const activateScenario = async (scenarioKey: string) => {
    setActionLoading(scenarioKey);
    try {
      const body = scenarioKey === 'db-latency' ? { delay_seconds: 3 } : {};
      await api.post(`/dev/simulate/${scenarioKey}`, body);
      showMsg(`✅ "${scenarioKey}" scenario activated`, 'success');
      await fetchStatus();
    } catch (e) {
      showMsg(getErrorMessage(e), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const resetAll = async () => {
    setActionLoading('reset');
    try {
      await api.post('/dev/simulate/reset');
      showMsg('✅ All simulations reset — system back to normal', 'success');
      await fetchStatus();
    } catch (e) {
      showMsg(getErrorMessage(e), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = simStatus ? Object.keys(simStatus.active_scenarios).length : 0;
  const confirmedOrders = recentOrders.filter(o => o.status === 'confirmed').length;
  const failedPayments = recentOrders.filter(o => o.payment?.status === 'failed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">ShopSphere management & DevInsight AI simulation controls</p>
        </div>
        <span className="badge badge-blue px-3 py-1 text-sm font-semibold">👑 Admin: {user.full_name}</span>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success'
            ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            : <XCircleIcon className="h-5 w-5 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Recent Orders', value: recentOrders.length, icon: ShoppingBagIcon, color: 'blue' },
          { label: 'Confirmed', value: confirmedOrders, icon: CheckCircleIcon, color: 'green' },
          { label: 'Failed Payments', value: failedPayments, icon: CreditCardIcon, color: 'red' },
          { label: 'Active Scenarios', value: activeCount, icon: BoltIcon, color: activeCount > 0 ? 'orange' : 'gray' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${color}-50`}>
                <Icon className={`h-5 w-5 text-${color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Failure Simulation Panel ─────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">🔥 DevInsight AI — Failure Simulator</h2>
            {activeCount > 0 && (
              <span className="badge badge-red animate-pulse">{activeCount} active</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Trigger controlled failures so DevInsight AI can detect and analyze them in real time.
            {!simEnabled && (
              <span className="text-amber-600 block mt-1">
                ⚠️ Set <code className="bg-amber-50 px-1 rounded">ENABLE_FAILURE_SIMULATION=true</code> in backend/.env to enable scenarios.
              </span>
            )}
          </p>

          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <div className="space-y-3">
              {SCENARIOS.map(({ key, label, desc, devinsight, icon: Icon, color }) => {
                const isActive = simStatus
                  ? key.replace('-', '_') in simStatus.active_scenarios ||
                    key.replace(/-/g, '_') in simStatus.active_scenarios
                  : false;

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActive ? COLOR_MAP[color] : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{label}</p>
                          {isActive && (
                            <span className="text-xs font-bold uppercase tracking-wide bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                              ON
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-70 truncate">{desc}</p>
                        <p className="text-xs opacity-60 italic truncate">DevInsight detects: {devinsight}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => isActive ? resetAll() : activateScenario(key)}
                      disabled={actionLoading !== null || !simEnabled}
                      className={`ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                        isActive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                      }`}
                    >
                      {actionLoading === key ? (
                        <LoadingSpinner size="sm" />
                      ) : isActive ? 'Stop' : 'Trigger'}
                    </button>
                  </div>
                );
              })}

              {/* Reset All */}
              {activeCount > 0 && (
                <button
                  onClick={resetAll}
                  disabled={actionLoading !== null}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reset'
                    ? <LoadingSpinner size="sm" />
                    : <><ArrowPathIcon className="h-4 w-4" /> Reset All — Restore Normal Operation</>
                  }
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Recent Orders ────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-blue-600 hover:underline">View my orders</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBagIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No orders yet.</p>
              <p className="text-xs text-gray-400 mt-1">Place an order as the demo user to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-semibold text-gray-800">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.shipping_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.payment?.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {order.payment?.status === 'completed' ? '✓ Paid' : '✗ Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Links</p>
            <div className="grid grid-cols-2 gap-2">
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
                className="text-xs text-center py-2 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                📖 API Docs
              </a>
              <a href="http://localhost:8000/metrics" target="_blank" rel="noreferrer"
                className="text-xs text-center py-2 px-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                📊 Metrics
              </a>
              <a href="http://localhost:8000/health" target="_blank" rel="noreferrer"
                className="text-xs text-center py-2 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
                ✅ Health
              </a>
              <a href="http://localhost:8000/ready" target="_blank" rel="noreferrer"
                className="text-xs text-center py-2 px-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                🔌 Readiness
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* DevInsight info box */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg mb-1">How to use with DevInsight AI</h3>
        <p className="text-blue-100 text-sm mb-4">
          Trigger a failure scenario above, then switch to DevInsight AI. It will detect the anomaly
          in ShopSphere's telemetry, identify the root cause, and show you exactly which service failed.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { step: '1', label: 'Trigger a scenario', desc: 'e.g. Payment Failure' },
            { step: '2', label: 'Use the website', desc: 'Try to checkout' },
            { step: '3', label: 'Open DevInsight', desc: 'See the anomaly detected' },
            { step: '4', label: 'Root cause shown', desc: 'Payment service → 500' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="bg-white/10 rounded-xl p-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mb-2">{step}</div>
              <p className="font-semibold text-xs">{label}</p>
              <p className="text-blue-200 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
