const API_BASE = window.location.origin + '/api';
const AUTH_API = API_BASE + '/auth';
const TOKENS_API = API_BASE + '/tokens';

// Current user data
let currentUser = null;
let tokens = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupEventListeners();
  await loadTokens();
  updateStats();
});

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch(`${AUTH_API}/me`, {
      credentials: 'include'
    });

    if (!response.ok) {
      window.location.href = '/admin/login.html';
      return;
    }

    currentUser = await response.json();
    updateUserInfo();
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/admin/login.html';
  }
}

// Update user info in UI
function updateUserInfo() {
  if (!currentUser) return;

  const initials = currentUser.name.charAt(0).toUpperCase();
  const name = currentUser.name || 'Admin';
  const role = currentUser.role || 'Admin';

  document.getElementById('headerAvatar').textContent = initials;
  document.getElementById('headerName').textContent = name;
  document.getElementById('headerRole').textContent = role.charAt(0).toUpperCase() + role.slice(1);
}

// Setup event listeners
function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Generate token form
  document.getElementById('generateTokenForm').addEventListener('submit', handleGenerateToken);
}

// Load tokens
async function loadTokens() {
  try {
    const response = await fetch(TOKENS_API, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to load tokens');
    }

    const data = await response.json();
    tokens = data.tokens || [];
    renderTokensTable();
  } catch (error) {
    console.error('Load tokens error:', error);
    showToast('Failed to load tokens', 'danger');
  }
}

// Render tokens table
function renderTokensTable() {
  const tbody = document.getElementById('tokensTableBody');
  tbody.innerHTML = '';

  if (tokens.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          No tokens found. Generate your first token to get started.
        </td>
      </tr>
    `;
    return;
  }

  tokens.forEach(token => {
    const statusBadge = getStatusBadge(token.status);
    const createdDate = new Date(token.created_at).toLocaleDateString();
    const expirationDate = new Date(token.expiration_at).toLocaleDateString();
    const isExpiringSoon = new Date(token.expiration_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="fw-semibold">${token.username}</div>
      </td>
      <td>
        <code class="bg-light px-2 py-1 rounded">${token.domain}</code>
      </td>
      <td>${statusBadge}</td>
      <td>${createdDate}</td>
      <td class="${isExpiringSoon ? 'text-warning' : ''}">${expirationDate}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="viewToken('${token.id}')" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          ${token.status === 'active' ? `
            <button class="btn btn-outline-warning" onclick="deactivateToken('${token.id}')" title="Deactivate">
              <i class="bi bi-pause"></i>
            </button>
          ` : token.status === 'deactivated' ? `
            <button class="btn btn-outline-success" onclick="reactivateToken('${token.id}')" title="Reactivate">
              <i class="bi bi-play"></i>
            </button>
          ` : ''}
          <button class="btn btn-outline-danger" onclick="deleteToken('${token.id}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Get status badge HTML
function getStatusBadge(status) {
  const badges = {
    active: '<span class="badge bg-success">Active</span>',
    deactivated: '<span class="badge bg-warning text-dark">Deactivated</span>',
    expired: '<span class="badge bg-danger">Expired</span>'
  };
  return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

// Update statistics
function updateStats() {
  const total = tokens.length;
  const active = tokens.filter(t => t.status === 'active').length;
  const deactivated = tokens.filter(t => t.status === 'deactivated').length;
  const expired = tokens.filter(t => t.status === 'expired').length;
  
  const expiringSoon = tokens.filter(t => {
    return t.status === 'active' && 
           new Date(t.expiration_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }).length;

  document.getElementById('totalTokens').textContent = total;
  document.getElementById('activeTokens').textContent = active;
  document.getElementById('expiringTokens').textContent = expiringSoon;
  document.getElementById('deactivatedTokens').textContent = deactivated + expired;
}

// Handle logout
async function handleLogout() {
  try {
    await fetch(`${AUTH_API}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/admin/login.html';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/admin/login.html';
  }
}

// Handle generate token
async function handleGenerateToken(e) {
  e.preventDefault();

  const username = document.getElementById('tokenUsername').value;
  const domain = document.getElementById('tokenDomain').value;
  const expirationDays = document.getElementById('tokenExpiration').value;

  const btn = document.getElementById('generateBtn');
  const text = document.getElementById('generateText');
  const spinner = document.getElementById('generateSpinner');

  btn.disabled = true;
  text.textContent = 'Generating...';
  spinner.classList.remove('d-none');

  try {
    const response = await fetch(TOKENS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, domain, expirationDays })
    });

    const data = await response.json();

    if (response.ok) {
      showToast('Token generated successfully!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('generateTokenModal')).hide();
      document.getElementById('generateTokenForm').reset();
      await loadTokens();
      updateStats();
      
      // Show token in a modal for copying
      showGeneratedToken(data.token);
    } else {
      showToast(data.error || 'Failed to generate token', 'danger');
    }
  } catch (error) {
    console.error('Generate token error:', error);
    showToast('Network error. Please try again.', 'danger');
  } finally {
    btn.disabled = false;
    text.textContent = 'Generate Token';
    spinner.classList.add('d-none');
  }
}

