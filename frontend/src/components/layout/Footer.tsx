import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-white">
                Shop<span className="text-blue-400">Sphere</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop shop for everything. Quality products, fast shipping, and excellent service.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-white transition-colors">Featured</Link></li>
              <li><Link to="/products?trending=true" className="hover:text-white transition-colors">Trending</Link></li>
              <li><Link to="/products?sort_by=price&sort_order=asc" className="hover:text-white transition-colors">Best Deals</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category_id=1" className="hover:text-white transition-colors">Electronics</Link></li>
              <li><Link to="/products?category_id=2" className="hover:text-white transition-colors">Clothing</Link></li>
              <li><Link to="/products?category_id=3" className="hover:text-white transition-colors">Home & Garden</Link></li>
              <li><Link to="/products?category_id=4" className="hover:text-white transition-colors">Sports</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 ShopSphere. Demo application for DevInsight AI.</p>
          <p className="text-xs text-gray-600">Powered by FastAPI + React</p>
        </div>
      </div>
    </footer>
  );
}
