const detailShell = document.querySelector('#productDetailShell');
const logoutButton = document.querySelector('#logoutBtn');

const storeLogoMap = {
  amazon: '../assets/store-logos/amazon.svg',
  flipkart: '../assets/store-logos/flipkart.svg',
  myntra: '../assets/store-logos/myntra.svg',
  nykaa: '../assets/store-logos/nykaa.svg',
  croma: '../assets/store-logos/croma.svg',
  ajio: '../assets/store-logos/ajio.svg',
  apollo: '../assets/store-logos/apollo-pharmacy.svg',
  pharmeasy: '../assets/store-logos/pharmeasy.svg',
  reliancedigital: '../assets/store-logos/reliance-digital.svg',
  tata1mg: '../assets/store-logos/tata-1mg.svg',
  netmeds: '../assets/store-logos/netmeds.svg',
  meesho: '../assets/store-logos/meesho.svg',
  purplle: '../assets/store-logos/purplle.svg',
  tira: '../assets/store-logos/tira.svg',
  vijaysales: '../assets/store-logos/vijay-sales.svg'
};

const storeNames = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  myntra: 'Myntra',
  ajio: 'AJIO',
  meesho: 'Meesho',
  nykaa: 'Nykaa',
  purplle: 'Purplle',
  tira: 'Tira',
  apollo: 'Apollo Pharmacy',
  pharmeasy: 'PharmEasy',
  tata1mg: 'Tata 1mg',
  netmeds: 'Netmeds',
  reliancedigital: 'Reliance Digital',
  croma: 'Croma',
  vijaysales: 'Vijay Sales'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || ''), window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch (_) {
    return '#';
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0).replace('₹', '₹\u202F');
}

function storeKey(store) {
  return String(store || '').toLowerCase().replace(/\s+/g, '');
}

function storeName(store) {
  const key = storeKey(store);
  return storeNames[key] || store || 'Store';
}

function renderStoreLogo(store) {
  const key = storeKey(store);
  const logo = storeLogoMap[key];
  const label = escapeAttr(storeName(store));

  if (logo) {
    return `<span class="mini-logo"><img src="${logo}" alt="${label} logo" loading="lazy"></span>`;
  }

  return `<span class="mini-logo logo-fallback" aria-label="${label}">${escapeHtml(String(store || '').slice(0, 2).toUpperCase())}</span>`;
}

function getFinalPrice(store) {
  return Number(store.finalPayablePrice || store.currentPrice || store.listingPrice || 0);
}

function getListingPrice(store) {
  return Number(store.listingPrice || store.currentPrice || store.finalPayablePrice || 0);
}

function renderOfferList(offers) {
  const list = Array.isArray(offers) ? offers.filter(Boolean).slice(0, 8) : [];
  if (!list.length) return '<span class="offer-empty">No visible public offers</span>';

  return list
    .map((offer) => `<div class="offer-item"><span class="offer-icon">+</span><span>${escapeHtml(offer)}</span></div>`)
    .join('');
}

function renderSpecGrid(group) {
  const stores = Array.isArray(group.stores) ? group.stores : [];
  const highestRating = Math.max(0, ...stores.map((store) => Number(store.rating) || 0));
  const totalReviews = stores.reduce((sum, store) => sum + (Number(store.reviewCount) || 0), 0);
  const specs = [
    ['Brand', group.brand || ''],
    ['Category', group.category || ''],
    ['Variant', group.variant || ''],
    ['Stores compared', stores.length ? String(stores.length) : ''],
    ['Highest rating', highestRating ? highestRating.toFixed(1) : ''],
    ['Review count', totalReviews ? totalReviews.toLocaleString('en-IN') : '']
  ].filter(([, value]) => value);

  if (!specs.length) return '<p class="offer-empty">Specifications will appear when stores publish them in search results.</p>';

  return specs.map(([label, value]) => `
    <div class="detail-spec">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function renderStoreRows(stores) {
  if (!stores.length) return '<p class="offer-empty">No store comparison is available for this product.</p>';

  return stores.map((store, index) => {
    const isBest = store.isBestDeal || index === 0;
    const name = storeName(store.platform);
    const listing = getListingPrice(store);
    const final = getFinalPrice(store);
    const savings = Math.max(0, Number(store.totalSavings || 0));
    const productUrl = safeExternalUrl(store.productUrl);

    return `
      <article class="detail-store-row ${isBest ? 'best-store' : ''}">
        <div class="detail-store-main">
          ${renderStoreLogo(store.platform)}
          <div>
            <h3>${escapeHtml(name)}</h3>
            ${isBest ? '<span class="best-deal-badge">Best Deal</span>' : ''}
            <p>${store.availability === false ? 'Out of stock' : 'In stock'}${store.rating ? ` | ${Number(store.rating).toFixed(1)} rating` : ''}</p>
          </div>
        </div>
        <div class="detail-store-price">
          <span>Listed at ${formatCurrency(listing)}</span>
          <strong>${formatCurrency(final)}</strong>
          ${savings ? `<em>Save ${formatCurrency(savings)}</em>` : ''}
        </div>
        <div class="detail-store-offers">
          ${renderOfferList(store.offers)}
        </div>
        <a class="store-buy-btn ${isBest ? 'primary-buy-btn' : 'secondary-buy-btn'}"
           href="${productUrl}"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="Buy from ${escapeAttr(name)}">Buy Now</a>
      </article>
    `;
  }).join('');
}

function renderMissingState() {
  detailShell.innerHTML = `
    <div class="empty-state detail-empty-state">
      <h1>No product selected</h1>
      <p>Open a product from the latest search results to view its store comparison.</p>
      <a class="store-buy-btn primary-buy-btn detail-home-link" href="../index.html">Back to Search</a>
    </div>
  `;
}

function renderDetail(group) {
  const stores = Array.isArray(group.stores) ? group.stores : [];
  const best = group.bestDeal || stores[0] || {};
  const imageUrl = safeExternalUrl(group.image);
  const productName = group.productName || 'Product';

  detailShell.innerHTML = `
    <div class="detail-hero">
      <div class="detail-media">
        ${imageUrl !== '#'
          ? `<img src="${imageUrl}" alt="${escapeAttr(productName)}" loading="lazy">`
          : '<div class="detail-image-fallback">PricePilot</div>'}
      </div>
      <div class="detail-summary">
        <p class="eyebrow">${escapeHtml(group.category || 'Product')}</p>
        <h1>${escapeHtml(productName)}</h1>
        ${group.brand ? `<p class="product-card-brand">${escapeHtml(group.brand)}</p>` : ''}
        <div class="product-best-price">
          <span class="best-price-label">Best price from</span>
          <span class="best-price-store">${escapeHtml(storeName(best.platform))}</span>
          <span class="best-price-value">${formatCurrency(group.lowestFinalPrice || getFinalPrice(best))}</span>
        </div>
        <div class="detail-spec-grid">${renderSpecGrid(group)}</div>
      </div>
    </div>

    <section class="detail-section">
      <div class="section-heading compact">
        <p class="eyebrow">Store comparison</p>
        <h2>Available public offers and final payable prices.</h2>
      </div>
      <div class="detail-store-list">${renderStoreRows(stores)}</div>
    </section>
  `;
}

function boot() {
  const raw = sessionStorage.getItem('pricepilotSelectedProductGroup');
  if (!raw) {
    renderMissingState();
    return;
  }

  try {
    renderDetail(JSON.parse(raw));
  } catch (_) {
    renderMissingState();
  }
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('pricepilotLoggedIn');
    sessionStorage.removeItem('pricepilotUserEmail');
    window.location.href = '../login/index.html';
  });
}

boot();
