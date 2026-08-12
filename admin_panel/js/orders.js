/* MR Mega Mart Admin Order State Machine Controller */

class AdminOrders {
  static ALLOWED_TRANSITIONS = {
    pending: ['shipping', 'cancelled'],
    shipping: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    failed: [],
    returned: [],
  };

  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <h2>Order State Machine & Management</h2>
        <div style="display:flex; gap: 0.75rem;">
          <select id="order-status-filter" class="form-control" style="width:180px;">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="shipping">Shipping</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
          </select>
          <button id="order-filter-btn" class="btn btn-primary">Filter</button>
        </div>
      </div>

      <div id="orders-alert" class="alert alert-danger"></div>
      <div id="orders-success-alert" class="alert alert-success"></div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Current Status</th>
              <th>Created Date</th>
              <th>State Transition</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading customer orders...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('order-filter-btn').addEventListener('click', () => this.loadOrders());
    document.getElementById('order-status-filter').addEventListener('change', () => this.loadOrders());

    await this.loadOrders();
  }

  static async loadOrders() {
    const statusVal = document.getElementById('order-status-filter').value;
    const body = document.getElementById('orders-table-body');
    const alertEl = document.getElementById('orders-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get(`/api/admin/orders?status=${encodeURIComponent(statusVal)}`);
      if (!data.success || !data.orders) {
        throw new Error('Failed to fetch orders');
      }

      if (data.orders.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No orders found matching criteria.</td></tr>`;
        return;
      }

      body.innerHTML = data.orders.map((o) => {
        const allowedNext = this.ALLOWED_TRANSITIONS[o.status] || [];
        let badgeClass = 'badge-info';
        if (o.status === 'delivered') badgeClass = 'badge-success';
        if (o.status === 'shipping') badgeClass = 'badge-info';
        if (o.status === 'pending') badgeClass = 'badge-warning';
        if (o.status === 'cancelled' || o.status === 'failed') badgeClass = 'badge-danger';

        const customerName = o.deliveryAddress?.fullName || (o.userId ? `${o.userId.userFirstName || ''} ${o.userId.userLastName || ''}`.trim() : 'Guest');
        const customerEmail = o.userId?.email || 'N/A';
        const customerPhone = o.deliveryAddress?.phoneNumber || 'N/A';
        const deliveryAddr = o.deliveryAddress ? `${o.deliveryAddress.address || ''}, ${o.deliveryAddress.city || ''}, ${o.deliveryAddress.state || ''}` : 'No Address';
        const paymentMethod = o.paymentIntentId?.startsWith('COD') ? 'Cash on Delivery (COD)' : (o.paymentIntentId ? 'Card / Stripe' : 'COD');
        const dateStr = new Date(o.createdAt).toLocaleString();

        let transitionOptions = '';
        if (allowedNext.length > 0) {
          transitionOptions = `
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <select id="select-status-${o._id}" class="form-control" style="width:130px; padding:0.4rem 0.6rem; font-size:0.8rem;">
                ${allowedNext.map((st) => `<option value="${st}">${st.toUpperCase()}</option>`).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" onclick="AdminOrders.updateStatus('${o._id}')">
                Apply
              </button>
            </div>
          `;
        } else {
          transitionOptions = `<span style="font-size:0.8rem; color:var(--text-muted);">Final State</span>`;
        }

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:white;">${o._id}</div>
              <div style="font-size:0.75rem; color:#168A3A; font-weight:bold;">${paymentMethod}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${o.paymentIntentId || 'COD'}</div>
            </td>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(customerName)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(customerEmail)}</div>
              <div style="font-size:0.75rem; color:#2DBE55;">📞 ${this.escapeHtml(customerPhone)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">📍 ${this.escapeHtml(deliveryAddr)}</div>
            </td>
            <td style="font-weight:700; font-size:1.05rem;">$${(o.amount || 0).toFixed(2)}</td>
            <td><span class="badge ${badgeClass}">${o.status}</span></td>
            <td style="font-size:0.8rem; color:var(--text-muted);">${dateStr}</td>
            <td>${transitionOptions}</td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static async updateStatus(orderId) {
    const selectEl = document.getElementById(`select-status-${orderId}`);
    if (!selectEl) return;

    const newStatus = selectEl.value;
    const alertEl = document.getElementById('orders-alert');
    const successEl = document.getElementById('orders-success-alert');

    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      if (!data.success) {
        throw new Error(data.message || 'Failed to update order status');
      }

      successEl.textContent = `Order ${orderId} status transitioned to "${newStatus}" successfully.`;
      successEl.style.display = 'block';

      await this.loadOrders();
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.AdminOrders = AdminOrders;
