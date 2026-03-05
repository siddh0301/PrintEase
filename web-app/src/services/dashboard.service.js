import api from '../api/axiosInstance';

export const getDashboardStats = async () => {
  return await api.get('/orders/shop/my-orders');
};