import api from './api';

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  addToWishlist: async (productId) => {
    const response = await api.post('/wishlist/add', { productId });
    return response.data;
  },

  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/wishlist/remove/${productId}`);
    return response.data;
  },

  moveToCart: async (productId, quantity = 1) => {
    const response = await api.post('/wishlist/move-to-cart', { productId, quantity });
    return response.data;
  },
};

export default wishlistService;
