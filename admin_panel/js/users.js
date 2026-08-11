/* MR Mega Mart Admin Customer Management Controller */

class AdminUsers {
  static async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <h2>Customer Accounts & Access Management</h2>
        <div style="display:flex; gap: 0.75rem;">
          <input type="text" id="user-search-input" class="form-control" placeholder="Search name or email..." style="width:260px;" />
          <button id="user-search-btn" class="btn btn-primary">Search</button>
        </div>
      </div>

      <div id="user-alert" class="alert alert-danger"></div>
      <div id="user-success-alert" class="alert alert-success"></div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email Address</th>
              <th>System Role</th>
              <th>Email Verified</th>
              <th>Registration Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading customers...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('user-search-btn').addEventListener('click', () => this.loadUsers());
    document.getElementById('user-search-input').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.loadUsers();
    });

    await this.loadUsers();
  }

  static async loadUsers() {
    const search = document.getElementById('user-search-input').value;
    const body = document.getElementById('users-table-body');
    const alertEl = document.getElementById('user-alert');
    alertEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.get(`/api/admin/users?search=${encodeURIComponent(search)}`);
      if (!data.success || !data.users) {
        throw new Error('Failed to fetch user accounts');
      }

      if (data.users.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No users found matching query.</td></tr>`;
        return;
      }

      body.innerHTML = data.users.map((u) => {
        const name = `${u.userFirstName || ''} ${u.userLastName || ''}`.trim() || 'Anonymous User';
        const roleBadge = u.role === 'admin' ? 'badge-warning' : 'badge-info';
        const verifiedBadge = u.emailVerified ? 'badge-success' : 'badge-danger';
        const regDate = new Date(u.createdAt).toLocaleDateString();

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:white;">${this.escapeHtml(name)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${u._id}</div>
            </td>
            <td style="font-weight:500;">${this.escapeHtml(u.email)}</td>
            <td><span class="badge ${roleBadge}">${(u.role || 'customer').toUpperCase()}</span></td>
            <td><span class="badge ${verifiedBadge}">${u.emailVerified ? 'VERIFIED' : 'UNVERIFIED'}</span></td>
            <td style="font-size:0.85rem; color:var(--text-muted);">${regDate}</td>
            <td>
              ${u.role !== 'admin' ? `
                <button class="btn btn-secondary btn-sm" onclick="AdminUsers.toggleAdminRole('${u._id}', '${u.role}')">
                  🛡️ Promote to Admin
                </button>
              ` : `
                <button class="btn btn-danger btn-sm" onclick="AdminUsers.toggleAdminRole('${u._id}', '${u.role}')">
                  Demote to Customer
                </button>
              `}
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static async toggleAdminRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to "${newRole.toUpperCase()}"?`)) {
      return;
    }

    const alertEl = document.getElementById('user-alert');
    const successEl = document.getElementById('user-success-alert');
    alertEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
      const data = await window.AdminApiClient.put(`/api/admin/users/${userId}/status`, { role: newRole });
      if (!data.success) {
        throw new Error(data.message || 'Failed to update user role');
      }

      successEl.textContent = `User role updated successfully to "${newRole}".`;
      successEl.style.display = 'block';
      await this.loadUsers();
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.style.display = 'block';
    }
  }

  static escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.AdminUsers = AdminUsers;
