import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Phone, UserPlus, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser, loginUser, clearAuthError } from '../../redux/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      };
      await dispatch(registerUser(payload)).unwrap();
      // Auto-authenticate customer with login credentials
      await dispatch(
        loginUser({ email: payload.email, password: payload.password })
      ).unwrap();
      toast.success('Registration successful! Welcome to EliteStore.');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err || 'Registration failed');
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
            Create an Account
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 underline"
            >
              Sign in instead
            </Link>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            icon={User}
            required
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            icon={Mail}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={handleChange}
            error={formErrors.phone}
            icon={Phone}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            icon={Lock}
            required
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            icon={Lock}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            loading={loading}
            icon={UserPlus}
          >
            Register Account
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

export default Register;
