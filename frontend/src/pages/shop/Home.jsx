import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, PackageCheck } from 'lucide-react';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import ProductCard from '../../components/products/ProductCard';
import Loader from '../../components/common/Loader';
import eliteStoreBanner from '../../assets/images/EliteStoreBanner.png';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          productService.getProducts({ limit: 8, sortBy: 'createdAt', order: 'desc' }),
          categoryService.getCategories({ status: 'active', limit: 6 }),
        ]);

        const prods = prodRes.data?.products || [];
        setLatestProducts(prods.slice(0, 4));
        setFeaturedProducts(prods);
        setCategories(catRes.data?.categories || []);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) {
    return <Loader size="lg" text="Curating the storefront..." fullScreen={false} />;
  }

  return (
    <div className="space-y-16">
      {/* Hero Banner Section */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white group">
        <Link
          to="/products"
          className="block relative w-full overflow-hidden focus:outline-none focus:ring-4 focus:ring-indigo-500/20 rounded-2xl sm:rounded-3xl"
          title="EliteStore - Shop Everything in One Place"
        >
          <img
            src={eliteStoreBanner}
            alt="EliteStore - Shop Everything in One Place"
            className="w-full h-auto object-cover object-center rounded-2xl sm:rounded-3xl transition-transform duration-500 group-hover:scale-[1.01]"
            loading="eager"
          />
        </Link>
      </section>

      {/* Categories Bar */}
      {categories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Browse by Category
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Find exactly what you need by department
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Featured Products
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Top-picked recommendations for you
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <PackageCheck className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Callout Banner */}
      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to upgrade your shopping experience?
          </h3>
          <p className="text-indigo-100 text-sm">
            Sign up today to enjoy personalized tracking, instant invoices, and exclusive member discounts.
          </p>
        </div>
        <Link
          to="/register"
          className="px-6 py-3.5 rounded-xl bg-white text-indigo-600 hover:bg-gray-100 font-bold text-sm shadow-md transition-colors flex-shrink-0"
        >
          Join EliteStore Free
        </Link>
      </section>
    </div>
  );
};

export default Home;
