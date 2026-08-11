/* MR Mega Mart Admin Category CRUD Controller */

class AdminCategories {
  static currentCategories = [];

  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <h2>Category Hierarchy & Management</h2>
        <button id="open-add-category-btn" class="btn btn-primary">➕ Add Category</button>
      </div>

      <div id="category-alert" class="alert alert-danger"></div>
      <div id="category-success-alert" class="alert alert-success"></div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Parent Category</th>
              <th>Description</th>
              <th>Assigned Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="categories-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading categories...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Category Modal -->
      <div id="category-modal" class="modal-backdrop" style="display:none;">
        <div class="modal-card" style="max-width:520px;">
          <h3 id="category-modal-title" style="margin-bottom:1rem;">Add New Category</h3>
          <div id="modal-category-alert" class="alert alert-danger"></div>
          <form id="category-form">
            <input type="hidden" id="cm-id" />
            <div style="margin-bottom:1rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Category Name *</label>
              <input type="text" id="cm-name" class="form-control" placeholder="Beverages" required />
            </div>

            <div style="margin-bottom:1rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Parent Category (Optional)</label>
              <select id="cm-parent" class="form-control">
                <option value="">None (Root Category)</option>
              </select>
            </div>

            <div style="margin-bottom:1rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Description</label>
              <textarea id="cm-description" class="form-control" rows="2" placeholder="Cold drinks, juices, and tea"></textarea>
            </div>

            <div style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" id="cm-active" checked style="width:16px; height:16px;" />
              <label for="cm-active" style="font-size:0.9rem; color:white; cursor:pointer;">Category Active</label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
              <button type="button" id="cm-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="cm-submit-btn" class="btn btn-primary">Save Category</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('open-add-category-btn').addEventListener('click', () => this.openAddModal());
    document.getElementById('cm-cancel-btn').addEventListener('click', () => {
      document.getElementById('category-modal').style.display = 'none';
    });
    document.getElementById('category-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

    await this.loadCategories();
  }

  static async loadCategories() {
    const body = document.getElementById('categories-table-body');
    const alertEl = document.getElementById('category-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get('/api/admin/categories');
      if (!data.success || !data.categories) {
        throw new Error('Failed to fetch categories');
      }

      this.currentCategories = data.categories;

      if (data.categories.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No categories created yet.</td></tr>`;
        return;
      }

      body.innerHTML = data.categories.map((c) => {
        const parentName = c.parentCategory ? (c.parentCategory.name || 'Root') : 'Root';
        const badgeClass = c.isActive !== false ? 'badge-success' : 'badge-danger';
        const statusText = c.isActive !== false ? 'Active' : 'Disabled';

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(c.name)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${c._id}</div>
            </td>
            <td><span class="badge badge-info">${this.escapeHtml(parentName)}</span></td>
            <td style="color:var(--text-muted); font-size:0.85rem;">${this.escapeHtml(c.description || 'No description')}</td>
            <td style="font-weight:700; font-size:1.05rem;">${c.productCount || 0}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td>
              <div style="display:flex; gap:0.4rem;">
                <button class="btn btn-secondary btn-sm" onclick="AdminCategories.openEditModal('${c._id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="AdminCategories.handleDelete('${c._id}', '${this.escapeJsString(c.name)}', ${c.productCount || 0})">🗑️ Delete</button>
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

  static populateParentDropdown(excludeId = null) {
    const parentSelect = document.getElementById('cm-parent');
    const validParents = this.currentCategories.filter((c) => c._id !== excludeId);
    parentSelect.innerHTML = `<option value="">None (Root Category)</option>` +
      validParents.map((c) => `<option value="${c._id}">${this.escapeHtml(c.name)}</option>`).join('');
  }

  static openAddModal() {
    this.populateParentDropdown();
    document.getElementById('category-modal-title').textContent = 'Add New Category';
    document.getElementById('cm-id').value = '';
    document.getElementById('cm-name').value = '';
    document.getElementById('cm-parent').value = '';
    document.getElementById('cm-description').value = '';
    document.getElementById('cm-active').checked = true;
    document.getElementById('modal-category-alert').style.display = 'none';
    document.getElementById('category-modal').style.display = 'flex';
  }

  static openEditModal(categoryId) {
    const c = this.currentCategories.find((item) => item._id === categoryId);
    if (!c) return;

    this.populateParentDropdown(categoryId);
    document.getElementById('category-modal-title').textContent = `Edit Category: ${c.name}`;
    document.getElementById('cm-id').value = c._id;
    document.getElementById('cm-name').value = c.name || '';
    document.getElementById('cm-parent').value = c.parentCategory ? (c.parentCategory._id || c.parentCategory) : '';
    document.getElementById('cm-description').value = c.description || '';
    document.getElementById('cm-active').checked = c.isActive !== false;
    document.getElementById('modal-category-alert').style.display = 'none';
    document.getElementById('category-modal').style.display = 'flex';
  }

  static async handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('cm-id').value;
    const name = document.getElementById('cm-name').value.trim();
    const parentCategory = document.getElementById('cm-parent').value || null;
    const description = document.getElementById('cm-description').value.trim();
    const isActive = document.getElementById('cm-active').checked;

    const modalAlert = document.getElementById('modal-category-alert');
    const submitBtn = document.getElementById('cm-submit-btn');
    modalAlert.style.display = 'none';

    if (!name) {
      modalAlert.textContent = 'Category name is required.';
      modalAlert.style.display = 'block';
      return;
    }

    const payload = { name, description, parentCategory, isActive };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      if (id) {
        await window.AdminApiClient.put(`/api/admin/categories/${id}`, payload);
      } else {
        await window.AdminApiClient.post('/api/admin/categories', payload);
      }

      document.getElementById('category-modal').style.display = 'none';
      const successEl = document.getElementById('category-success-alert');
      successEl.textContent = `Category "${name}" saved successfully.`;
      successEl.style.display = 'block';

      await this.loadCategories();
    } catch (error) {
      modalAlert.textContent = error.message;
      modalAlert.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Category';
    }
  }

  static async handleDelete(categoryId, name, productCount) {
    if (productCount > 0) {
      alert(`Cannot delete category "${name}". There are currently ${productCount} product(s) assigned to this category. Please reassign or delete those products first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${name}"? This action cannot be undone.`)) {
      return;
    }

    const alertEl = document.getElementById('category-alert');
    const successEl = document.getElementById('category-success-alert');
    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.delete(`/api/admin/categories/${categoryId}`);
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete category');
      }

      successEl.textContent = `Category "${name}" deleted successfully.`;
      successEl.style.display = 'block';
      await this.loadCategories();
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

window.AdminCategories = AdminCategories;
