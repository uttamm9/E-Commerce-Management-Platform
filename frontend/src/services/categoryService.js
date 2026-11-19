import api from './api';

export const categoryService = {
  getCategories: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const isFormData = categoryData instanceof FormData;
    const response = await api.post('/categories', categoryData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const isFormData = categoryData instanceof FormData;
    const response = await api.put(`/categories/${id}`, categoryData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryService;
