import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowRightIcon, TruckIcon, ShieldCheckIcon, ArrowPathIcon, TagIcon } from '@heroicons/react/24/outline';
import { Product, Category } from '../types';
import api from '../lib/api';
import { ProductCard } from '../components/product/ProductCard';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { placeholderImg } from '../lib/imgFallback';

const HERO_SLIDES = [
  {
    bg: 'from-blue-600 to-blue-800',
    badge: '🔥 New Arrivals',
    title: 'Latest iPhone 15 Pro',
    subtitle: 'Titanium. So strong. So light. So Pro.',
    cta: 'Shop Electronics',
    link: '/products?category_id=1',
    img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
  },
  {
    bg: 'from-purple-600 to-purple-800',
    badge: '⚡ Flash Sale',
    title: 'Up to 40% Off Fashion',
    subtitle: 'Premium clothing for every occasion.',
    cta: 'Shop Clothing',
    link: '/products?category_id=2',
    img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500',
  },
  {
    bg: 'from-emerald-600 to-emerald-800',
    badge: '💪 Fitness Gear',
    title: 'Train Smarter',
    subtitle: 'Top sports equipment for every level.',
    cta: 'Shop Sports',
    link: '/products?category_id=4',
    img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500',
  },
];

const FEATURES = [
  { icon: TruckIcon, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: ShieldCheckIcon, title: 'Secure Payments', desc: '100% protected checkout' },
  { icon: ArrowPathIcon, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: TagIcon, title: 'Best Prices', desc: 'Price match guarantee' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setHeroIndex(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, trendRes, catRes] = await Promise.all([
          api.get('/products?featured=true&page_size=8'),
          api.get('/products?trending=true&page_size=8'),
          api.get('/products/categories'),
        ]);
        setFeaturedProducts(featRes.data.items);
        setTrendingProducts(trendRes.data.items);
        setCategories(catRes.data);
      } catch (e) {
        console.error('Failed to load homepage data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const slide = HERO_SLIDES[heroIndex];

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">

      {/* ─── Hero Banner ─────────────────────────────────────────── */}
      <section className={`bg-gradient-to-r ${slide.bg} text-white relative overflow-hidden transition-all duration-700`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              {slide.badge}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">{slide.title}</h1>
            <p className="text-lg text-white/90 mb-6">{slide.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to={slide.link} className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                {slide.cta}
              </Link>
              <Link to="/products" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                View All
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 hidden md:block">
            <img src={slide.img} alt="Hero" className="w-72 h-72 object-cover rounded-2xl shadow-2xl" />
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === heroIndex ? 'bg-white w-6' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* ─── Search Bar ──────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 -mt-6 relative z-10">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands, categories..."
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-gray-700 bg-gray-50"
            />
          </div>
          <button type="submit" className="btn-primary px-6 rounded-xl font-semibold">
            Search
          </button>
        </form>
      </section>

      {/* ─── Features ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Link to="/products" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category_id=${cat.id}`}
              className="card p-4 text-center hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto mb-2">
                <img
                  src={cat.image_url || placeholderImg(48, cat.name[0])}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <p className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured Products ───────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-sm text-gray-500 mt-1">Handpicked top products</p>
            </div>
            <Link to="/products?featured=true" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
              See all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featuredProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ─── Promotional Banner ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Limited Time Offer</span>
            <h2 className="text-3xl font-bold mt-3 mb-2">Get 20% Off Your First Order</h2>
            <p className="text-white/90">Use code <span className="font-bold bg-white/20 px-2 py-0.5 rounded">WELCOME20</span> at checkout</p>
          </div>
          <Link to="/register" className="bg-white text-orange-600 font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors flex-shrink-0">
            Claim Offer
          </Link>
        </div>
      </section>

      {/* ─── Trending Products ───────────────────────────────────── */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Now</h2>
              <p className="text-sm text-gray-500 mt-1">What everyone's buying</p>
            </div>
            <Link to="/products?trending=true" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
              See all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {trendingProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
