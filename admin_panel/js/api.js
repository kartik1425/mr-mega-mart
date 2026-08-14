/* MR Mega Mart Admin Panel Network API Client */

const API_CONFIG = {
  // Configurable base URL (Cloud Production backend default)
  baseUrl: window.ADMIN_API_BASE_URL || 'https://mrmegamart-backend.onrender.com',
  timeoutMs: 15000,
};

class AdminApiClient {
  static getAuthToken() {
    return window.AdminAuthManager ? window.AdminAuthManager.getToken() : null;
  }

  static async request(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': `admin_req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        if (!endpoint.includes('/login')) {
          if (window.AdminAuthManager) {
            window.AdminAuthManager.clearSession();
          }
          throw new Error('Session expired or unauthorized. Please log in again.');
        }
      }

      if (response.status === 403) {
        throw new Error(data.message || 'Access denied. Administrative authorization required.');
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Unable to connect to MR Mega Mart backend server.');
      }
      throw error;
    }
  }

  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  static put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

window.AdminApiClient = AdminApiClient;
