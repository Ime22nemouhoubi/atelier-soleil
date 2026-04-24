import axios from 'axios';

// In production, frontend and backend are served from the same Railway URL,
// so we use a relative API path. Locally, fall back to localhost:4000.
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');

export const api = axios.create({ baseURL: `${baseURL}/api` });

export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

// Initialize on load if token already in localStorage
const stored = localStorage.getItem('bv_admin_token');
if (stored) setAuthToken(stored);

// ---- Public endpoints ----
export const fetchProducts = (params = {}) => api.get('/products', { params }).then((r) => r.data);
export const fetchProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);
export const fetchCategories = () => api.get('/categories').then((r) => r.data);
export const submitOrder = (payload) => api.post('/orders', payload).then((r) => r.data);
export const fetchDeliveryPricing = () => api.get('/orders/delivery-pricing').then((r) => r.data);

// ---- Admin endpoints ----
export const adminLogin = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);

export const adminFetchProducts = () =>
  api.get('/products', { params: { includeInactive: 1 } }).then((r) => r.data);

export const adminCreateProduct = (formData) =>
  api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const adminUpdateProduct = (id, formData) =>
  api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const adminDeleteProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);
export const adminDeleteProductImage = (productId, imageId) =>
  api.delete(`/products/${productId}/images/${imageId}`).then((r) => r.data);

export const adminCreateCategory = (data) => api.post('/categories', data).then((r) => r.data);
export const adminUpdateCategory = (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data);
export const adminDeleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data);

export const adminFetchOrders = () => api.get('/orders').then((r) => r.data);
export const adminUpdateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);
export const adminDeleteOrder = (id) => api.delete(`/orders/${id}`).then((r) => r.data);

export const adminFetchStats = () => api.get('/stats').then((r) => r.data);