// Show generated token
function showGeneratedToken(token) {
  const modal = new bootstrap.Modal(document.getElementById('tokenDetailsModal'));
  const content = document.getElementById('tokenDetailsContent');
  
  content.innerHTML = `
    <div class="mb-3">
      <label class="form-label fw-bold">Generated Token</label>
      <div class="input-group">
        <input type="text" class="form-control" value="${token}" readonly id="generatedTokenInput">
        <button class="btn btn-outline-primary" onclick="copyToken('${token}')">
          <i class="bi bi-clipboard"></i> Copy
        </button>
      </div>
    </div>
    <div class="alert alert-info">
      <i class="bi bi-info-circle me-2"></i>
      Please copy this token now. You won't be able to see it again.
    </div>
  `;
  
  modal.show();
}

// Copy token to clipboard
function copyToken(token) {
  navigator.clipboard.writeText(token).then(() => {
    showToast('Token copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy token', 'danger');
  });
}

// View token details
async function viewToken(tokenId) {
  try {
    const response = await fetch(`${TOKENS_API}/${tokenId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to load token details');
    }

    const data = await response.json();
    const token = data.token;

    const modal = new bootstrap.Modal(document.getElementById('tokenDetailsModal'));
    const content = document.getElementById('tokenDetailsContent');
    
    let tokenSection = '';
    if (token.token_value) {
      tokenSection = `
        <div class="mb-3">
          <label class="form-label fw-bold">JWT Token</label>
          <div class="input-group">
            <input type="text" class="form-control font-monospace" value="${token.token_value}" readonly id="viewTokenInput">
            <button class="btn btn-outline-primary" onclick="copyToken('${token.token_value}')">
              <i class="bi bi-clipboard"></i> Copy
            </button>
          </div>
          <div class="form-text text-muted">Copy this token to use in your API requests.</div>
        </div>
        <hr>
      `;
    }
    
    content.innerHTML = `
      ${tokenSection}
      <div class="mb-3">
        <label class="form-label fw-bold">Username</label>
        <div>${token.username}</div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Domain</label>
        <div><code>${token.domain}</code></div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Status</label>
        <div>${getStatusBadge(token.status)}</div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Issued At</label>
        <div>${new Date(token.issued_at).toLocaleString()}</div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Expiration At</label>
        <div>${new Date(token.expiration_at).toLocaleString()}</div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Usage Count</label>
        <div>${token.usage_count}</div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Last Used</label>
        <div>${token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'Never'}</div>
      </div>
    `;
    
    modal.show();
  } catch (error) {
    console.error('View token error:', error);
    showToast('Failed to load token details', 'danger');
  }
}

// Deactivate token
async function deactivateToken(tokenId) {
  if (!confirm('Are you sure you want to deactivate this token? It will no longer be accepted by the API Gateway.')) {
    return;
  }

  try {
    const response = await fetch(`${TOKENS_API}/${tokenId}/deactivate`, {
      method: 'PUT',
      credentials: 'include'
    });

    if (response.ok) {
      showToast('Token deactivated successfully', 'success');
      await loadTokens();
      updateStats();
    } else {
      const data = await response.json();
      showToast(data.error || 'Failed to deactivate token', 'danger');
    }
  } catch (error) {
    console.error('Deactivate token error:', error);
    showToast('Network error. Please try again.', 'danger');
  }
}

// Reactivate token
async function reactivateToken(tokenId) {
  try {
    const response = await fetch(`${TOKENS_API}/${tokenId}/reactivate`, {
      method: 'PUT',
      credentials: 'include'
    });

    if (response.ok) {
      showToast('Token reactivated successfully', 'success');
      await loadTokens();
      updateStats();
    } else {
      const data = await response.json();
      showToast(data.error || 'Failed to reactivate token', 'danger');
    }
  } catch (error) {
    console.error('Reactivate token error:', error);
    showToast('Network error. Please try again.', 'danger');
  }
}

// Delete token
async function deleteToken(tokenId) {
  if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${TOKENS_API}/${tokenId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) {
      showToast('Token deleted successfully', 'success');
      await loadTokens();
      updateStats();
    } else {
      const data = await response.json();
      showToast(data.error || 'Failed to delete token', 'danger');
    }
  } catch (error) {
    console.error('Delete token error:', error);
    showToast('Network error. Please try again.', 'danger');
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toastId = 'toast-' + Date.now();
  
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', toastHTML);
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();
  
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}
