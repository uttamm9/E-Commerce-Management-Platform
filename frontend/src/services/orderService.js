import api from './api';

export const orderService = {
  checkout: async (shippingAddress) => {
    const response = await api.post('/orders/checkout', { shippingAddress });
    return response.data;
  },

  getMyOrders: async (params = {}) => {
    const response = await api.get('/orders/my-orders', { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getOrderTracking: async (id) => {
    const response = await api.get(`/orders/${id}/tracking`);
    return response.data;
  },

  getInvoice: async (id) => {
    const response = await api.get(`/orders/${id}/invoice`);
    return response.data;
  },

  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (id, statusData) => {
    const response = await api.put(`/orders/${id}/status`, statusData);
    return response.data;
  },
};

export default orderService;
