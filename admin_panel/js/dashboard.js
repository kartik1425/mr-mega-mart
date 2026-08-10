/* MR Mega Mart Admin Dashboard Metrics Controller */

class AdminDashboard {
  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <h2>Dashboard Overview</h2>
        <button id="refresh-metrics-btn" class="btn btn-secondary">
          <span>🔄 Refresh Data</span>
        </button>
      </div>

      <div id="metrics-alert" class="alert alert-danger"></div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Total Revenue</span>
            <span class="badge badge-success">Financial</span>
          </div>
          <div class="metric-value" id="val-total-revenue">$0.00</div>
          <div class="metric-subtext" id="val-today-revenue">Today: $0.00</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Total Orders</span>
            <span class="badge badge-info">Orders</span>
          </div>
          <div class="metric-value" id="val-total-orders">0</div>
          <div class="metric-subtext" id="val-orders-subtext">Pending: 0 | Delivered: 0</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Total Users</span>
            <span class="badge badge-info">Customers</span>
          </div>
          <div class="metric-value" id="val-total-users">0</div>
          <div class="metric-subtext" id="val-subscribers">Subscribers: 0</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Inventory Stock</span>
            <span class="badge badge-warning">Catalog</span>
          </div>
          <div class="metric-value" id="val-total-products">0</div>
          <div class="metric-subtext" id="val-stock-alerts">Out of Stock: 0 | Low Stock: 0</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Order Status Breakdown</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Pending:</span>
              <span id="st-pending" style="font-weight:700;">0</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Shipping:</span>
              <span id="st-shipping" style="font-weight:700;">0</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Delivered:</span>
              <span id="st-delivered" style="font-weight:700;">0</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Cancelled:</span>
              <span id="st-cancelled" style="font-weight:700;">0</span>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">System Health & Latency</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Trending Search Terms:</span>
              <span id="val-trending-count" style="font-weight:700;">0</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Database Query Latency:</span>
              <span id="val-db-latency" style="font-weight:700; color:var(--success-color);">0 ms</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('refresh-metrics-btn').addEventListener('click', () => this.loadMetrics());
    await this.loadMetrics();
  }

  static async loadMetrics() {
    const alertEl = document.getElementById('metrics-alert');
    if (alertEl) alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get('/api/admin/metrics');
      if (!data.success || !data.metrics) {
        throw new Error('Failed to retrieve metrics payload');
      }

      const m = data.metrics;
      document.getElementById('val-total-revenue').textContent = `$${(m.revenue?.totalRevenue || 0).toFixed(2)}`;
      document.getElementById('val-today-revenue').textContent = `Today: $${(m.revenue?.todayRevenue || 0).toFixed(2)}`;

      document.getElementById('val-total-orders').textContent = m.orders?.totalOrders || 0;
      document.getElementById('val-orders-subtext').textContent = `Pending: ${m.orders?.pending || 0} | Delivered: ${m.orders?.delivered || 0}`;

      document.getElementById('val-total-users').textContent = m.users?.totalUsers || 0;
      document.getElementById('val-subscribers').textContent = `Subscribers: ${m.users?.subscribedUsers || 0}`;

      document.getElementById('val-total-products').textContent = m.products?.totalProducts || 0;
      document.getElementById('val-stock-alerts').textContent = `Out of Stock: ${m.products?.outOfStockProducts || 0} | Low Stock: ${m.products?.lowStockProducts || 0}`;

      document.getElementById('st-pending').textContent = m.orders?.pending || 0;
      document.getElementById('st-shipping').textContent = m.orders?.shipping || 0;
      document.getElementById('st-delivered').textContent = m.orders?.delivered || 0;
      document.getElementById('st-cancelled').textContent = m.orders?.cancelled || 0;

      document.getElementById('val-trending-count').textContent = m.trends?.trendingSearchesCount || 0;
      document.getElementById('val-db-latency').textContent = `${data.dbLatencyMs || 0} ms`;
    } catch (error) {
      if (alertEl) {
        alertEl.textContent = error.message;
        alertEl.style.display = 'block';
      }
    }
  }
}

window.AdminDashboard = AdminDashboard;
