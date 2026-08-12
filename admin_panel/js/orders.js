/* MR Mega Mart Admin Order State Machine Controller & Customer Dispatch Suite */

class AdminOrders {
  static ALLOWED_TRANSITIONS = {
    pending: ['shipping', 'cancelled'],
    shipping: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    failed: [],
    returned: [],
  };

  static cachedOrders = [];

  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h2>Order Management & Customer Dispatch</h2>
          <p style="color:var(--text-muted); font-size:0.85rem; margin-top:2px;">Track live customer orders, shipping status, contact details, and payment modes</p>
        </div>
        <button id="order-refresh-btn" class="btn btn-secondary btn-sm" style="display:flex; gap:0.5rem; align-items:center;">
          🔄 Refresh Orders
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div class="orders-kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total Orders</span>
          <span class="kpi-value" id="kpi-total-orders">0</span>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #f59e0b;">
          <span class="kpi-label">Pending Dispatch</span>
          <span class="kpi-value" id="kpi-pending-orders" style="color:#fbbf24;">0</span>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #3b82f6;">
          <span class="kpi-label">In Shipping</span>
          <span class="kpi-value" id="kpi-shipping-orders" style="color:#60a5fa;">0</span>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #22c55e;">
          <span class="kpi-label">Delivered</span>
          <span class="kpi-value" id="kpi-delivered-orders" style="color:#4ade80;">0</span>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #2DBE55;">
          <span class="kpi-label">Total Revenue</span>
          <span class="kpi-value" id="kpi-total-revenue" style="color:#2DBE55;">$0.00</span>
        </div>
      </div>

      <!-- Search & Filter Toolbar -->
      <div class="orders-toolbar">
        <div class="search-input-group">
          <span>🔍</span>
          <input type="text" id="order-search-input" placeholder="Search by Order ID, Customer Name, Phone, or Email..." />
        </div>
        <div style="display:flex; gap: 0.75rem; align-items:center;">
          <select id="order-status-filter" class="form-control" style="width:170px;">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="shipping">Shipping</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      <div id="orders-alert" class="alert alert-danger"></div>
      <div id="orders-success-alert" class="alert alert-success"></div>

