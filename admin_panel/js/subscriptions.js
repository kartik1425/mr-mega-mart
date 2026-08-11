/* MR Mega Mart Admin Subscriptions & Trials Controller */

class AdminSubscriptions {
  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <h2>Active Subscriptions & Product Trials Overview</h2>
        <button id="refresh-subs-btn" class="btn btn-secondary">🔄 Refresh Data</button>
      </div>

      <div id="sub-alert" class="alert alert-danger"></div>

      <div style="margin-bottom:2rem;">
        <h3 style="margin-bottom:1rem;">Active Customer Subscriptions</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan Name</th>
                <th>Status</th>
                <th>Auto-Renew</th>
                <th>Expires Date</th>
              </tr>
            </thead>
            <tbody id="subs-table-body">
              <tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading subscriptions...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 style="margin-bottom:1rem;">Product Trials Claimed</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Trial Product</th>
                <th>Claim Date</th>
                <th>Expiration Date</th>
              </tr>
            </thead>
            <tbody id="trials-table-body">
              <tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading active trials...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('refresh-subs-btn').addEventListener('click', () => this.loadData());
    await this.loadData();
  }

  static async loadData() {
    const subsBody = document.getElementById('subs-table-body');
    const trialsBody = document.getElementById('trials-table-body');
    const alertEl = document.getElementById('sub-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get('/api/admin/subscriptions');
      if (!data.success) {
        throw new Error('Failed to fetch subscription records');
      }

      const subscriptions = data.subscriptions || [];
      const trials = data.trials || [];

      if (subscriptions.length === 0) {
        subsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No active member subscriptions found.</td></tr>`;
      } else {
        subsBody.innerHTML = subscriptions.map((s) => {
          const name = s.userId ? `${s.userId.userFirstName || ''} ${s.userId.userLastName || ''}`.trim() : 'Customer';
          const email = s.userId?.email || 'N/A';
          const expDate = new Date(s.expiresAt).toLocaleDateString();
          const badgeClass = s.status === 'active' ? 'badge-success' : 'badge-danger';

          return `
            <tr>
              <td>
                <div style="font-weight:600; color:white;">${this.escapeHtml(name)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(email)}</div>
              </td>
              <td style="font-weight:600; color:var(--primary-accent);">${this.escapeHtml(s.planName || 'Monthly Pro')}</td>
              <td><span class="badge ${badgeClass}">${(s.status || 'active').toUpperCase()}</span></td>
              <td>${s.autoRenew ? 'Yes' : 'No'}</td>
              <td style="font-size:0.85rem; color:var(--text-muted);">${expDate}</td>
            </tr>
          `;
        }).join('');
      }

      if (trials.length === 0) {
        trialsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No product trial claims found.</td></tr>`;
      } else {
        trialsBody.innerHTML = trials.map((t) => {
          const name = t.userId ? `${t.userId.userFirstName || ''} ${t.userId.userLastName || ''}`.trim() : 'Customer';
          const productTitle = t.trialProductId ? t.trialProductId.title : 'Trial Sample';
          const claimDate = new Date(t.createdAt).toLocaleDateString();
          const expDate = new Date(t.expiresAt).toLocaleDateString();

          return `
            <tr>
              <td>
                <div style="font-weight:600; color:white;">${this.escapeHtml(name)}</div>
              </td>
              <td style="font-weight:600; color:white;">${this.escapeHtml(productTitle)}</td>
              <td style="font-size:0.85rem; color:var(--text-muted);">${claimDate}</td>
              <td style="font-size:0.85rem; color:var(--text-muted);">${expDate}</td>
            </tr>
          `;
        }).join('');
      }
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.AdminSubscriptions = AdminSubscriptions;
