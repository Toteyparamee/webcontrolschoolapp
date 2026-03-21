// Auth API - จัดการ Authentication และ User
import { buildURL, apiRequest, getHeaders } from './config';

export const authAPI = {
  // Login
  async login(username, password) {
    const url = buildURL('LOGIN', '/server/login');
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },

  // Get profile
  async getProfile(token) {
    const url = buildURL('LOGIN', '/server/profile');
    return apiRequest(url, { token });
  },

  // Refresh token
  async refreshToken(refreshToken) {
    const url = buildURL('LOGIN', '/server/refresh');
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }
    return data;
  },
};

export const userAPI = {
  // Get all users
  async getUsers(token) {
    const url = buildURL('LOGIN', '/server/users');
    return apiRequest(url, { token });
  },

  // Create user
  async createUser(userData, token) {
    const url = buildURL('LOGIN', '/server/users');
    return apiRequest(url, {
      method: 'POST',
      body: userData,
      token,
    });
  },

  // Update user
  async updateUser(id, userData, token) {
    const url = buildURL('LOGIN', `/server/users/${id}`);
    return apiRequest(url, {
      method: 'PUT',
      body: userData,
      token,
    });
  },

  // Delete user
  async deleteUser(id, token) {
    const url = buildURL('LOGIN', `/server/users/${id}`);
    return apiRequest(url, {
      method: 'DELETE',
      token,
    });
  },
};

export default authAPI;
