import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Adjust if deployed
});

// Add tokens and access code to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const code = localStorage.getItem('accessCode');
    
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (code) {
        config.headers['x-access-code'] = code;
    }
    
    // For FormData, don't set Content-Type header to allow browser to set it with proper boundary
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    
    return config;
});

export default api;
