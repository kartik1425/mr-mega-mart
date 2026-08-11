/* MR Mega Mart Admin Product CRUD Controller */

class AdminProducts {
  static currentProducts = [];
  static categoriesList = [];

  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <h2>Product Catalog Management</h2>
        <div style="display:flex; gap: 0.75rem; flex-wrap:wrap;">
          <input type="text" id="product-search-input" class="form-control" placeholder="Search product name..." style="width:200px;" />
          <select id="product-category-filter" class="form-control" style="width:160px;">
            <option value="">All Categories</option>
          </select>
          <select id="product-stock-filter" class="form-control" style="width:150px;">
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
          <select id="product-sort-filter" class="form-control" style="width:150px;">
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_asc">Stock: Low to High</option>
            <option value="stock_desc">Stock: High to Low</option>
          </select>
          <button id="product-filter-btn" class="btn btn-secondary">Filter</button>
          <button id="open-add-product-btn" class="btn btn-primary">➕ Add Product</button>
        </div>
      </div>

      <div id="product-alert" class="alert alert-danger"></div>
      <div id="product-success-alert" class="alert alert-success"></div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="products-table-body">
            <tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading products...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Product Modal -->
      <div id="product-modal" class="modal-backdrop" style="display:none;">
        <div class="modal-card" style="max-width:640px;">
          <h3 id="product-modal-title" style="margin-bottom:1rem;">Add New Product</h3>
          <div id="modal-product-alert" class="alert alert-danger"></div>
          <form id="product-form">
            <input type="hidden" id="pm-id" />
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom:1rem;">
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Title *</label>
                <input type="text" id="pm-title" class="form-control" placeholder="Fresh Organic Bananas" required />
              </div>
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Category *</label>
                <select id="pm-category" class="form-control" required>
                  <option value="">Select Category</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:1rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Description *</label>
              <textarea id="pm-description" class="form-control" rows="3" placeholder="High-quality organic bananas sourced fresh daily." required></textarea>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom:1rem;">
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Price (₹) *</label>
                <input type="number" step="0.01" min="0" id="pm-price" class="form-control" placeholder="49.00" required />
              </div>
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Old Price (₹)</label>
                <input type="number" step="0.01" min="0" id="pm-old-price" class="form-control" placeholder="59.00" />
              </div>
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Stock Count *</label>
                <input type="number" min="0" id="pm-stock" class="form-control" placeholder="50" required />
              </div>
            </div>

            <div style="margin-bottom:1rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Image URLs (comma separated) *</label>
              <input type="text" id="pm-images" class="form-control" placeholder="https://example.com/image.jpg" required />
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom:1.5rem;">
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Tags (comma separated)</label>
                <input type="text" id="pm-tags" class="form-control" placeholder="fresh, organic, fruit" />
              </div>
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Cargo Weight (kg)</label>
                <input type="number" step="0.1" min="0" id="pm-weight" class="form-control" placeholder="1.0" />
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
              <button type="button" id="pm-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="pm-submit-btn" class="btn btn-primary">Save Product</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('product-filter-btn').addEventListener('click', () => this.loadProducts());
    document.getElementById('open-add-product-btn').addEventListener('click', () => this.openAddModal());
    document.getElementById('pm-cancel-btn').addEventListener('click', () => {
      document.getElementById('product-modal').style.display = 'none';
    });
    document.getElementById('product-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

    await this.loadCategories();
    await this.loadProducts();
  }

  static async loadCategories() {
    try {
      const data = await window.AdminApiClient.get('/api/admin/categories');
      if (data.success && data.categories) {
        this.categoriesList = data.categories;
        const filterSelect = document.getElementById('product-category-filter');
        const modalSelect = document.getElementById('pm-category');

        const optionsHtml = data.categories.map((c) => `<option value="${c._id}">${this.escapeHtml(c.name)}</option>`).join('');
        filterSelect.innerHTML = `<option value="">All Categories</option>${optionsHtml}`;
        modalSelect.innerHTML = `<option value="">Select Category</option>${optionsHtml}`;
      }
    } catch (e) {
      console.warn('Failed to load categories for dropdown', e);
    }
  }

