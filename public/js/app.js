/* ========================================
   Al-Khumaisi Bean House — Frontend App Logic
   ======================================== */

// State
let products = [];
let settings = {};
let cart = JSON.parse(localStorage.getItem('kopi_cart') || '[]');
let activeCategory = 'all';

// Format currency
function formatRp(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Toast notification
function showToast(message, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== DATA LOADING ==========
async function loadData() {
  try {
    const [prodRes, setRes] = await Promise.all([
      fetch('/api/public/products'),
      fetch('/api/public/settings')
    ]);
    products = await prodRes.json();
    settings = await setRes.json();
    applySettings();
    renderCategories();
    renderProducts();
    renderPaymentMethods();
    updateCartUI();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

function applySettings() {
  const s = settings;
  // Nav & footer store name
  const storeName = s.store_name || 'Al-Khumaisi Bean House';
  document.getElementById('navStoreName').textContent = storeName;
  document.getElementById('footerStoreName').textContent = storeName;
  document.getElementById('footerCopyright').textContent = storeName;
  document.title = `${storeName} — Biji Kopi Premium`;

  // Hero
  if (s.store_tagline) {
    const parts = s.store_tagline.split(',');
    document.getElementById('heroTitle').innerHTML =
      `${parts[0].trim()} <span>${parts[1]?.trim() || ''}</span>${parts.length > 2 ? '<br>' + parts.slice(2).join(', ') : ''}`;
  }
  if (s.store_description) {
    document.getElementById('heroSubtitle').textContent = s.store_description;
  }

  // Info
  document.getElementById('infoDeliveryAreas').textContent = s.delivery_areas || '-';
  document.getElementById('infoOperatingHours').textContent = s.operating_hours || '-';
  document.getElementById('infoAddress').textContent = s.store_address || '-';
  document.getElementById('footerDesc').textContent = s.store_description || '';
  
  // Footer WA link
  const waNum = s.whatsapp_number || '6281234567890';
  document.getElementById('footerWaLink').href = `https://wa.me/${waNum}`;
  document.getElementById('footerAddress').textContent = '📍 ' + (s.store_address || '-');
}

// ========== CATEGORIES ==========
function renderCategories() {
  const cats = ['all', ...new Set(products.map(p => p.category))];
  const container = document.getElementById('categoryFilter');
  container.innerHTML = cats.map(c =>
    `<button class="cat-btn ${c === activeCategory ? 'active' : ''}" onclick="filterCategory('${c}')">
      ${c === 'all' ? '☕ Semua' : c}
    </button>`
  ).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  renderCategories();
  renderProducts();
}

// ========== PRODUCTS ==========
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
  if (n.includes('cold brew')) return '🧊';
  return '☕';
}

function renderProducts() {
  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const grid = document.getElementById('productGrid');
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">Belum ada produk tersedia</p>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(c => c.id === p.id);
    const qty = inCart ? inCart.qty : 0;
    const emoji = getProductEmoji(p.name);
    const stockLow = p.stock < 10;
    const imgHtml = p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
      : emoji;

    return `
      <div class="product-card" id="product-${p.id}">
        <div class="product-card-img">
          ${imgHtml}
          <span class="product-card-category">${p.category}</span>
        </div>
        <div class="product-card-body">
          <h3 class="product-card-name">${p.name}</h3>
          <p class="product-card-desc">${p.description || ''}</p>
          <div class="product-card-footer">
            <div class="product-price">${formatRp(p.price)} <small>/${p.unit}</small></div>
            <div class="product-qty">
              ${qty > 0 ? `
                <button class="qty-btn qty-btn-minus" onclick="updateCart(${p.id}, -1)">−</button>
                <span class="qty-value">${qty}</span>
              ` : ''}
              <button class="qty-btn qty-btn-plus" onclick="updateCart(${p.id}, 1)">+</button>
            </div>
          </div>
          <div class="product-stock">
            <span class="stock-dot ${stockLow ? 'low' : ''}"></span>
            ${stockLow ? `Stok terbatas (${p.stock} ${p.unit})` : `Stok tersedia`}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ========== CART ==========
function updateCart(productId, delta) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(c => c.id === productId);
  if (existing) {
    existing.qty += delta;
    if (existing.qty <= 0) {
      cart = cart.filter(c => c.id !== productId);
    }
  } else if (delta > 0) {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image: product.image || '',
      qty: 1
    });
    showToast(`${product.name} ditambahkan ke keranjang`, 'success');
  }

  saveCart();
  renderProducts();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('kopi_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalPrice = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);

  // Badges
  const badge = document.getElementById('cartBadge');
  const floatingBadge = document.getElementById('floatingBadge');
  badge.textContent = totalItems;
  floatingBadge.textContent = totalItems;
  badge.classList.toggle('show', totalItems > 0);

  // Floating cart
  document.getElementById('floatingCart').classList.toggle('show', totalItems > 0);

  // Cart total
  document.getElementById('cartTotal').textContent = formatRp(totalPrice);
  document.getElementById('cartWaBtn').disabled = totalItems === 0;

  // Cart items
  const container = document.getElementById('cartItems');
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Keranjang masih kosong</p>
        <p style="font-size:0.8rem;margin-top:4px;">Yuk pilih kopi favoritmu!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map(item => {
    const emoji = getProductEmoji(item.name);
    const iconHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}">`
      : emoji;
    return `
      <div class="cart-item">
        <div class="cart-item-icon">${iconHtml}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatRp(item.price)}/${item.unit}</div>
        </div>
        <div class="cart-item-qty">
          <button class="ci-minus" onclick="updateCart(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button class="ci-plus" onclick="updateCart(${item.id}, 1)">+</button>
        </div>
        <div class="cart-item-subtotal">${formatRp(item.price * item.qty)}</div>
      </div>
    `;
  }).join('');
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

// ========== WHATSAPP ORDER ==========
function orderViaWhatsApp() {
  if (cart.length === 0) return;

  const waNum = settings.whatsapp_number || '6281234567890';
  const storeName = settings.store_name || 'Al-Khumaisi Bean House';
  const total = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);

  let message = `Halo ${storeName}! ☕\nSaya mau pesan:\n\n`;

  cart.forEach((item, i) => {
    message += `${i + 1}. ${item.name}\n`;
    message += `   ${item.qty} ${item.unit} × ${formatRp(item.price)} = ${formatRp(item.price * item.qty)}\n`;
  });

  message += `\n💰 *Total: ${formatRp(total)}*\n`;
  message += `\nMohon konfirmasi dan info pengiriman ya. Terima kasih! 🙏`;

  const url = `https://wa.me/${waNum}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');

  showToast('Redirecting ke WhatsApp...', 'success');
}

// ========== PAYMENT METHODS ==========
function renderPaymentMethods() {
  const s = settings;
  const methods = [];

  if (s.payment_bank_name) {
    methods.push({
      icon: '🏦',
      title: `Transfer ${s.payment_bank_name}`,
      detail: `<span class="mono">${s.payment_bank_account || '-'}</span>`,
      sub: `a/n ${s.payment_bank_holder || '-'}`
    });
  }
  if (s.payment_dana) {
    methods.push({ icon: '💙', title: 'Dana', detail: `<span class="mono">${s.payment_dana}</span>`, sub: '' });
  }

  // Always show at least bank
  if (methods.length === 0) {
    methods.push({ icon: '🏦', title: 'Transfer Bank', detail: 'Hubungi kami untuk info rekening', sub: '' });
  }

  document.getElementById('paymentMethods').innerHTML = methods.map(m => `
    <div class="payment-card">
      <div class="payment-icon">${m.icon}</div>
      <div class="payment-info">
        <h4>${m.title}</h4>
        <p>${m.detail}</p>
        ${m.sub ? `<p>${m.sub}</p>` : ''}
      </div>
    </div>
  `).join('');
}

// ========== NAVBAR ==========
function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// Close mobile nav on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', loadData);
