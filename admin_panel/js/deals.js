/* MR Mega Mart Admin Deals & Banners CRUD Controller */

class AdminDeals {
  static currentDeals = [];

  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <h2>Promotional Deals & Banners</h2>
        <button id="open-add-deal-btn" class="btn btn-primary">➕ Add Deal Banner</button>
      </div>

      <div id="deal-alert" class="alert alert-danger"></div>
      <div id="deal-success-alert" class="alert alert-success"></div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Preview</th>
              <th>Deal Title</th>
              <th>Action Target</th>
              <th>Aspect Ratio</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="deals-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading deals...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Deal Modal -->
      <div id="deal-modal" class="modal-backdrop" style="display:none;">
        <div class="modal-card" style="max-width:540px;">
          <h3 id="deal-modal-title" style="margin-bottom:1rem;">Add Promotional Deal</h3>
          <div id="modal-deal-alert" class="alert alert-danger"></div>
          <form id="deal-form">
            <input type="hidden" id="dm-id" />
            
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-bottom:1rem;">
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Display Order *</label>
                <input type="number" id="dm-order" class="form-control" placeholder="1" min="1" required />
              </div>
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Deal Title *</label>
                <input type="text" id="dm-title" class="form-control" placeholder="Mega Weekend Grocery Sale" required />
              </div>
            </div>

            <div style="margin-bottom:1rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                <label style="font-size:0.85rem; color:var(--text-muted); margin:0;">Banner Image URL *</label>
                <label class="btn btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.6rem; cursor:pointer; margin:0;">
                  ☁️ Upload Banner
                  <input type="file" id="dm-file-upload" accept="image/*" style="display:none;" />
                </label>
              </div>
              <input type="text" id="dm-image" class="form-control" placeholder="https://example.com/banner.jpg" required />
              <div id="dm-upload-progress" style="display:none; font-size:0.8rem; color:var(--primary); margin-top:0.3rem;">Uploading to Cloudinary: 0%</div>
            </div>

            <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom:1rem;">
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Action Keyword *</label>
                <input type="text" id="dm-action" class="form-control" placeholder="bestof:fruits" required />
              </div>
              <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Aspect Ratio</label>
                <select id="dm-ratio" class="form-control">
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="3:2">3:2</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:1.5rem;">
              <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Description</label>
              <textarea id="dm-description" class="form-control" rows="2" placeholder="Get up to 40% off on organic fresh produce."></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
              <button type="button" id="dm-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="dm-submit-btn" class="btn btn-primary">Save Deal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('open-add-deal-btn').addEventListener('click', () => this.openAddModal());
    document.getElementById('dm-cancel-btn').addEventListener('click', () => {
      document.getElementById('deal-modal').style.display = 'none';
    });

