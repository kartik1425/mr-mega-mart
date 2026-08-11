/* MR Mega Mart Admin Review Moderation Controller */

class AdminReviews {
  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <h2>Product Reviews Moderation</h2>
        <button id="refresh-reviews-btn" class="btn btn-secondary">🔄 Refresh Reviews</button>
      </div>

      <div id="review-alert" class="alert alert-danger"></div>
      <div id="review-success-alert" class="alert alert-success"></div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review Comment</th>
              <th>Submitted Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="reviews-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading reviews...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('refresh-reviews-btn').addEventListener('click', () => this.loadReviews());
    await this.loadReviews();
  }

  static async loadReviews() {
    const body = document.getElementById('reviews-table-body');
    const alertEl = document.getElementById('review-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get('/api/admin/reviews');
      if (!data.success || !data.reviews) {
        throw new Error('Failed to fetch product reviews');
      }

      if (data.reviews.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No product reviews found.</td></tr>`;
        return;
      }

      body.innerHTML = data.reviews.map((r) => {
        const productTitle = r.productId ? r.productId.title : 'Deleted Product';
        const customerName = r.userId ? `${r.userId.userFirstName || ''} ${r.userId.userLastName || ''}`.trim() : 'Anonymous';
        const dateStr = new Date(r.createdAt).toLocaleDateString();

        const stars = '⭐'.repeat(r.rating || 1);

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(productTitle)}</div>
            </td>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(customerName)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${r.userId?.email || 'N/A'}</div>
            </td>
            <td style="font-size:1.1rem;">${stars} <span style="font-size:0.85rem; font-weight:700; color:var(--warning-color);">(${r.rating}/5)</span></td>
            <td style="color:var(--text-primary); font-size:0.9rem;">${this.escapeHtml(r.comment || 'No text comment')}</td>
            <td style="font-size:0.8rem; color:var(--text-muted);">${dateStr}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="AdminReviews.handleDelete('${r._id}')">
                🗑️ Moderate/Delete
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

  static async handleDelete(reviewId) {
    if (!confirm('Are you sure you want to delete this customer review? The product average rating will be automatically recalculated.')) {
      return;
    }

    const alertEl = document.getElementById('review-alert');
    const successEl = document.getElementById('review-success-alert');
    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.delete(`/api/admin/reviews/${reviewId}`);
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete review');
      }

      successEl.textContent = 'Review deleted and product rating aggregates updated.';
      successEl.style.display = 'block';
      await this.loadReviews();
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.AdminReviews = AdminReviews;
