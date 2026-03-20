import api from '../api/axiosInstance';

export const createShop = (payload) => {
  return api.post('/shops', payload);
};

export const updateShop = (shopId, payload) => {
  return api.put(`/shops/${shopId}`, payload);
};

export const toggleShopOpen = (shopId) => {
  return api.put(`/shops/${shopId}/toggle-open`);
};

export const getMyShops = () => {
  return api.get('/shops/owner/my-shops');
};