    const dmUpload = document.getElementById('dm-file-upload');
    if (dmUpload) {
      dmUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const progressEl = document.getElementById('dm-upload-progress');
        const imageInput = document.getElementById('dm-image');
        if (progressEl) {
          progressEl.style.display = 'block';
          progressEl.style.color = 'var(--primary)';
          progressEl.textContent = 'Uploading to Cloudinary: 0%';
        }
        try {
          const result = await CloudinaryUploader.uploadFile(file, {
            folder: 'mrmegamart/deals',
            onProgress: (pct) => {
              if (progressEl) progressEl.textContent = `Uploading to Cloudinary: ${pct}%`;
            },
          });
          if (progressEl) progressEl.textContent = 'Upload successful!';
          imageInput.value = result.url;
        } catch (err) {
          if (progressEl) {
            progressEl.style.color = '#ef4444';
            progressEl.textContent = `Upload failed: ${err.message}`;
          }
        }
      });
    }
    document.getElementById('deal-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

    await this.loadDeals();
  }

  static async loadDeals() {
    const body = document.getElementById('deals-table-body');
    const alertEl = document.getElementById('deal-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get('/api/admin/deals');
      if (!data.success || !data.deals) {
        throw new Error('Failed to fetch promotional deals');
      }

      this.currentDeals = data.deals;

      if (data.deals.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No deals configured.</td></tr>`;
        return;
      }

      body.innerHTML = data.deals.map((d) => {
        return `
          <tr>
            <td style="font-weight:700; font-size:1.1rem; color:var(--primary-accent); text-align:center;">#${d.dealOrder}</td>
            <td>
              <img src="${this.escapeHtml(d.imageUrl)}" style="width:70px; height:40px; border-radius:6px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/70x40'" />
            </td>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(d.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(d.description || '')}</div>
            </td>
            <td><span class="badge badge-info">${this.escapeHtml(d.action)}</span></td>
            <td><span class="badge badge-secondary" style="background:rgba(255,255,255,0.1); color:white;">${d.aspectRatio || '16:9'}</span></td>
            <td>
              <div style="display:flex; gap:0.4rem;">
                <button class="btn btn-secondary btn-sm" onclick="AdminDeals.openEditModal('${d._id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="AdminDeals.handleDelete('${d._id}', '${this.escapeJsString(d.title)}')">🗑️ Delete</button>
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
    document.getElementById('deal-modal-title').textContent = 'Add Promotional Deal';
    document.getElementById('dm-id').value = '';
    document.getElementById('dm-order').value = (this.currentDeals.length + 1).toString();
    document.getElementById('dm-title').value = '';
    document.getElementById('dm-image').value = '';
    document.getElementById('dm-action').value = 'bestof:all';
    document.getElementById('dm-ratio').value = '16:9';
    document.getElementById('dm-description').value = '';
    document.getElementById('modal-deal-alert').style.display = 'none';
    document.getElementById('deal-modal').style.display = 'flex';
  }

  static openEditModal(dealId) {
    const d = this.currentDeals.find((item) => item._id === dealId);
    if (!d) return;

    document.getElementById('deal-modal-title').textContent = `Edit Deal: ${d.title}`;
    document.getElementById('dm-id').value = d._id;
    document.getElementById('dm-order').value = d.dealOrder;
    document.getElementById('dm-title').value = d.title || '';
    document.getElementById('dm-image').value = d.imageUrl || '';
    document.getElementById('dm-action').value = d.action || '';
    document.getElementById('dm-ratio').value = d.aspectRatio || '16:9';
    document.getElementById('dm-description').value = d.description || '';
    document.getElementById('modal-deal-alert').style.display = 'none';
    document.getElementById('deal-modal').style.display = 'flex';
  }

  static async handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('dm-id').value;
    const dealOrder = parseInt(document.getElementById('dm-order').value, 10);
    const title = document.getElementById('dm-title').value.trim();
    const imageUrl = document.getElementById('dm-image').value.trim();
    const action = document.getElementById('dm-action').value.trim();
    const aspectRatio = document.getElementById('dm-ratio').value;
    const description = document.getElementById('dm-description').value.trim();

    const modalAlert = document.getElementById('modal-deal-alert');
    const submitBtn = document.getElementById('dm-submit-btn');
    modalAlert.style.display = 'none';

    if (isNaN(dealOrder) || !title || !imageUrl || !action) {
      modalAlert.textContent = 'Please fill out all required fields with valid values.';
      modalAlert.style.display = 'block';
      return;
    }

    const payload = { dealOrder, title, imageUrl, action, aspectRatio, description };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      if (id) {
        await window.AdminApiClient.put(`/api/admin/deals/${id}`, payload);
      } else {
        await window.AdminApiClient.post('/api/admin/deals', payload);
      }

      document.getElementById('deal-modal').style.display = 'none';
      const successEl = document.getElementById('deal-success-alert');
      successEl.textContent = `Deal "${title}" saved successfully.`;
      successEl.style.display = 'block';

      await this.loadDeals();
    } catch (error) {
      modalAlert.textContent = error.message;
      modalAlert.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Deal';
    }
  }

  static async handleDelete(dealId, title) {
    if (!confirm(`Are you sure you want to delete deal "${title}"?`)) {
      return;
    }

    const alertEl = document.getElementById('deal-alert');
    const successEl = document.getElementById('deal-success-alert');
    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.delete(`/api/admin/deals/${dealId}`);
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete deal');
      }

      successEl.textContent = `Deal "${title}" deleted successfully.`;
      successEl.style.display = 'block';
      await this.loadDeals();
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

window.AdminDeals = AdminDeals;
