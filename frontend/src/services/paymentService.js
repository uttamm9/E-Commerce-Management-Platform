import api from './api';

export const paymentService = {
  createPaymentOrder: async (orderId) => {
    const response = await api.post('/payment/create-order', { orderId });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/payment/verify', paymentData);
    return response.data;
  },
};

export default paymentService;
