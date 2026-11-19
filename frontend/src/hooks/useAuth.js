import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    logout: handleLogout,
  };
};

export default useAuth;
