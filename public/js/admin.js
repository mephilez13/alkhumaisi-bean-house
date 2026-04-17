/* ========================================
   Al-Khumaisi Bean House — Admin Panel Logic
   ======================================== */

const API = '/api';
const AUTH = '/api/auth';
let token = localStorage.getItem('kopi_admin_token');
let adminInfo = JSON.parse(localStorage.getItem('kopi_admin_info') || 'null');

// Format currency
function formatRp(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Toast
function showToast(message, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Auth header
function authHeaders(isJSON = true) {
  const h = { 'Authorization': `Bearer ${token}` };
  if (isJSON) h['Content-Type'] = 'application/json';
  return h;
}

// ========== AUTH ==========
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');

  btn.textContent = 'Memuat...';
  btn.disabled = true;
  errEl.style.display = 'none';

  try {
    const res = await fetch(`${AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Login gagal';
      errEl.style.display = 'block';
      btn.textContent = 'Masuk';
      btn.disabled = false;
      return;
    }

    token = data.token;
    adminInfo = data.admin;
    localStorage.setItem('kopi_admin_token', token);
    localStorage.setItem('kopi_admin_info', JSON.stringify(adminInfo));
    showDashboard();
  } catch (err) {
    errEl.textContent = 'Koneksi gagal';
    errEl.style.display = 'block';
    btn.textContent = 'Masuk';
    btn.disabled = false;
  }
}

function handleLogout() {
  token = null;
  adminInfo = null;
  localStorage.removeItem('kopi_admin_token');
  localStorage.removeItem('kopi_admin_info');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  document.getElementById('adminName').textContent = adminInfo?.name || 'Admin';
  loadProducts();
  loadSettings();
  setupResponsive();
}

// Check token on load
async function checkAuth() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/products`, { headers: authHeaders() });
    if (res.ok) {
      showDashboard();
    } else {
      handleLogout();
    }
  } catch {
    handleLogout();
  }
}

// ========== TABS ==========
function switchTab(tab) {
  const tabs = ['products', 'settings', 'password'];
  const titles = { products: 'Kelola Produk', settings: 'Pengaturan Toko', password: 'Ubah Password' };

  tabs.forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === tab ? 'block' : 'none';
    document.querySelector(`[data-tab="${t}"]`)?.classList.toggle('active', t === tab);
  });
  document.getElementById('pageTitle').textContent = titles[tab] || '';

  // Close sidebar on mobile
  document.getElementById('adminSidebar').classList.remove('open');
}

// ========== PRODUCTS ==========
let allProducts = [];

async function loadProducts() {
  try {
    const res = await fetch(`${API}/products`, { headers: authHeaders() });
    allProducts = await res.json();
    renderProductsTable();
  } catch (err) {
    showToast('Gagal memuat produk', '');
  }
}

function getProductEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('arabica') || n.includes('arabika')) return '☕';
  if (n.includes('robusta')) return '🫘';
  if (n.includes('blend')) return '🍵';
  if (n.includes('drip')) return '📦';
  if (n.includes('liberica') || n.includes('liberika')) return '🌿';
  if (n.includes('excelsa')) return '🌱';
  if (n.includes('gayo')) return '🏔️';
  if (n.includes('toraja')) return '⛰️';
  if (n.includes('luwak')) return '🐾';
  if (n.includes('espresso')) return '☕';
  return '☕';
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (allProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">Belum ada produk</td></tr>';
    return;
  }

  tbody.innerHTML = allProducts.map(p => {
    const emoji = getProductEmoji(p.name);
    const imgHtml = p.image
      ? `<img src="${p.image}" alt="${p.name}">`
      : emoji;

    return `
      <tr>
        <td><div class="product-img-cell">${imgHtml}</div></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>${formatRp(p.price)}/${p.unit}</td>
        <td>${p.stock} ${p.unit}</td>
        <td><span class="status-badge ${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
        <td>
          <button class="action-btn edit" onclick="editProduct(${p.id})">✏️ Edit</button>
          <button class="action-btn delete" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(product = null) {
  document.getElementById('modalTitle').textContent = product ? 'Edit Produk' : 'Tambah Produk';
  document.getElementById('productId').value = product?.id || '';
  document.getElementById('productName').value = product?.name || '';
  document.getElementById('productCategory').value = product?.category || 'Arabica';
  document.getElementById('productUnit').value = product?.unit || 'gr';
  document.getElementById('productPrice').value = product?.price || '';
  document.getElementById('productStock').value = product?.stock ?? 0;
  document.getElementById('productDescription').value = product?.description || '';
  document.getElementById('productSort').value = product?.sort_order ?? 0;
  document.getElementById('productActive').value = product?.is_active ?? 1;
  document.getElementById('productImage').value = '';

  const currentImg = document.getElementById('currentImage');
  if (product?.image) {
    currentImg.innerHTML = `<img src="${product.image}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">`;
  } else {
    currentImg.innerHTML = '';
  }

  document.getElementById('productModal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
}

function editProduct(id) {
  const product = allProducts.find(p => p.id === id);
  if (product) openProductModal(product);
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('productName').value);
  formData.append('category', document.getElementById('productCategory').value);
  formData.append('unit', document.getElementById('productUnit').value);
  formData.append('price', document.getElementById('productPrice').value);
  formData.append('stock', document.getElementById('productStock').value);
  formData.append('description', document.getElementById('productDescription').value);
  formData.append('sort_order', document.getElementById('productSort').value);
  formData.append('is_active', document.getElementById('productActive').value);

  const imageFile = document.getElementById('productImage').files[0];
  if (imageFile) formData.append('image', imageFile);

  try {
    const url = id ? `${API}/products/${id}` : `${API}/products`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      showToast(id ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!', 'success');
      closeProductModal();
      loadProducts();
    } else {
      const err = await res.json();
      showToast(err.error || 'Gagal menyimpan', '');
    }
  } catch (err) {
    showToast('Koneksi gagal', '');
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Hapus produk "${name}"?`)) return;

  try {
    const res = await fetch(`${API}/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      showToast('Produk berhasil dihapus', 'success');
      loadProducts();
    }
  } catch (err) {
    showToast('Gagal menghapus produk', '');
  }
}

// ========== SETTINGS ==========
async function loadSettings() {
  try {
    const res = await fetch(`${API}/settings`, { headers: authHeaders() });
    const settings = await res.json();

    const fields = [
      'store_name', 'store_tagline', 'store_description', 'store_address',
      'whatsapp_number', 'delivery_areas', 'operating_hours',
      'payment_bank_name', 'payment_bank_account', 'payment_bank_holder',
      'payment_ovo', 'payment_dana'
    ];

    fields.forEach(f => {
      const el = document.getElementById(`set_${f}`);
      if (el) el.value = settings[f] || '';
    });
  } catch (err) {
    showToast('Gagal memuat pengaturan', '');
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const fields = [
    'store_name', 'store_tagline', 'store_description', 'store_address',
    'whatsapp_number', 'delivery_areas', 'operating_hours',
    'payment_bank_name', 'payment_bank_account', 'payment_bank_holder',
    'payment_ovo', 'payment_dana'
  ];

  const data = {};
  fields.forEach(f => {
    const el = document.getElementById(`set_${f}`);
    if (el) data[f] = el.value;
  });

  try {
    const res = await fetch(`${API}/settings`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (res.ok) {
      showToast('Pengaturan berhasil disimpan!', 'success');
    }
  } catch (err) {
    showToast('Gagal menyimpan pengaturan', '');
  }
}

// ========== PASSWORD ==========
async function changePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('Password baru tidak cocok!', '');
    return;
  }

  try {
    const res = await fetch(`${AUTH}/change-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();

    if (res.ok) {
      showToast('Password berhasil diubah!', 'success');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } else {
      showToast(data.error || 'Gagal mengubah password', '');
    }
  } catch (err) {
    showToast('Koneksi gagal', '');
  }
}

// ========== RESPONSIVE ==========
function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

function setupResponsive() {
  const toggle = document.getElementById('sidebarToggle');
  if (window.innerWidth <= 768) {
    toggle.style.display = 'flex';
  }
  window.addEventListener('resize', () => {
    toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  });
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', checkAuth);
