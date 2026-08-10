/* MR Mega Mart Admin Inventory Manager */

class AdminInventory {
  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <h2>Inventory & Stock Management</h2>
        <div style="display:flex; gap: 0.75rem;">
          <input type="text" id="inventory-search" class="form-control" placeholder="Search product or category..." style="width:260px;" />
          <button id="inventory-search-btn" class="btn btn-primary">Search</button>
        </div>
      </div>

      <div id="inventory-alert" class="alert alert-danger"></div>
      <div id="inventory-success-alert" class="alert alert-success"></div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Count</th>
              <th>Stock Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="inventory-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading catalog inventory...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Update Stock Modal -->
      <div id="stock-modal" class="modal-backdrop" style="display:none;">
        <div class="modal-card">
          <h3 style="margin-bottom:1rem;" id="modal-product-title">Update Product Stock</h3>
          <form id="stock-update-form">
            <input type="hidden" id="modal-product-id" />
            <div style="margin-bottom:1.25rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.4rem;">New Stock Count</label>
              <input type="number" id="modal-stock-input" class="form-control" min="0" required />
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
              <button type="button" id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Stock</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('inventory-search-btn').addEventListener('click', () => this.loadProducts());
    document.getElementById('inventory-search').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.loadProducts();
    });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
      document.getElementById('stock-modal').style.display = 'none';
    });

    document.getElementById('stock-update-form').addEventListener('submit', (e) => this.handleStockSubmit(e));

    await this.loadProducts();
  }

  static async loadProducts() {
    const searchVal = document.getElementById('inventory-search').value;
    const body = document.getElementById('inventory-table-body');
    const alertEl = document.getElementById('inventory-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get(`/api/admin/products?search=${encodeURIComponent(searchVal)}`);
      if (!data.success || !data.products) {
        throw new Error('Failed to fetch product inventory');
      }

      if (data.products.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No products found matching query.</td></tr>`;
        return;
      }

      body.innerHTML = data.products.map((p) => {
        let badgeClass = 'badge-success';
        let statusText = 'In Stock';

        if (p.stockCount <= 0) {
          badgeClass = 'badge-danger';
          statusText = 'Out of Stock';
        } else if (p.stockCount <= 5) {
          badgeClass = 'badge-warning';
          statusText = 'Low Stock';
        }

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(p.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${p._id}</div>
            </td>
            <td>${this.escapeHtml(p.category || 'General')}</td>
            <td style="font-weight:600;">$${(p.price || 0).toFixed(2)}</td>
            <td style="font-weight:700; font-size:1.05rem;">${p.stockCount}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="AdminInventory.openStockModal('${p._id}', '${this.escapeJsString(p.title)}', ${p.stockCount})">
                ✏️ Edit Stock
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static openStockModal(productId, title, currentStock) {
    document.getElementById('modal-product-id').value = productId;
    document.getElementById('modal-product-title').textContent = `Update Stock: ${title}`;
    document.getElementById('modal-stock-input').value = currentStock;
    document.getElementById('stock-modal').style.display = 'flex';
  }

  static async handleStockSubmit(e) {
    e.preventDefault();
    const productId = document.getElementById('modal-product-id').value;
    const stockVal = parseInt(document.getElementById('modal-stock-input').value, 10);
    const alertEl = document.getElementById('inventory-alert');
    const successEl = document.getElementById('inventory-success-alert');

    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    if (isNaN(stockVal) || stockVal < 0) {
      alertEl.textContent = 'Please enter a valid non-negative integer for stock count.';
      alertEl.style.display = 'block';
      return;
    }

    try {
      const data = await window.AdminApiClient.put(`/api/admin/products/${productId}/stock`, { stockCount: stockVal });
      if (!data.success) {
        throw new Error(data.message || 'Failed to update stock');
      }

      document.getElementById('stock-modal').style.display = 'none';
      successEl.textContent = `Stock updated successfully for product to ${stockVal}.`;
      successEl.style.display = 'block';

      await this.loadProducts();
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  static escapeJsString(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }
}

window.AdminInventory = AdminInventory;
