// API Configuration - รวมศูนย์การตั้งค่า API ทั้งหมด

// Environment variables
const USE_KONG = import.meta.env.VITE_USE_KONG === 'true';
const KONG_GATEWAY_URL = import.meta.env.VITE_KONG_GATEWAY_URL || 'http://localhost:8000';

// Backend URLs
const LOGIN_API_URL = import.meta.env.VITE_LOGIN_API_URL || 'http://localhost:8080';
const PERSONNEL_API_URL = import.meta.env.VITE_PERSONNEL_API_URL || 'http://localhost:8082';
const SCHEDULE_API_URL = import.meta.env.VITE_SCHEDULE_API_URL || 'http://localhost:8083';
const BEHAVIOR_API_URL = import.meta.env.VITE_BEHAVIOR_API_URL || 'http://localhost:8084';

// Service configuration
export const API_CONFIG = {
  USE_KONG,

  // Base URLs ตาม environment
  BASE_URLS: {
    LOGIN: USE_KONG ? KONG_GATEWAY_URL : LOGIN_API_URL,
    PERSONNEL: USE_KONG ? KONG_GATEWAY_URL : PERSONNEL_API_URL,
    SCHEDULE: USE_KONG ? KONG_GATEWAY_URL : SCHEDULE_API_URL,
    BEHAVIOR: USE_KONG ? KONG_GATEWAY_URL : BEHAVIOR_API_URL,
  },

  // Service prefixes สำหรับ Kong Gateway
  SERVICE_PREFIX: {
    LOGIN: 'login-service',
    PERSONNEL: 'personnel-service',
    SCHEDULE: 'schedule-service',
    BEHAVIOR: 'behavior-service',
  },

  // Default settings
  DEFAULT_SCHOOL_ID: 1,
  DEFAULT_SEMESTER: 2,
  DEFAULT_ACADEMIC_YEAR: '2568',
};

// Helper function: สร้าง URL ตาม environment
export const buildURL = (service, path) => {
  const baseUrl = API_CONFIG.BASE_URLS[service];

  if (API_CONFIG.USE_KONG) {
    const servicePrefix = API_CONFIG.SERVICE_PREFIX[service];
    return `${baseUrl}/${servicePrefix}${path}`;
  }

  return `${baseUrl}${path}`;
};

// Helper function: สร้าง headers พื้นฐาน
export const getHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Helper function: ดึง token จาก localStorage
export const getToken = () => {
  return localStorage.getItem('access_token');
};

// Helper function: จัดการ response
export const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
};

// Helper function: API request wrapper
export const apiRequest = async (url, options = {}) => {
  const token = options.token || getToken();

  const config = {
    method: options.method || 'GET',
    headers: getHeaders(token),
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  return handleResponse(response);
};

// Log configuration (development only)
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    USE_KONG: API_CONFIG.USE_KONG,
    LOGIN: API_CONFIG.BASE_URLS.LOGIN,
    PERSONNEL: API_CONFIG.BASE_URLS.PERSONNEL,
    SCHEDULE: API_CONFIG.BASE_URLS.SCHEDULE,
    BEHAVIOR: API_CONFIG.BASE_URLS.BEHAVIOR,
  });
}

export default API_CONFIG;
