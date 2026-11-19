import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, LogIn, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, clearAuthError } from '../../redux/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user, loading, error } = useSelector(
    (state) => state.auth
  );

  const redirectPath = location.state?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(redirectPath || '/', { replace: true });
      }
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [isAuthenticated, user, navigate, redirectPath, dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      toast.error('Your session has expired. Please sign in again.');
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!credentials.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(credentials.email)) {
      errors.email = 'Please provide a valid email';
    }
    if (!credentials.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      toast.success(`Welcome back, ${result.user?.name || 'User'}!`);
      if (result.user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(redirectPath || '/', { replace: true });
      }
    } catch (err) {
      toast.error(err || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors mb-4"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              E
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 underline"
            >
              create a new customer account
            </Link>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={credentials.email}
            onChange={handleChange}
            error={formErrors.email}
            icon={Mail}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={credentials.password}
            onChange={handleChange}
            error={formErrors.password}
            icon={Lock}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            icon={LogIn}
          >
            Sign In
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Return to store home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