  static async loadProducts() {
    const search = document.getElementById('product-search-input').value;
    const category = document.getElementById('product-category-filter').value;
    const stockStatus = document.getElementById('product-stock-filter').value;
    const sortBy = document.getElementById('product-sort-filter').value;

    const body = document.getElementById('products-table-body');
    const alertEl = document.getElementById('product-alert');
    alertEl.style.display = 'none';

    try {
      const url = `/api/admin/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&stockStatus=${encodeURIComponent(stockStatus)}&sortBy=${encodeURIComponent(sortBy)}`;
      const data = await window.AdminApiClient.get(url);

      if (!data.success || !data.products) {
        throw new Error('Failed to fetch product catalog');
      }

      this.currentProducts = data.products;

      if (data.products.length === 0) {
        body.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No products found matching criteria.</td></tr>`;
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
        const imgUrl = (p.imageURLs && p.imageURLs.length > 0) ? p.imageURLs[0] : 'https://via.placeholder.com/40';

        return `
          <tr>
            <td>
              <img src="${this.escapeHtml(imgUrl)}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/40'" />
            </td>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(p.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${p._id}</div>
            </td>
            <td>${this.escapeHtml(categoryName)}</td>
            <td style="font-weight:600; color:var(--primary-accent);">₹${(p.price || 0).toFixed(2)}</td>
            <td style="font-weight:700;">${p.stockCount}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td>
              <div style="display:flex; gap:0.4rem;">
                <button class="btn btn-secondary btn-sm" onclick="AdminProducts.openEditModal('${p._id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="AdminProducts.handleDelete('${p._id}', '${this.escapeJsString(p.title)}')">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static openAddModal() {
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('pm-id').value = '';
    document.getElementById('pm-title').value = '';
    document.getElementById('pm-description').value = '';
    document.getElementById('pm-price').value = '';
    document.getElementById('pm-old-price').value = '';
    document.getElementById('pm-stock').value = '0';
    document.getElementById('pm-category').value = '';
    document.getElementById('pm-images').value = '';
    document.getElementById('pm-tags').value = '';
    document.getElementById('pm-weight').value = '0';
    document.getElementById('modal-product-alert').style.display = 'none';
    document.getElementById('product-modal').style.display = 'flex';
  }

  static openEditModal(productId) {
    const p = this.currentProducts.find((item) => item._id === productId);
    if (!p) return;

    document.getElementById('product-modal-title').textContent = `Edit Product: ${p.title}`;
    document.getElementById('pm-id').value = p._id;
    document.getElementById('pm-title').value = p.title || '';
    document.getElementById('pm-description').value = p.description || '';
    document.getElementById('pm-price').value = p.price || 0;
    document.getElementById('pm-old-price').value = p.oldPrice || '';
    document.getElementById('pm-stock').value = p.stockCount || 0;
    document.getElementById('pm-category').value = p.category ? (p.category._id || p.category) : '';
    document.getElementById('pm-images').value = (p.imageURLs || []).join(', ');
    document.getElementById('pm-tags').value = (p.tags || []).join(', ');
    document.getElementById('pm-weight').value = p.cargoWeight || 0;
    document.getElementById('modal-product-alert').style.display = 'none';
    document.getElementById('product-modal').style.display = 'flex';
  }

  static async handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('pm-id').value;
    const title = document.getElementById('pm-title').value.trim();
    const description = document.getElementById('pm-description').value.trim();
    const category = document.getElementById('pm-category').value;
    const price = parseFloat(document.getElementById('pm-price').value);
    const oldPrice = parseFloat(document.getElementById('pm-old-price').value) || null;
    const stockCount = parseInt(document.getElementById('pm-stock').value, 10) || 0;
    const imagesStr = document.getElementById('pm-images').value.trim();
    const tagsStr = document.getElementById('pm-tags').value.trim();
    const weight = parseFloat(document.getElementById('pm-weight').value) || 0;

    const modalAlert = document.getElementById('modal-product-alert');
    const submitBtn = document.getElementById('pm-submit-btn');
    modalAlert.style.display = 'none';

    if (!title || !description || isNaN(price) || price < 0 || !category || !imagesStr) {
      modalAlert.textContent = 'Please fill out all required fields with valid values.';
      modalAlert.style.display = 'block';
      return;
    }

    const imageURLs = imagesStr.split(',').map((s) => s.trim()).filter(Boolean);
    const tags = tagsStr.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      title,
      description,
      category,
      price,
      oldPrice,
      stockCount,
      imageURLs,
      tags,
      cargoWeight: weight,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      if (id) {
        await window.AdminApiClient.put(`/api/admin/products/${id}`, payload);
      } else {
        await window.AdminApiClient.post('/api/admin/products', payload);
      }

      document.getElementById('product-modal').style.display = 'none';
      const successEl = document.getElementById('product-success-alert');
      successEl.textContent = `Product "${title}" saved successfully.`;
      successEl.style.display = 'block';

      await this.loadProducts();
    } catch (error) {
      modalAlert.textContent = error.message;
      modalAlert.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Product';
    }
  }

  static async handleDelete(productId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    const alertEl = document.getElementById('product-alert');
    const successEl = document.getElementById('product-success-alert');
    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.delete(`/api/admin/products/${productId}`);
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete product');
      }

      successEl.textContent = `Product "${title}" deleted successfully.`;
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

window.AdminProducts = AdminProducts;
