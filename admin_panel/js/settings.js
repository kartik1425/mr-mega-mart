/* MR Mega Mart Admin Panel — Store & Delivery Settings View */

class AdminSettings {
  static async render(container) {
    container.innerHTML = `
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
          <div>
            <h3 style="margin:0; font-size:1.25rem; font-weight:700; color:var(--text-primary);">📍 Store Location & Delivery Settings</h3>
            <p style="margin:0.25rem 0 0 0; font-size:0.85rem; color:var(--text-muted);">Configure your shop location and dynamic per-kilometer delivery fee rules applied to all customers.</p>
          </div>
          <button id="save-settings-btn" class="btn btn-primary" style="padding: 0.6rem 1.25rem; font-weight: 600;">
            💾 Save Settings
          </button>
        </div>

        <div id="settings-alert" class="alert" style="display:none; margin-bottom: 1.5rem;"></div>

        <form id="settings-form">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
            <div style="grid-column: span 2;">
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">Store Name</label>
              <input type="text" id="settings-shop-name" class="form-control" placeholder="e.g. MR Mega Mart Central Hub" required />
            </div>

            <div style="grid-column: span 2;">
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">Shop Street Address</label>
              <input type="text" id="settings-shop-address" class="form-control" placeholder="e.g. Main Market Road, Plot 42" required />
            </div>

            <div>
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">City</label>
              <input type="text" id="settings-city" class="form-control" placeholder="e.g. New Delhi" required />
            </div>

            <div>
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">State</label>
              <input type="text" id="settings-state" class="form-control" placeholder="e.g. Delhi" required />
            </div>

            <div>
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">Pincode</label>
              <input type="text" id="settings-pincode" class="form-control" placeholder="e.g. 110001" required />
            </div>

            <div>
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">GPS Latitude</label>
              <input type="number" step="0.000001" id="settings-lat" class="form-control" placeholder="e.g. 28.6139" required />
            </div>

            <div>
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">GPS Longitude</label>
              <input type="number" step="0.000001" id="settings-lng" class="form-control" placeholder="e.g. 77.2090" required />
            </div>
          </div>

          <h4 style="margin: 1.5rem 0 1rem 0; font-size: 1.05rem; font-weight: 700; color: var(--primary-color); border-top: 1px dashed var(--border-color); padding-top: 1.25rem;">
            🚚 Delivery Pricing Matrix
          </h4>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div>
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">Delivery Charge Per KM (₹)</label>
              <input type="number" step="1" min="0" id="settings-per-km" class="form-control" placeholder="e.g. 10" required />
              <small style="color:var(--text-muted); font-size:0.75rem;">Calculated dynamically from shop address to customer home address.</small>
            </div>

            <div>
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">Base Delivery Charge (₹)</label>
              <input type="number" step="1" min="0" id="settings-base-fee" class="form-control" placeholder="e.g. 20" required />
              <small style="color:var(--text-muted); font-size:0.75rem;">Fixed minimum fee added to every delivery.</small>
            </div>

            <div style="grid-column: span 2;">
              <label class="form-label" style="font-weight:600; font-size:0.9rem;">Free Delivery Order Threshold (₹)</label>
              <input type="number" step="1" min="0" id="settings-free-threshold" class="form-control" placeholder="e.g. 500" required />
              <small style="color:var(--text-muted); font-size:0.75rem;">Orders equal or above this amount automatically receive ₹0 delivery charge.</small>
            </div>
          </div>
        </form>
      </div>
    `;

    this.loadSettings();
    this.bindEvents();
  }

  static async loadSettings() {
    const alertEl = document.getElementById('settings-alert');
    try {
      const response = await window.AdminApiClient.get('/api/settings/get-settings');
      if (response && response.settings) {
        const s = response.settings;
        document.getElementById('settings-shop-name').value = s.shopName || '';
        document.getElementById('settings-shop-address').value = s.shopAddress || '';
        document.getElementById('settings-city').value = s.city || '';
        document.getElementById('settings-state').value = s.state || '';
        document.getElementById('settings-pincode').value = s.pincode || '';
        document.getElementById('settings-lat').value = s.latitude || 28.6139;
        document.getElementById('settings-lng').value = s.longitude || 77.2090;
        document.getElementById('settings-per-km').value = s.perKmFee || 10;
        document.getElementById('settings-base-fee').value = s.baseDeliveryFee || 20;
        document.getElementById('settings-free-threshold').value = s.freeDeliveryThreshold || 500;
      }
    } catch (error) {
      alertEl.className = 'alert alert-danger';
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static bindEvents() {
    const saveBtn = document.getElementById('save-settings-btn');
    const alertEl = document.getElementById('settings-alert');

    saveBtn.addEventListener('click', async () => {
      alertEl.style.display = 'none';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const payload = {
        shopName: document.getElementById('settings-shop-name').value,
        shopAddress: document.getElementById('settings-shop-address').value,
        city: document.getElementById('settings-city').value,
        state: document.getElementById('settings-state').value,
        pincode: document.getElementById('settings-pincode').value,
        latitude: parseFloat(document.getElementById('settings-lat').value),
        longitude: parseFloat(document.getElementById('settings-lng').value),
        perKmFee: parseFloat(document.getElementById('settings-per-km').value),
        baseDeliveryFee: parseFloat(document.getElementById('settings-base-fee').value),
        freeDeliveryThreshold: parseFloat(document.getElementById('settings-free-threshold').value),
      };

      try {
        const response = await window.AdminApiClient.put('/api/settings/update-settings', payload);
        alertEl.className = 'alert alert-success';
        alertEl.textContent = response.message || 'Store settings saved successfully!';
        alertEl.style.display = 'block';
      } catch (error) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = error.message;
        alertEl.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Settings';
      }
    });
  }
}

window.AdminSettings = AdminSettings;
