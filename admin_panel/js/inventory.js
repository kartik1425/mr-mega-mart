/* MR Mega Mart Admin Inventory Manager */

class AdminInventory {
  static currentStock = 0;

  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <h2>Inventory & Stock Control</h2>
        <div style="display:flex; gap: 0.75rem; flex-wrap:wrap;">
          <input type="text" id="inventory-search" class="form-control" placeholder="Search product title..." style="width:220px;" />
          <select id="inventory-status-filter" class="form-control" style="width:160px;">
            <option value="">All Stock States</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
          <button id="inventory-search-btn" class="btn btn-primary">Filter Catalog</button>
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
              <th>Current Stock</th>
              <th>Stock Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="inventory-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading catalog inventory...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Quick Stock Adjustment Modal -->
      <div id="stock-modal" class="modal-backdrop" style="display:none;">
        <div class="modal-card" style="max-width:480px;">
          <h3 style="margin-bottom:0.5rem;" id="modal-product-title">Adjust Product Stock</h3>
          <p id="modal-current-stock-label" style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem;"></p>
          
          <form id="stock-update-form">
            <input type="hidden" id="modal-product-id" />
            
            <div style="margin-bottom:1.25rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.4rem;">Adjustment Mode</label>
              <select id="modal-stock-mode" class="form-control">
                <option value="set">Set Exact Stock</option>
                <option value="add">Add Stock (+)</option>
                <option value="subtract">Subtract Stock (-)</option>
              </select>
            </div>

            <div style="margin-bottom:1.25rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.4rem;" id="modal-quantity-label">New Stock Quantity</label>
              <input type="number" id="modal-stock-input" class="form-control" min="0" required />
            </div>

            <div style="background-color:var(--bg-dark); padding:0.75rem 1rem; border-radius:8px; margin-bottom:1.5rem; border:1px solid var(--border-color);">
              <span style="font-size:0.85rem; color:var(--text-muted);">Stock Preview: </span>
              <span id="modal-stock-preview" style="font-weight:700; color:var(--primary-accent);">0</span>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
              <button type="button" id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="modal-save-btn" class="btn btn-primary">Confirm Stock Change</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('inventory-search-btn').addEventListener('click', () => this.loadProducts());
    document.getElementById('inventory-status-filter').addEventListener('change', () => this.loadProducts());
    document.getElementById('inventory-search').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.loadProducts();
    });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
      document.getElementById('stock-modal').style.display = 'none';
    });

    document.getElementById('modal-stock-mode').addEventListener('change', () => this.updateStockPreview());
    document.getElementById('modal-stock-input').addEventListener('input', () => this.updateStockPreview());

    document.getElementById('stock-update-form').addEventListener('submit', (e) => this.handleStockSubmit(e));

    await this.loadProducts();
  }

  static async loadProducts() {
    const searchVal = document.getElementById('inventory-search').value;
    const statusVal = document.getElementById('inventory-status-filter').value;
    const body = document.getElementById('inventory-table-body');
    const alertEl = document.getElementById('inventory-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get(`/api/admin/products?search=${encodeURIComponent(searchVal)}&stockStatus=${encodeURIComponent(statusVal)}`);
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

        const categoryName = p.category ? (p.category.name || 'General') : 'General';

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(p.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${p._id}</div>
            </td>
            <td>${this.escapeHtml(categoryName)}</td>
            <td style="font-weight:600;">₹${(p.price || 0).toFixed(2)}</td>
            <td style="font-weight:700; font-size:1.05rem;">${p.stockCount}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="AdminInventory.openStockModal('${p._id}', '${this.escapeJsString(p.title)}', ${p.stockCount})">
                📦 Adjust Stock
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
    this.currentStock = currentStock;
    document.getElementById('modal-product-id').value = productId;
    document.getElementById('modal-product-title').textContent = `Adjust Stock: ${title}`;
    document.getElementById('modal-current-stock-label').textContent = `Current Stock Level: ${currentStock}`;
    document.getElementById('modal-stock-mode').value = 'set';
    document.getElementById('modal-stock-input').value = currentStock;
    this.updateStockPreview();
    document.getElementById('stock-modal').style.display = 'flex';
  }

  static updateStockPreview() {
    const mode = document.getElementById('modal-stock-mode').value;
    const inputVal = parseInt(document.getElementById('modal-stock-input').value, 10) || 0;
    const previewEl = document.getElementById('modal-stock-preview');

    let calculated = this.currentStock;
    if (mode === 'add') {
      calculated = this.currentStock + inputVal;
    } else if (mode === 'subtract') {
      calculated = Math.max(0, this.currentStock - inputVal);
    } else {
      calculated = Math.max(0, inputVal);
    }

    previewEl.textContent = `${this.currentStock} → ${calculated}`;
  }

  static async handleStockSubmit(e) {
    e.preventDefault();
    const productId = document.getElementById('modal-product-id').value;
    const mode = document.getElementById('modal-stock-mode').value;
    const inputVal = parseInt(document.getElementById('modal-stock-input').value, 10);
    const alertEl = document.getElementById('inventory-alert');
    const successEl = document.getElementById('inventory-success-alert');

    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    if (isNaN(inputVal) || inputVal < 0) {
      alertEl.textContent = 'Please enter a valid non-negative integer for quantity.';
      alertEl.style.display = 'block';
      return;
    }

    const payload = {
      mode,
      stockCount: inputVal,
      quantity: inputVal,
    };

    try {
      const data = await window.AdminApiClient.put(`/api/admin/products/${productId}/stock`, payload);
      if (!data.success) {
        throw new Error(data.message || 'Failed to update stock');
      }

      document.getElementById('stock-modal').style.display = 'none';
      successEl.textContent = `Stock adjusted successfully for product to ${data.product?.stockCount ?? 'new level'}.`;
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