      <!-- Customer Orders Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID & Payment</th>
              <th>Customer Details</th>
              <th>Items & Order Value</th>
              <th>Current Status</th>
              <th>Created Date</th>
              <th>Actions & State Transition</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading customer orders...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Order Details Modal Container -->
      <div id="order-details-modal" class="modal-backdrop" style="display:none;"></div>
    `;

    document.getElementById('order-refresh-btn').addEventListener('click', () => this.loadOrders());
    document.getElementById('order-status-filter').addEventListener('change', () => this.loadOrders());
    document.getElementById('order-search-input').addEventListener('input', () => this.filterAndRender());

    await this.loadOrders();
  }

  static async loadOrders() {
    const statusVal = document.getElementById('order-status-filter').value;
    const alertEl = document.getElementById('orders-alert');
    if (alertEl) alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get(`/api/admin/orders?status=${encodeURIComponent(statusVal)}`);
      if (!data.success || !data.orders) {
        throw new Error('Failed to fetch orders');
      }

      this.cachedOrders = data.orders;
      this.updateKPIs(data.orders);
      this.filterAndRender();
    } catch (error) {
      if (alertEl) {
        alertEl.textContent = error.message;
        alertEl.style.display = 'block';
      }
    }
  }

  static updateKPIs(orders) {
    const totalCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const shippingCount = orders.filter(o => o.status === 'shipping').length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const totalRev = orders
      .filter(o => ['pending', 'shipping', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    const elTotal = document.getElementById('kpi-total-orders');
    const elPending = document.getElementById('kpi-pending-orders');
    const elShipping = document.getElementById('kpi-shipping-orders');
    const elDelivered = document.getElementById('kpi-delivered-orders');
    const elRevenue = document.getElementById('kpi-total-revenue');

    if (elTotal) elTotal.textContent = totalCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elShipping) elShipping.textContent = shippingCount;
    if (elDelivered) elDelivered.textContent = deliveredCount;
    if (elRevenue) elRevenue.textContent = `$${totalRev.toFixed(2)}`;
  }

  static filterAndRender() {
    const searchVal = (document.getElementById('order-search-input')?.value || '').toLowerCase().trim();
    const body = document.getElementById('orders-table-body');
    if (!body) return;

    let filtered = this.cachedOrders;

    if (searchVal) {
      filtered = filtered.filter(o => {
        const orderId = (o._id || '').toLowerCase();
        const custName = (o.deliveryAddress?.fullName || `${o.userId?.userFirstName || ''} ${o.userId?.userLastName || ''}`).toLowerCase();
        const email = (o.userId?.email || '').toLowerCase();
        const phone = (o.deliveryAddress?.phoneNumber || '').toLowerCase();

        return orderId.includes(searchVal) || custName.includes(searchVal) || email.includes(searchVal) || phone.includes(searchVal);
      });
    }

    if (filtered.length === 0) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2.5rem; color:var(--text-muted);">No customer orders found matching criteria.</td></tr>`;
      return;
    }

    body.innerHTML = filtered.map((o) => {
      const allowedNext = this.ALLOWED_TRANSITIONS[o.status] || [];
      let badgeClass = 'badge-pending';
      if (o.status === 'delivered') badgeClass = 'badge-delivered';
      if (o.status === 'shipping') badgeClass = 'badge-shipping';
      if (o.status === 'cancelled' || o.status === 'failed') badgeClass = 'badge-danger';

      const customerName = o.deliveryAddress?.fullName || (o.userId ? `${o.userId.userFirstName || ''} ${o.userId.userLastName || ''}`.trim() : 'Guest');
      const customerEmail = o.userId?.email || 'N/A';
      const customerPhone = o.deliveryAddress?.phoneNumber || 'N/A';
      const deliveryAddr = o.deliveryAddress ? `${o.deliveryAddress.address || ''}, ${o.deliveryAddress.city || ''}` : 'No Address';
      const isCOD = !o.paymentIntentId || o.paymentIntentId.startsWith('COD');
      const paymentBadge = isCOD ? '<span class="badge-cod">💵 Cash on Delivery</span>' : '<span class="badge-card">💳 Online Card / Stripe</span>';
      const dateStr = new Date(o.createdAt).toLocaleString();
      const firstInitial = customerName.charAt(0).toUpperCase() || 'C';

      const itemCount = o.items ? o.items.length : 0;
      const firstItemTitle = o.items && o.items.length > 0 && o.items[0].productId ? o.items[0].productId.title : 'Grocery items';
      const itemSnippet = itemCount > 1 ? `${firstItemTitle} (+${itemCount - 1} more)` : firstItemTitle;

      let transitionOptions = '';
      if (allowedNext.length > 0) {
        transitionOptions = `
          <div style="display:flex; gap:0.4rem; align-items:center; margin-top:4px;">
            <select id="select-status-${o._id}" class="form-control" style="width:110px; padding:0.35rem 0.5rem; font-size:0.75rem;">
              ${allowedNext.map((st) => `<option value="${st}">${st.toUpperCase()}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" style="padding:0.35rem 0.6rem; font-size:0.75rem;" onclick="AdminOrders.updateStatus('${o._id}')">
              Apply
            </button>
          </div>
        `;
      } else {
        transitionOptions = `<span style="font-size:0.75rem; color:var(--text-muted);">Final State</span>`;
      }

      return `
        <tr>
          <td>
            <div style="font-weight:700; color:white; font-size:0.85rem;">#${o._id}</div>
            <div style="margin-top:4px;">${paymentBadge}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">Ref: ${o.paymentIntentId || 'COD-LOCAL'}</div>
          </td>
          <td>
            <div style="display:flex; gap:0.6rem; align-items:center;">
              <div class="customer-avatar">${this.escapeHtml(firstInitial)}</div>
              <div>
                <div style="font-weight:600; color:white; font-size:0.9rem;">${this.escapeHtml(customerName)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(customerEmail)}</div>
                <div style="font-size:0.75rem; color:#2DBE55; font-weight:600; margin-top:1px;">
                  <a href="tel:${this.escapeHtml(customerPhone)}" style="color:#2DBE55; text-decoration:none;">📞 ${this.escapeHtml(customerPhone)}</a>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:1px;">📍 ${this.escapeHtml(deliveryAddr)}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:700; font-size:1.05rem; color:var(--text-primary);">$${(o.amount || 0).toFixed(2)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">🛒 ${itemCount} Item(s)</div>
            <div style="font-size:0.7rem; color:var(--text-muted); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${this.escapeHtml(itemSnippet)}</div>
          </td>
          <td><span class="badge ${badgeClass}">${o.status.toUpperCase()}</span></td>
          <td style="font-size:0.8rem; color:var(--text-muted);">${dateStr}</td>
          <td>
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
              <button class="btn-icon-action" onclick="AdminOrders.openOrderModal('${o._id}')">
                👁️ View Order Details
              </button>
              ${transitionOptions}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  static async openOrderModal(orderId) {
    const modalEl = document.getElementById('order-details-modal');
    if (!modalEl) return;

    const order = this.cachedOrders.find(o => o._id === orderId);
    if (!order) return;

    const customerName = order.deliveryAddress?.fullName || (order.userId ? `${order.userId.userFirstName || ''} ${order.userId.userLastName || ''}`.trim() : 'Guest');
    const customerEmail = order.userId?.email || 'N/A';
    const customerPhone = order.deliveryAddress?.phoneNumber || 'N/A';
    const fullAddress = order.deliveryAddress
      ? `${order.deliveryAddress.address || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.postalCode || ''}, ${order.deliveryAddress.country || ''}`
      : 'No Delivery Address Set';
    const isCOD = !order.paymentIntentId || order.paymentIntentId.startsWith('COD');
    const paymentBadge = isCOD ? '<span class="badge-cod">💵 Cash on Delivery (COD)</span>' : '<span class="badge-card">💳 Online Card / Stripe</span>';
    const allowedNext = this.ALLOWED_TRANSITIONS[order.status] || [];

    const itemsHtml = (order.items || []).map(item => {
      const prod = item.productId || {};
      const img = prod.imageURLs && prod.imageURLs.length > 0 ? prod.imageURLs[0] : '';
      const title = prod.title || 'Grocery Item';
      const qty = item.quantity || 1;
      const price = item.price || prod.price || 0;
      const total = qty * price;

      return `
        <tr>
          <td>
            <div style="display:flex; gap:0.6rem; align-items:center;">
              ${img ? `<img src="${img}" style="width:42px; height:42px; object-fit:cover; border-radius:6px; background:#fff;" />` : '<div style="width:42px; height:42px; background:var(--bg-card-hover); border-radius:6px; display:flex; align-items:center; justify-content:center;">📦</div>'}
              <div>
                <div style="font-weight:600; color:white;">${this.escapeHtml(title)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">$${price.toFixed(2)} each</div>
              </div>
            </div>
          </td>
          <td style="font-weight:700;">x${qty}</td>
          <td style="font-weight:700; text-align:right;">$${total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    modalEl.innerHTML = `
      <div class="modal-details-card">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
          <div>
            <div style="display:flex; gap:0.6rem; align-items:center;">
              <h3 style="margin:0;">Order #${order._id}</h3>
              <span class="badge badge-pending">${order.status.toUpperCase()}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Placed on ${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="AdminOrders.closeModal()">✕ Close</button>
        </div>

        <!-- 2 Column Details Grid -->
        <div class="details-grid">
          <!-- Left Box: Customer Info -->
          <div class="details-section-box">
            <div style="font-weight:700; color:var(--primary-accent); font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em;">
              👤 Customer Contact & Address
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted);">Full Name</div>
              <div style="font-weight:600; color:white; font-size:1rem;">${this.escapeHtml(customerName)}</div>
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted);">Email Address</div>
              <div style="font-weight:500; color:white; font-size:0.9rem;">${this.escapeHtml(customerEmail)}</div>
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted);">Mobile Phone Number</div>
              <div style="display:flex; gap:0.5rem; align-items:center; margin-top:2px;">
                <span style="font-weight:700; color:#2DBE55; font-size:1rem;">${this.escapeHtml(customerPhone)}</span>
                <a href="tel:${this.escapeHtml(customerPhone)}" class="btn-icon-action" style="padding:0.2rem 0.5rem; font-size:0.75rem; text-decoration:none;">
                  📞 Call
                </a>
                <button class="btn-icon-action" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="navigator.clipboard.writeText('${this.escapeHtml(customerPhone)}')">
                  📋 Copy
                </button>
              </div>
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted);">Delivery Address</div>
              <div style="font-weight:500; color:white; font-size:0.85rem; margin-top:2px; line-height:1.4;">
                📍 ${this.escapeHtml(fullAddress)}
              </div>
              <button class="btn-icon-action" style="margin-top:6px; padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="navigator.clipboard.writeText('${this.escapeHtml(fullAddress)}')">
                📋 Copy Delivery Address
              </button>
            </div>
          </div>

          <!-- Right Box: Payment & Status Machine -->
          <div class="details-section-box">
            <div style="font-weight:700; color:var(--primary-accent); font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em;">
              💳 Payment & Status Machine
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted);">Payment Method</div>
              <div style="margin-top:4px;">${paymentBadge}</div>
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted);">Transaction / Intent Reference</div>
              <div style="font-family:monospace; color:white; font-size:0.8rem; background:var(--bg-card); padding:0.4rem 0.6rem; border-radius:6px; margin-top:2px; word-break:break-all;">
                ${order.paymentIntentId || 'COD-LOCAL-PAYMENT'}
              </div>
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">Update Status Transition</div>
              ${allowedNext.length > 0 ? `
                <div style="display:flex; gap:0.5rem;">
                  <select id="modal-status-select" class="form-control">
                    ${allowedNext.map(st => `<option value="${st}">${st.toUpperCase()}</option>`).join('')}
                  </select>
                  <button class="btn btn-primary" onclick="AdminOrders.updateModalStatus('${order._id}')">
                    Update
                  </button>
                </div>
              ` : '<div style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Order has reached final state.</div>'}
            </div>
          </div>
        </div>

        <!-- Ordered Products Table -->
        <div>
          <div style="font-weight:700; color:white; margin-bottom:0.5rem;">🛒 Ordered Products (${order.items ? order.items.length : 0})</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div style="background:var(--bg-dark); border:1px solid var(--border-color); border-radius:12px; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600; color:var(--text-muted);">Total Order Amount Charged:</span>
          <span style="font-weight:800; font-size:1.5rem; color:#2DBE55;">$${(order.amount || 0).toFixed(2)}</span>
        </div>
      </div>
    `;

    modalEl.style.display = 'flex';
  }

  static closeModal() {
    const modalEl = document.getElementById('order-details-modal');
    if (modalEl) modalEl.style.display = 'none';
  }

  static async updateStatus(orderId) {
    const selectEl = document.getElementById(`select-status-${orderId}`);
    if (!selectEl) return;
    await this.executeStatusUpdate(orderId, selectEl.value);
  }

  static async updateModalStatus(orderId) {
    const selectEl = document.getElementById('modal-status-select');
    if (!selectEl) return;
    await this.executeStatusUpdate(orderId, selectEl.value);
    this.closeModal();
  }

  static async executeStatusUpdate(orderId, newStatus) {
    const alertEl = document.getElementById('orders-alert');
    const successEl = document.getElementById('orders-success-alert');

    if (alertEl) alertEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      if (!data.success) {
        throw new Error(data.message || 'Failed to update order status');
      }

      if (successEl) {
        successEl.textContent = `Order #${orderId} status updated to "${newStatus.toUpperCase()}" successfully.`;
        successEl.style.display = 'block';
      }

      await this.loadOrders();
    } catch (error) {
      if (alertEl) {
        alertEl.textContent = error.message;
        alertEl.style.display = 'block';
      }
    }
  }

  static escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.AdminOrders = AdminOrders;
