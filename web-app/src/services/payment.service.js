import axios from '../api/axiosInstance';

export const paymentService = {
  // Create Razorpay order
  createRazorpayOrder: async (orderId) => {
    try {
      const response = await axios.post('/razorpay/create-order', {
        orderId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    try {
      const response = await axios.post('/razorpay/verify-payment', {
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        razorpaySignature: paymentData.razorpaySignature,
        orderId: paymentData.orderId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get payment history
  getPaymentHistory: async () => {
    try {
      const response = await axios.get('/razorpay/payment-history');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Refund payment
  refundPayment: async (orderId, reason) => {
    try {
      const response = await axios.post('/razorpay/refund', {
        orderId,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const settlementService = {
  // Get shopkeeper earnings
  getEarnings: async (shopId) => {
    try {
      const response = await axios.get('/settlements/earnings', {
        params: { shopId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all unsettled earnings (admin)
  getAllUnsettledEarnings: async () => {
    try {
      const response = await axios.get('/settlements/admin/unsettled');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create settlement (admin)
  createSettlement: async (shopId, paymentMethod, notes, referenceId) => {
    try {
      const response = await axios.post('/settlements/create', {
        shopId,
        paymentMethod,
        notes,
        referenceId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get settlement history
  getSettlementHistory: async (shopId, limit = 20, skip = 0) => {
    try {
      const response = await axios.get('/settlements/history', {
        params: { shopId, limit, skip }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get settlement details
  getSettlementDetails: async (settlementId) => {
    try {
      const response = await axios.get(`/settlements/${settlementId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
