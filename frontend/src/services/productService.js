import api from './api';

export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProductById: async (idOrSlug) => {
    const response = await api.get(`/products/${idOrSlug}`);
    return response.data;
  },

  createProduct: async (formData) => {
    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProduct: async (id, formData) => {
    const isFormData = formData instanceof FormData;
    const response = await api.put(`/products/${id}`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  deleteProductImage: async (id, key) => {
    const response = await api.delete(`/products/${id}/images/${encodeURIComponent(key)}`);
    return response.data;
  },
};

export default productService;
