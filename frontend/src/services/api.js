import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request Interceptor: ติด Token ไปกับทุก Request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: ถ้า Token หมดอายุ (401) ให้ลอง Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // ถ้า error 401 และยังไม่ได้ลอง refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // ลอง refresh token
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        if (res.data.success) {
          const newToken = res.data.data.accessToken;
          const newRefresh = res.data.data.refreshToken;
          
          localStorage.setItem('token', newToken);
          localStorage.setItem('refreshToken', newRefresh);
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        // ถ้า refresh ไม่ผ่าน ให้ logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
