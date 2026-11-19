import api from './api';

export const dashboardService = {
  // Dashboard Analytics
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getSalesAnalytics: async (params = {}) => {
    const response = await api.get('/dashboard/sales', { params });
    return response.data;
  },

  getTopProducts: async (params = {}) => {
    const response = await api.get('/dashboard/top-products', { params });
    return response.data;
  },

  getTopCategories: async (params = {}) => {
    const response = await api.get('/dashboard/top-categories', { params });
    return response.data;
  },

  // Customer Management
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  updateCustomerStatus: async (id, isActive) => {
    const response = await api.put(`/customers/${id}/status`, { isActive });
    return response.data;
  },

  getCustomerOrders: async (id, params = {}) => {
    const response = await api.get(`/customers/${id}/orders`, { params });
    return response.data;
  },

  // Reports
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  exportSalesReportCSV: async (params = {}) => {
    const response = await api.get('/reports/sales/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  getOrderReport: async (params = {}) => {
    const response = await api.get('/reports/orders', { params });
    return response.data;
  },

  exportOrderReportCSV: async (params = {}) => {
    const response = await api.get('/reports/orders/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  getInventoryReport: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  exportInventoryReportCSV: async (params = {}) => {
    const response = await api.get('/reports/inventory/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default dashboardService;
