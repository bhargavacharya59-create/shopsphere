import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { UserCircleIcon, ShoppingBagIcon, EnvelopeIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return <div className="p-8 text-center"><Link to="/login" className="btn-primary">Sign In</Link></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-blue-600">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-500">{user.is_admin ? '👑 Admin' : 'Customer'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-800">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link to="/orders" className="card p-5 text-center hover:shadow-md transition-shadow group">
          <ShoppingBagIcon className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-semibold text-gray-700">My Orders</p>
          <p className="text-xs text-gray-400 mt-0.5">View order history</p>
        </Link>
        <Link to="/cart" className="card p-5 text-center hover:shadow-md transition-shadow group">
          <UserCircleIcon className="h-8 w-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-semibold text-gray-700">Shopping Cart</p>
          <p className="text-xs text-gray-400 mt-0.5">View your cart</p>
        </Link>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Actions</h3>
        <button
          onClick={logout}
          className="w-full btn-danger text-sm py-2 rounded-lg"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
