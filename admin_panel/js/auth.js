/* MR Mega Mart Admin Authentication & Session Manager */

class AdminAuthManager {
  static _token = null;
  static _user = null;

  static init() {
    // Session-scoped storage (cleared automatically on tab/browser close)
    const savedToken = sessionStorage.getItem('mrmm_admin_token');
    const savedUser = sessionStorage.getItem('mrmm_admin_user');

    if (savedToken && savedUser) {
      this._token = savedToken;
      try {
        this._user = JSON.parse(savedUser);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  static isAuthenticated() {
    return !!this._token;
  }

  static getToken() {
    return this._token;
  }

  static getUser() {
    return this._user;
  }

  static setSession(token, user) {
    this._token = token;
    this._user = user;
    sessionStorage.setItem('mrmm_admin_token', token);
    sessionStorage.setItem('mrmm_admin_user', JSON.stringify(user));
  }

  static clearSession() {
    this._token = null;
    this._user = null;
    sessionStorage.removeItem('mrmm_admin_token');
    sessionStorage.removeItem('mrmm_admin_user');
    if (window.AdminRouter) {
      window.AdminRouter.navigate('/login');
    }
  }

  static async login(email, password) {
    const data = await window.AdminApiClient.post('/api/login', { email, password });
    
    if (!data.accessToken) {
      throw new Error('Authentication failed: Missing access token');
    }

    // Decode token payload safely to check role claim
    const payload = this._decodeTokenPayload(data.accessToken);
    if (!payload || payload.role !== 'admin') {
      throw new Error('Access denied. Account does not have administrative privileges.');
    }

    this.setSession(data.accessToken, {
      id: payload.id,
      email: email,
      role: payload.role,
    });

    return data;
  }

  static _decodeTokenPayload(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}

AdminAuthManager.init();
window.AdminAuthManager = AdminAuthManager;
