/* MR Mega Mart Admin Panel SPA Application & Router */

class AdminRouter {
  static routes = {
    '/login': 'renderLogin',
    '/dashboard': 'renderDashboard',
    '/inventory': 'renderInventory',
    '/orders': 'renderOrders',
  };

  static currentRoute = '/dashboard';

  static init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();
  }

  static navigate(path) {
    window.location.hash = path;
  }

  static handleRouting() {
    const hash = window.location.hash.replace('#', '') || '/dashboard';
    this.currentRoute = hash;

    const authenticated = window.AdminAuthManager.isAuthenticated();

    if (!authenticated && hash !== '/login') {
      window.location.hash = '/login';
      return;
    }

    if (authenticated && hash === '/login') {
      window.location.hash = '/dashboard';
      return;
    }

    const appRoot = document.getElementById('app-root');

    if (hash === '/login') {
      this.renderLoginView(appRoot);
    } else {
      this.renderShellView(appRoot, hash);
    }
  }

  static renderLoginView(root) {
    root.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card">
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem; justify-content:center;">
            <div class="logo-badge">MM</div>
            <div>
              <div class="brand-title">MR Mega Mart</div>
              <div class="brand-subtitle">Admin Control Panel</div>
            </div>
          </div>

          <div id="login-alert" class="alert alert-danger"></div>

          <form id="admin-login-form">
            <div style="margin-bottom:1.25rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.4rem;">Admin Email</label>
              <input type="email" id="login-email" class="form-control" placeholder="admin@mrmegamart.com" required />
            </div>

            <div style="margin-bottom:1.5rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.4rem;">Password</label>
              <input type="password" id="login-password" class="form-control" placeholder="••••••••" required />
            </div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.85rem;">
              Sign In to Admin Dashboard
            </button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const alertEl = document.getElementById('login-alert');
      const submitBtn = document.getElementById('login-submit-btn');

      alertEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      try {
        await window.AdminAuthManager.login(email, password);
        window.location.hash = '/dashboard';
      } catch (error) {
        alertEl.textContent = error.message;
        alertEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Admin Dashboard';
      }
    });
  }

  static renderShellView(root, activeRoute) {
    const user = window.AdminAuthManager.getUser() || {};

    root.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-badge">MM</div>
          <div>
            <div class="brand-title">MR Mega Mart</div>
            <div class="brand-subtitle">Admin Panel</div>
          </div>
        </div>

        <ul class="nav-list">
          <li>
            <a href="#/dashboard" class="nav-link ${activeRoute === '/dashboard' ? 'active' : ''}">
              📊 Dashboard
            </a>
          </li>
          <li>
            <a href="#/inventory" class="nav-link ${activeRoute === '/inventory' ? 'active' : ''}">
              📦 Inventory Management
            </a>
          </li>
          <li>
            <a href="#/orders" class="nav-link ${activeRoute === '/orders' ? 'active' : ''}">
              🛒 Order Management
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <button id="nav-logout-btn" class="btn btn-danger" style="width:100%; justify-content:center;">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main class="main-content">
        <header class="top-bar">
          <h1 class="page-title" id="page-title-text">Dashboard</h1>
          <div class="admin-profile">
            <span class="admin-badge">ADMINISTRATOR</span>
            <span style="font-size:0.9rem; font-weight:600;">${user.email || 'Admin User'}</span>
          </div>
        </header>

        <section class="content-area" id="content-container">
          <!-- Dynamic View Content -->
        </section>
      </main>
    `;

    document.getElementById('nav-logout-btn').addEventListener('click', () => {
      window.AdminAuthManager.clearSession();
    });

    const contentContainer = document.getElementById('content-container');
    const pageTitleText = document.getElementById('page-title-text');

    if (activeRoute === '/dashboard') {
      pageTitleText.textContent = 'Dashboard Overview';
      window.AdminDashboard.render(contentContainer);
    } else if (activeRoute === '/inventory') {
      pageTitleText.textContent = 'Inventory & Stock Management';
      window.AdminInventory.render(contentContainer);
    } else if (activeRoute === '/orders') {
      pageTitleText.textContent = 'Order State Machine';
      window.AdminOrders.render(contentContainer);
    } else {
      window.location.hash = '/dashboard';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.AdminRouter = AdminRouter;
  AdminRouter.init();
});
