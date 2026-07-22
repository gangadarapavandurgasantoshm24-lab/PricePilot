/**
 * PricePilot Frontend – Phase 2
 *
 * Phase 2 additions:
 *  ✓ Intelligent Product Cards — grouped card with per-store offer rows
 *  ✓ Per-store offer display — bank offers, coupons, cashback, free delivery
 *  ✓ "Lowest Possible Price*" calculated from offer deductions
 *  ✓ 🏆 Best Deal badge on the cheapest store within each product card
 *  ✓ Variant chips (128GB, Blue, etc.) displayed below product name
 *  ✓ Product detail page link (click product image/name to open detail)
 *  ✓ Enhanced comparison table driven by groupedProducts
 *  ✓ Animated progress: real-time provider status chips
 *  ✓ Improved empty/loading/error states with skeleton cards
 *
 * Week 1-6 features retained:
 *  ✓ Search Progress Panel – per-provider chips with animated spinner
 *  ✓ Pagination controls – Prev/Next with page indicator + total count
 *  ✓ Browser Status Row – GET /api/browser metrics in health panel
 *  ✓ Strategy badge coloring – official-api=green, playwright=purple, mock=amber
 *  ✓ Filter/sort controls (8 dimensions)
 *  ✓ Provider Health Dashboard
 *  ✓ Category selector bar
 */

// ─── API config ───────────────────────────────────────────────────────────────

const API_BASE_URLS = [
  '/api',
  'http://localhost:5000/api',
  'http://127.0.0.1:5000/api'
];

// ─── DOM references ───────────────────────────────────────────────────────────

const searchForm        = document.querySelector('#searchForm');
const searchInput       = document.querySelector('#searchInput');
const productResults    = document.querySelector('#productResults');
const relatedProductsSection = document.querySelector('#relatedProductsSection');
const relatedProducts   = document.querySelector('#relatedProducts');
const comparisonResults = document.querySelector('#comparisonResults');
const resultStatus      = document.querySelector('#resultStatus');

// Filter controls
const filterSort         = document.querySelector('#filterSort');
const filterPlatform     = document.querySelector('#filterPlatform');
const filterMinPrice     = document.querySelector('#filterMinPrice');
const filterMaxPrice     = document.querySelector('#filterMaxPrice');
const filterBrand        = document.querySelector('#filterBrand');
const filterMinRating    = document.querySelector('#filterMinRating');
const filterAvailability = document.querySelector('#filterAvailability');
const applyFiltersBtn    = document.querySelector('#applyFiltersBtn');
const clearFiltersBtn    = document.querySelector('#clearFiltersBtn');

// Provider health panel
const providerHealthToggle  = document.querySelector('#providerHealthToggle');
const providerHealthBody    = document.querySelector('#providerHealthBody');
const providerHealthSummary = document.querySelector('#providerHealthSummary');
const providerHealthLoading = document.querySelector('#providerHealthLoading');
const providerGrid          = document.querySelector('#providerGrid');

// Search progress
const searchProgressPanel = document.querySelector('#searchProgressPanel');
const progressChips       = document.querySelector('#progressChips');

// Pagination
const paginationBar  = document.querySelector('#paginationBar');
const paginationInfo = document.querySelector('#paginationInfo');
const prevPageBtn    = document.querySelector('#prevPageBtn');
const nextPageBtn    = document.querySelector('#nextPageBtn');
const pageIndicator  = document.querySelector('#pageIndicator');

// Browser status
const browserStatusRow = document.querySelector('#browserStatusRow');
const bpAvailable      = document.querySelector('#bpAvailable');
const bpBrowsers       = document.querySelector('#bpBrowsers');
const bpPages          = document.querySelector('#bpPages');
const bpQueue          = document.querySelector('#bpQueue');
const bpUptime         = document.querySelector('#bpUptime');

// Category bar
const categoryBar      = document.querySelector('#categoryBar');
const categoryLabelBar = document.querySelector('#categoryLabelBar');

// ─── Store logo map ───────────────────────────────────────────────────────────

const storeLogoMap = {
  amazon:          'assets/store-logos/amazon.svg',
  flipkart:        'assets/store-logos/flipkart.svg',
  myntra:          'assets/store-logos/myntra.svg',
  nykaa:           'assets/store-logos/nykaa.svg',
  croma:           'assets/store-logos/croma.svg',
  ajio:            'assets/store-logos/ajio.svg',
  apollo:          'assets/store-logos/apollo-pharmacy.svg',
  apollopharmacy:  'assets/store-logos/apollo-pharmacy.svg',
  pharmeasy:       'assets/store-logos/pharmeasy.svg',
  tatacliq:        'assets/store-logos/tatacliq.svg',
  reliancedigital: 'assets/store-logos/reliance-digital.svg',
  tata1mg:         'assets/store-logos/tata-1mg.svg',
  netmeds:         'assets/store-logos/netmeds.svg',
  meesho:          'assets/store-logos/meesho.svg',
  purplle:         'assets/store-logos/purplle.svg',
  tira:            'assets/store-logos/tira.svg',
  vijaysales:      'assets/store-logos/vijay-sales.svg'
};

// ─── Category definitions ─────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  '':           { emoji: '🔍', label: 'All Categories' },
  electronics:  { emoji: '📱', label: 'Electronics' },
  fashion:      { emoji: '👗', label: 'Fashion' },
  beauty:       { emoji: '💄', label: 'Beauty' },
  medicine:     { emoji: '💊', label: 'Medicine' },
  home:         { emoji: '🏠', label: 'Home' },
  groceries:    { emoji: '🛒', label: 'Groceries' }
};

// ─── App state ────────────────────────────────────────────────────────────────

const state = {
  currentQuery:    '',
  currentPage:     1,
  currentLimit:    20,
  currentCategory: '',
  totalResults:    0,
  hasNextPage:     false,
  lastGroupedProducts: []
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path) {
  for (const base of API_BASE_URLS) {
    try {
      const response = await fetch(`${base}${path}`);
      if (response.ok) return response;
    } catch (_) { /* try next */ }
  }
  throw new Error('Backend unreachable. Make sure pricepilot-backend is running (npm start).');
}

// ─── Query string builder ────────────────────────────────────────────────────

function buildQueryString(query, page = 1) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('page', page);
  params.set('limit', state.currentLimit);

  if (state.currentCategory) params.set('category', state.currentCategory);

  const sortBy       = filterSort.value;
  const platform     = filterPlatform.value;
  const minPrice     = filterMinPrice.value;
  const maxPrice     = filterMaxPrice.value;
  const brand        = filterBrand.value.trim();
  const minRating    = filterMinRating.value;
  const availability = filterAvailability.value;

  if (sortBy)       params.set('sortBy',       sortBy);
  if (platform)     params.set('platform',     platform);
  if (minPrice)     params.set('minPrice',     minPrice);
  if (maxPrice)     params.set('maxPrice',     maxPrice);
  if (brand)        params.set('brand',        brand);
  if (minRating)    params.set('minRating',    minRating);
  if (availability) params.set('availability', availability);

  return params.toString();
}

function resetFilters() {
  filterSort.value         = 'lowestPrice';
  filterPlatform.value     = '';
  filterMinPrice.value     = '';
  filterMaxPrice.value     = '';
  filterBrand.value        = '';
  filterMinRating.value    = '';
  filterAvailability.value = '';
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(v || 0).replace('₹', '₹\u202F');

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

const getStoreKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');

const getProductTitle   = (p) => p.productName || p.title || 'Product';
const getProductStore   = (p) => p.platform || p.store || 'Store';
const getListingPrice   = (p) => p.currentPrice || p.listingPrice || p.productPrice || p.finalPayablePrice || 0;
const getCharge         = (p, k) => Number(p[k] || 0);
const getTotalSavings   = (p) => p.totalSavings || getCharge(p, 'bankOffer') + getCharge(p, 'couponDiscount') + getCharge(p, 'cashback');
const getProductUrl     = (p) => p.productUrl || p.productURL || '#';
const getReviewCount    = (p) => p.reviewCount || p.reviews || 0;
const getStores         = (group) => Array.isArray(group.stores) ? group.stores : [];

function getFinalPayablePrice(p) {
  if (p.finalPayablePrice !== undefined && p.finalPayablePrice > 0) return p.finalPayablePrice;
  return Math.max(0,
    getListingPrice(p) + getCharge(p, 'gst') + getCharge(p, 'shipping')
    - getCharge(p, 'bankOffer') - getCharge(p, 'couponDiscount')
    - getCharge(p, 'cashback') - getCharge(p, 'walletOffer')
  );
}

function getDiscountPercent(p) {
  if (p.discountPercentage !== undefined) return p.discountPercentage;
  const s = getTotalSavings(p);
  const l = getListingPrice(p);
  return l ? Math.max(0, Math.round((s / l) * 100)) : 0;
}

// ─── Store display name map ───────────────────────────────────────────────────

const STORE_DISPLAY_NAMES = {
  amazon:          'Amazon',
  flipkart:        'Flipkart',
  myntra:          'Myntra',
  ajio:            'AJIO',
  meesho:          'Meesho',
  nykaa:           'Nykaa',
  purplle:         'Purplle',
  tira:            'Tira',
  apollo:          'Apollo Pharmacy',
  pharmeasy:       'PharmEasy',
  tata1mg:         'Tata 1mg',
  netmeds:         'Netmeds',
  reliancedigital: 'Reliance Digital',
  croma:           'Croma',
  vijaysales:      'Vijay Sales'
};

const getStoreName = (key) => STORE_DISPLAY_NAMES[getStoreKey(key)] || key;

// ─── Badge renderers ──────────────────────────────────────────────────────────

function renderSourceBadge(source, strategy) {
  const src = source || strategy || 'mock';
  if (src === 'official-api')
    return `<span class="badge source-api">✓ Official API</span>`;
  if (src === 'playwright')
    return `<span class="badge" style="background:rgba(124,58,237,.12);color:#7c3aed">🎭 Live</span>`;
  if (src === 'mock-fallback')
    return `<span class="badge source-mock">⚡ Fallback</span>`;
  return '';
}

const renderRatingBadge = (r) =>
  r ? `<span class="badge rating">★ ${Number(r).toFixed(1)}</span>` : '';

const renderAvailabilityChip = (available) =>
  available === false
    ? `<span class="availability-chip out-of-stock">⊘ Out of stock</span>`
    : `<span class="availability-chip in-stock">✓ In Stock</span>`;

function renderStoreLogo(store, cls) {
  const logo = storeLogoMap[getStoreKey(store)];
  const safeStore = escapeAttr(store || 'Store');
  if (logo) return `<span class="${cls}"><img src="${logo}" alt="${safeStore} logo" loading="lazy"></span>`;
  return `<span class="${cls} logo-fallback" aria-label="${safeStore}">${escapeHtml(String(store || '').slice(0, 2).toUpperCase())}</span>`;
}

const renderCategoryBadge = (cat) =>
  cat ? `<span class="category-badge">${escapeHtml(cat)}</span>` : '';

const renderDeliveryChip = (days) =>
  days ? `<span class="delivery-chip">🚚 ${days === 1 ? 'Tomorrow' : `${days} days`}</span>` : '';

const renderReviews = (count) =>
  count > 0 ? `<span class="review-count-chip">(${count.toLocaleString('en-IN')} reviews)</span>` : '';

// ─── Phase 2: Offer list renderer ────────────────────────────────────────────

function renderOfferList(offers) {
  const list = Array.isArray(offers) ? offers.filter(Boolean).slice(0, 5) : [];
  if (!list.length) return '<span class="offer-empty">No visible public offers</span>';

  return list.map(offer => {
    // Determine offer icon based on content
    let icon = '🏷️';
    const lower = offer.toLowerCase();
    if (/bank|hdfc|sbi|icici|axis|kotak/.test(lower)) icon = '🏦';
    else if (/cashback/.test(lower)) icon = '💰';
    else if (/coupon|code|promo/.test(lower)) icon = '🎟️';
    else if (/free delivery|free shipping/.test(lower)) icon = '🚚';
    else if (/emi/.test(lower)) icon = '📅';
    else if (/exchange/.test(lower)) icon = '🔄';
    else if (/first order|new user/.test(lower)) icon = '🎁';
    else if (/installation/.test(lower)) icon = '🔧';
    else if (/upi/.test(lower)) icon = '📱';

    return `<div class="offer-item"><span class="offer-icon">${icon}</span><span>${escapeHtml(offer)}</span></div>`;
  }).join('');
}

// ─── Phase 2: Intelligent grouped product cards ───────────────────────────────

function renderGroupedProductCards(groups) {
  if (!groups || groups.length === 0) return;

  productResults.innerHTML = groups.map((group, groupIndex) => {
    const stores = getStores(group);
    const best = group.bestDeal || stores[0] || {};
    const hasMultipleStores = stores.length > 1;
    const safeGroupName = escapeHtml(group.productName || 'Product');
    const safeGroupNameAttr = escapeAttr(group.productName || 'Product');
    const detailHref = 'product/index.html';

    // Variant chip
    const variantChip = group.variant
      ? `<span class="variant-chip">📦 ${escapeHtml(group.variant)}</span>`
      : '';

    // Store comparison rows
    const storeRows = stores.map((store, idx) => {
      const isBest = store.isBestDeal || idx === 0;
      const finalPrice = getFinalPayablePrice(store);
      const listingP = getListingPrice(store);
      const savings = getTotalSavings(store);
      const productUrl = safeExternalUrl(getProductUrl(store));
      const hasOffers = Array.isArray(store.offers) && store.offers.length > 0;
      const storeName = getStoreName(store.platform);
      const safeStoreName = escapeHtml(storeName);
      const safeStoreNameAttr = escapeAttr(storeName);

      return `
        <div class="store-offer-row ${isBest ? 'best-store' : ''}" id="store-row-${groupIndex}-${idx}">
          <div class="store-offer-header">
            ${renderStoreLogo(store.platform, 'mini-logo')}
            <div class="store-offer-meta">
              <strong class="store-name">${safeStoreName}</strong>
              ${isBest ? '<span class="best-deal-badge">🏆 Best Deal</span>' : ''}
              <div class="store-badges">
                ${renderAvailabilityChip(store.availability)}
                ${renderRatingBadge(store.rating)}
                ${store.reviewCount > 0 ? renderReviews(store.reviewCount) : ''}
              </div>
            </div>
            <div class="store-price-summary">
              <div class="store-listing-price">
                ${listingP > 0 ? `<span class="listing-label">Listed at</span> <span class="listing-value">${formatCurrency(listingP)}</span>` : ''}
              </div>
              <div class="store-final-price">
                <span class="final-label">Lowest Price</span>
                <span class="final-value">${formatCurrency(finalPrice)}</span>
                ${savings > 0 ? `<span class="savings-note">Save ${formatCurrency(savings)}</span>` : ''}
              </div>
            </div>
          </div>
          ${hasOffers ? `
          <div class="store-offer-body">
            <div class="offer-heading">Available Offers</div>
            <div class="offer-list-grid">${renderOfferList(store.offers)}</div>
            ${savings > 0 ? `<div class="price-footnote">*Lowest possible price when applicable offers are used</div>` : ''}
          </div>` : ''}
          <div class="store-offer-footer">
            <a class="store-buy-btn ${isBest ? 'primary-buy-btn' : 'secondary-buy-btn'}"
               href="${productUrl}" target="_blank" rel="noopener noreferrer"
               id="buy-${groupIndex}-${idx}"
               aria-label="Buy ${safeGroupNameAttr} from ${safeStoreNameAttr}">
              ${isBest ? '🛒 Buy Now — Best Price' : 'Buy from ' + safeStoreName}
            </a>
          </div>
        </div>`;
    }).join('');

    return `
      <article class="product-card grouped-product-card" id="product-group-${groupIndex}">
        <div class="product-card-top">
          ${group.image
            ? `<a class="product-image-wrap product-detail-link"
                  href="${detailHref}"
                  data-product-detail-index="${groupIndex}"
                  aria-label="Open ${safeGroupNameAttr}">
                <img src="${safeExternalUrl(group.image)}" alt="${safeGroupNameAttr}" loading="lazy" class="product-main-img">
               </a>`
            : ''}
          <div class="product-card-info">
            <div class="product-badge-row">
              ${renderCategoryBadge(group.category)}
              ${variantChip}
              ${hasMultipleStores
                ? `<span class="stores-count-badge">🏪 ${stores.length} stores</span>`
                : ''}
            </div>
            <h3 class="product-card-title">
              <a class="product-detail-link" href="${detailHref}" data-product-detail-index="${groupIndex}">
                ${safeGroupName}
              </a>
            </h3>
            ${group.brand ? `<p class="product-card-brand">${escapeHtml(group.brand)}</p>` : ''}
            <div class="product-best-price">
              <span class="best-price-label">Best price from</span>
              <span class="best-price-store">${escapeHtml(getStoreName(best.platform))}</span>
              <span class="best-price-value">${formatCurrency(group.lowestFinalPrice || getFinalPayablePrice(best))}</span>
            </div>
          </div>
        </div>
        <div class="store-comparison-list">
          ${storeRows || '<p class="offer-empty">No store comparison available yet.</p>'}
        </div>
      </article>`;
  }).join('');
}

function renderRelatedProducts(groups) {
  const relatedGroups = Array.isArray(groups) ? groups.slice(0, 6) : [];
  if (!relatedProductsSection || !relatedProducts) return;

  if (!relatedGroups.length) {
    relatedProductsSection.hidden = true;
    relatedProducts.innerHTML = '';
    return;
  }

  relatedProductsSection.hidden = false;
  relatedProducts.innerHTML = relatedGroups.map((group) => {
    const stores = getStores(group);
    const best = group.bestDeal || stores[0] || {};
    const imageUrl = safeExternalUrl(group.image);
    return `
      <article class="related-product-card">
        ${imageUrl !== '#' ? `<img src="${imageUrl}" alt="${escapeAttr(group.productName || 'Related product')}" loading="lazy">` : ''}
        <div>
          <h3>${escapeHtml(group.productName || 'Related product')}</h3>
          <p>${escapeHtml(group.brand || getStoreName(best.platform) || 'Similar match')}</p>
          <strong>${formatCurrency(group.lowestFinalPrice || getFinalPayablePrice(best))}</strong>
          <span>${stores.length} store${stores.length === 1 ? '' : 's'}</span>
        </div>
      </article>
    `;
  }).join('');
}

// ─── Plain product cards (fallback when no groups) ────────────────────────────

function renderProductCards(products) {
  productResults.innerHTML = products.map((p, index) => {
    const safeTitle = escapeHtml(getProductTitle(p));
    const safeTitleAttr = escapeAttr(getProductTitle(p));
    const productUrl = safeExternalUrl(getProductUrl(p));
    const imageUrl = safeExternalUrl(p.image);

    return `
      <article class="product-card">
        ${renderStoreLogo(getProductStore(p), 'store-logo')}
        <div class="badge-row">
          ${renderRatingBadge(p.rating)}
          ${renderReviews(getReviewCount(p))}
        </div>
        ${renderCategoryBadge(p.category)}
        ${imageUrl !== '#' ? `<img src="${imageUrl}" alt="${safeTitleAttr}" loading="lazy">` : ''}
        <h3>${safeTitle}</h3>
        <div class="card-meta">
          <strong>${formatCurrency(getListingPrice(p))}</strong>
          <span>${getDiscountPercent(p)}% off</span>
        </div>
        <div class="price-breakdown">
          <span>GST ${formatCurrency(getCharge(p, 'gst'))} | Shipping ${getCharge(p, 'shipping') === 0 ? 'Free' : formatCurrency(getCharge(p, 'shipping'))}</span>
          <span>Bank offer −${formatCurrency(getCharge(p, 'bankOffer'))} | Coupon −${formatCurrency(getCharge(p, 'couponDiscount'))}</span>
          <span>${renderAvailabilityChip(p.availability)}</span>
        </div>
        <div class="offer-list-grid">${renderOfferList(p.offers)}</div>
        <p class="final-price"><span>Final payable</span> ${formatCurrency(getFinalPayablePrice(p))}</p>
        <a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="store-buy-btn primary-buy-btn" data-product-index="${index}">Buy Now</a>
      </article>`;
  }).join('');
}

// ─── Enhanced comparison table ────────────────────────────────────────────────

function computeHighlights(products) {
  if (!products.length) return {};

  const finals   = products.map(getFinalPayablePrice);
  const ratings  = products.map(p => Number(p.rating) || 0);
  const discounts = products.map(getDiscountPercent);

  const minFinal    = Math.min(...finals);
  const maxRating   = Math.max(...ratings);
  const maxDiscount = Math.max(...discounts);

  return {
    bestDeal:        products.findIndex((p, i) => finals[i]    === minFinal),
    highestRated:    products.findIndex((p, i) => ratings[i]   === maxRating   && maxRating   > 0),
    highestDiscount: products.findIndex((p, i) => discounts[i] === maxDiscount && maxDiscount > 0)
  };
}

function renderHighlightBadges(index, highlights) {
  const badges = [];
  if (index === highlights.bestDeal)        badges.push(`<span class="highlight-badge best-deal">🏆 Best Deal</span>`);
  if (index === highlights.highestRated)    badges.push(`<span class="highlight-badge highest-rated">★ Top Rated</span>`);
  if (index === highlights.highestDiscount) badges.push(`<span class="highlight-badge highest-discount">🔥 Max Discount</span>`);
  return badges.join('');
}

function renderComparisonTable(products) {
  const highlights = computeHighlights(products);

  const rows = products.slice(0, 10).map((p, i) => {
    const storeName = getStoreName(getProductStore(p));
    return `
      <div class="comparison-row ${i === 0 ? 'best-deal' : ''}" role="row">
        <span class="store-cell">
          ${renderStoreLogo(getProductStore(p), 'mini-logo')}
          <span>
            ${escapeHtml(storeName)}
            ${i === 0 ? '<em>Best final price</em>' : ''}
            <br><small style="opacity:.6">${renderHighlightBadges(i, highlights)}</small>
          </span>
        </span>
        <strong>${formatCurrency(getListingPrice(p))}</strong>
        <span>${getCharge(p, 'shipping') === 0 ? '<span class="free-tag">Free</span>' : formatCurrency(getCharge(p, 'shipping'))}</span>
        <span>−${formatCurrency(getTotalSavings(p))}</span>
        <strong class="payable">${formatCurrency(getFinalPayablePrice(p))}</strong>
        <a href="${safeExternalUrl(getProductUrl(p))}" target="_blank" rel="noopener noreferrer" class="table-buy-btn">Buy Now</a>
      </div>`;
  }).join('');

  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listed Price</span><span>Delivery</span>
      <span>Offers Applied</span><span>Final Payable</span><span>Buy Now</span>
    </div>${rows}`;
}

// ─── Provider Health Panel ────────────────────────────────────────────────────

function strategyDisplay(strategy) {
  const map = {
    'official-api':  { cls: 'official-api',  label: 'Official API' },
    'playwright':    { cls: 'playwright',     label: 'Playwright' },
    'mock-fallback': { cls: 'mock-fallback',  label: 'Fallback' },
    'mock':          { cls: '',               label: 'Local provider' }
  };
  return map[strategy] || { cls: '', label: strategy || 'provider' };
}

function renderProviderCard(provider) {
  const statusClass = (provider.status || 'unknown').toLowerCase();
  const avgMs       = provider.averageResponseTime ? `${provider.averageResponseTime}ms avg` : '—';
  const { cls, label } = strategyDisplay(provider.strategy);
  return `
    <div class="provider-card">
      <div class="provider-card-header">
        <span class="provider-card-name">${provider.provider}</span>
        <span class="status-dot ${statusClass}" title="${provider.status}"></span>
      </div>
      <div class="provider-card-meta">
        <span class="provider-status-label ${statusClass}">${provider.status}</span>
        <span class="provider-strategy-badge ${cls}">${label}</span>
      </div>
      <div class="provider-card-meta">
        <span>✓ ${provider.successfulRequests || 0}</span>
        <span>✕ ${provider.failedRequests || 0}</span>
        <span>⏱ ${avgMs}</span>
      </div>
    </div>`;
}

async function loadBrowserStatus() {
  if (!browserStatusRow) return;
  try {
    const res  = await apiFetch('/browser');
    const data = await res.json();
    if (!data.success) return;
    const { browser, queue } = data;
    bpAvailable.textContent = browser.available ? '✓ Available' : '✗ Not installed';
    bpAvailable.className   = `browser-pill${browser.available ? '' : ' unavailable'}`;
    bpBrowsers.textContent  = `${browser.activeBrowsers} browser${browser.activeBrowsers !== 1 ? 's' : ''}`;
    bpPages.textContent     = `${browser.activePages} page${browser.activePages !== 1 ? 's' : ''}`;
    bpQueue.textContent     = `queue: ${queue.queueLength}`;
    bpUptime.textContent    = browser.uptimeMs > 0 ? `uptime: ${Math.round(browser.uptimeMs / 1000)}s` : 'uptime: —';
    browserStatusRow.style.display = 'flex';
  } catch (_) { /* silent */ }
}

async function loadProviderHealth() {
  if (providerHealthLoading) providerHealthLoading.style.display = 'block';
  if (providerGrid) providerGrid.innerHTML = '';
  try {
    const res  = await apiFetch('/providers');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.providers)) throw new Error('Invalid response');
    const { healthy, total } = data.summary || {};
    if (providerHealthSummary) providerHealthSummary.textContent = `${healthy || 0}/${total || data.providers.length} healthy`;
    if (providerGrid) providerGrid.innerHTML = data.providers.map(renderProviderCard).join('');
    await loadBrowserStatus();
  } catch (err) {
    if (providerHealthSummary) providerHealthSummary.textContent = 'Unavailable';
    if (providerGrid) providerGrid.innerHTML = `<p style="color:#b42318;font-size:.85rem">Could not load provider data: ${err.message}</p>`;
  } finally {
    if (providerHealthLoading) providerHealthLoading.style.display = 'none';
  }
}

function toggleProviderHealth() {
  const isOpen = providerHealthToggle.getAttribute('aria-expanded') === 'true';
  providerHealthToggle.setAttribute('aria-expanded', String(!isOpen));
  providerHealthBody.classList.toggle('open', !isOpen);
  if (!isOpen) loadProviderHealth();
}

// ─── Progress chips ───────────────────────────────────────────────────────────

const PROVIDER_LABELS = {
  amazon: 'Amazon', flipkart: 'Flipkart', myntra: 'Myntra', ajio: 'AJIO',
  meesho: 'Meesho', nykaa: 'Nykaa', purplle: 'Purplle', tira: 'Tira',
  apollo: 'Apollo', pharmeasy: 'PharmEasy', tata1mg: 'Tata 1mg',
  netmeds: 'Netmeds', reliancedigital: 'Reliance Digital',
  croma: 'Croma', vijaysales: 'Vijay Sales'
};

function showProgressChips(providerNames) {
  if (!searchProgressPanel || !progressChips) return;
  searchProgressPanel.classList.add('visible');
  progressChips.innerHTML = providerNames.map(name => `
    <span class="progress-chip loading" id="chip-${name}">
      <span class="chip-spinner" aria-hidden="true"></span>
      ${PROVIDER_LABELS[name] || name}
    </span>`).join('');
}

function updateProgressChips(providerResults) {
  if (!Array.isArray(providerResults)) return;
  const actualProviderNames = providerResults.map(({ name, platform }) => name || platform).filter(Boolean);
  if (actualProviderNames.length) showProgressChips(actualProviderNames);

  providerResults.forEach(({ name, platform, success, count, error }) => {
    const providerName = name || platform;
    if (!providerName) return;

    const chip = document.querySelector(`#chip-${providerName}`);
    if (!chip) return;
    chip.className = `progress-chip ${success ? 'done' : 'error'}`;
    chip.innerHTML = success
      ? `✓ ${PROVIDER_LABELS[providerName] || providerName} <small>(${count})</small>`
      : `✕ ${PROVIDER_LABELS[providerName] || providerName}`;
    if (error) chip.title = error;
  });
}

const hideProgressChips = () =>
  searchProgressPanel && searchProgressPanel.classList.remove('visible');

function renderProviderDiagnostics(data) {
  if (!progressChips) return;

  const providerResults = Array.isArray(data.providerResults) ? data.providerResults : [];
  const diagnosticsByProvider = new Map(
    (Array.isArray(data.providerDiagnostics) ? data.providerDiagnostics : [])
      .map((item) => [item.provider || item.name || item.platform, item])
  );

  if (!providerResults.length) return;

  searchProgressPanel && searchProgressPanel.classList.add('visible');
  progressChips.innerHTML = providerResults.map((result) => {
    const providerName = result.name || result.platform;
    const label = PROVIDER_LABELS[providerName] || providerName;
    const diagnostic = diagnosticsByProvider.get(providerName) || diagnosticsByProvider.get(result.platform) || {};
    const cardsFound = Number(diagnostic.cardsFound || 0);
    const rejected = Number((diagnostic.rejected || 0) + (diagnostic.validationRejected || 0));
    const elapsed = result.executionTimeMs != null ? `${result.executionTimeMs}ms` : '';
    const title = result.success
      ? `${label}: ${result.count || 0} returned, ${cardsFound} cards found, ${rejected} rejected`
      : `${label}: ${result.error || 'Failed'}`;

    return `
      <span class="progress-chip ${result.success ? 'done' : 'error'}" title="${escapeAttr(title)}">
        ${result.success ? '✓' : '✕'} ${escapeHtml(label)}
        <small>${result.success ? `${result.count || 0} products` : (result.error || 'Failed')}${elapsed ? ` · ${elapsed}` : ''}</small>
      </span>`;
  }).join('');
}

// ─── Category bar ─────────────────────────────────────────────────────────────

function initCategoryBar() {
  if (!categoryBar) return;
  categoryBar.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      categoryBar.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentCategory = chip.dataset.category || '';
      if (state.currentQuery) loadComparison(state.currentQuery, 1);
    });
  });
}

function updateCategoryLabel(detectedCategory, categoryLabel) {
  if (!categoryLabelBar) return;
  if (detectedCategory && detectedCategory !== 'general') {
    categoryLabelBar.textContent = `Auto-detected: ${categoryLabel || detectedCategory}`;
    categoryLabelBar.classList.add('visible');
  } else {
    categoryLabelBar.classList.remove('visible');
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function updatePaginationUI(page, totalResults, hasNextPage, limit) {
  if (!paginationBar) return;
  const start = totalResults === 0 ? 0 : (page - 1) * limit + 1;
  const end   = Math.min(page * limit, totalResults);
  paginationInfo.textContent  = `Showing ${start}–${end} of ${totalResults} comparisons`;
  pageIndicator.textContent   = `Page ${page}`;
  prevPageBtn.disabled        = page <= 1;
  nextPageBtn.disabled        = !hasNextPage;
  paginationBar.style.display = totalResults > 0 ? 'flex' : 'none';
}

const hidePagination = () =>
  paginationBar && (paginationBar.style.display = 'none');

function saveProductDetailGroup(index) {
  const group = state.lastGroupedProducts[Number(index)];
  if (!group) return;

  sessionStorage.setItem('pricepilotSelectedProductGroup', JSON.stringify({
    ...group,
    searchQuery: state.currentQuery,
    savedAt: new Date().toISOString()
  }));
}

// ─── Search metadata bar ──────────────────────────────────────────────────────

function renderMetaBar(data) {
  const existing = document.getElementById('searchMetaBar');
  if (existing) existing.remove();
  const bar = document.createElement('div');
  bar.className = 'search-meta-bar';
  bar.id = 'searchMetaBar';

  if (data.executionTimeMs != null) {
    const tp = document.createElement('span');
    tp.className = 'meta-pill exec-time';
    tp.textContent = `⏱ ${data.executionTimeMs}ms`;
    bar.appendChild(tp);
  }

  const cp = document.createElement('span');
  cp.className = `meta-pill ${data.cached ? 'cache-hit' : 'cache-miss'}`;
  cp.textContent = data.cached ? '⚡ Cached result' : '🔄 Live result';
  bar.appendChild(cp);

  if (data.totalPlatforms) {
    const pp = document.createElement('span');
    pp.className = 'meta-pill provider-count';
    pp.textContent = `${data.totalPlatforms} stores searched`;
    bar.appendChild(pp);
  }

  if (data.totalGroups) {
    const gp = document.createElement('span');
    gp.className = 'meta-pill';
    gp.textContent = `${data.totalGroups} grouped comparisons`;
    bar.appendChild(gp);
  }

  if (data.totalResults != null) {
    const rp = document.createElement('span');
    rp.className = 'meta-pill';
    rp.textContent = `${data.totalResults} products found`;
    bar.appendChild(rp);
  }

  // ── Search mode badge ────────────────────────────────────────────────────
  if (data.searchMode) {
    const modeLabels = {
      exact:    { icon: '🎯', label: 'Exact Match',      cls: 'mode-exact' },
      branded:  { icon: '🏷️', label: 'Branded Search',   cls: 'mode-branded' },
      generic:  { icon: '🔍', label: 'Generic Search',   cls: 'mode-generic' },
      category: { icon: '📂', label: 'Category Browse',  cls: 'mode-category' }
    };
    const modeInfo = modeLabels[data.searchMode];
    if (modeInfo) {
      const mp = document.createElement('span');
      mp.className = `meta-pill search-mode-pill ${modeInfo.cls}`;
      mp.textContent = `${modeInfo.icon} ${modeInfo.label}`;
      mp.title = `Search mode: ${data.searchMode}`;
      bar.appendChild(mp);
    }
  }

  // ── Intent display (brand, family, model, quantity, category) ────────────
  if (data.searchIntent) {
    const intent = data.searchIntent;
    const parts = [
      intent.brand    ? `Brand: ${intent.brand}`    : null,
      intent.family   ? `Family: ${intent.family}`  : null,
      intent.model    ? `Model: ${intent.model}`    : null,
      intent.quantity ? `Qty: ${intent.quantity}`   : null,
      intent.storage  ? `${intent.storage}`         : null,
      intent.color    ? intent.color                : null,
      (!intent.brand && intent.category && intent.category !== 'general') ? `Category: ${intent.category}` : null
    ].filter(Boolean).slice(0, 5);
    if (parts.length) {
      const ip = document.createElement('span');
      ip.className = 'meta-pill intent-pill';
      ip.textContent = `Intent: ${parts.join(' · ')}`;
      bar.appendChild(ip);
    }
  }

  if (data.correctedQuery) {
    const qp = document.createElement('span');
    qp.className = 'meta-pill correction-pill';
    qp.textContent = `Corrected to "${data.correctedQuery}"`;
    bar.appendChild(qp);
  }

  resultStatus.insertAdjacentElement('beforebegin', bar);
}

// ─── State renderers ──────────────────────────────────────────────────────────

function renderLoadingState() {
  renderRelatedProducts([]);
  productResults.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner" aria-label="Loading"></div>
      <p>Searching across all stores…</p>
    </div>
    <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div>
    <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div>
    <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div>`;
  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listed Price</span><span>Delivery</span>
      <span>Offers Applied</span><span>Final Payable</span><span>Buy Now</span>
    </div>`;
}

function renderErrorState(message) {
  productResults.innerHTML = `
    <div class="error-state">
      <h3>⚠️ Backend Unreachable</h3>
      <p>${message || 'Make sure pricepilot-backend is running (npm start).'}</p>
    </div>`;
  hidePagination();
  hideProgressChips();
  renderRelatedProducts([]);
}

function renderEmptyState(query, data) {
  // Build a helpful message showing which providers were searched
  const providerResults = Array.isArray(data && data.providerResults) ? data.providerResults : [];
  const searchedStores  = providerResults.map((r) => PROVIDER_LABELS[r.name || r.platform] || r.name || r.platform).filter(Boolean);
  const storesNote      = searchedStores.length
    ? `<p class="empty-stores">Searched: <strong>${searchedStores.join(', ')}</strong></p>`
    : '';

  const category     = data && data.detectedCategory && data.detectedCategory !== 'general' ? data.detectedCategory : '';
  const categoryNote = category ? `<p class="empty-category">Detected category: <strong>${escapeHtml(data.categoryLabel || category)}</strong></p>` : '';

  const suggestions = [
    category === 'groceries' ? 'Try: "Almonds 500g", "Olive Oil 500ml", "Basmati Rice 5kg"' : null,
    category === 'beauty'    ? 'Try: "Cetaphil Cleanser", "Sunscreen SPF 50", "Vitamin C Serum"' : null,
    category === 'medicine'  ? 'Try: "Paracetamol 650", "Dolo 650", "Vitamin D3"' : null,
    category === 'fashion'   ? 'Try: "Nike Shoes", "Levi\'s Jeans", "Black Hoodie"' : null,
    category === 'electronics' ? 'Try: "iPhone 16", "Samsung TV 55 inch", "Logitech Keyboard"' : null,
    'Try a broader search or check the spelling.'
  ].find(Boolean);

  productResults.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No results found for "${escapeHtml(query)}"</h3>
      ${categoryNote}
      ${storesNote}
      <p class="empty-suggestion">${escapeHtml(suggestions)}</p>
    </div>`;
  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listed Price</span><span>Delivery</span>
      <span>Offers Applied</span><span>Final Payable</span><span>Buy Now</span>
    </div>`;
  resultStatus.textContent = `No results found for "${query}".`;
  hidePagination();
  renderRelatedProducts([]);
}

function renderReadyState() {
  if (!productResults || productResults.children.length > 0) return;
  productResults.innerHTML = `
    <div class="ready-state">
      <h3>Ready for live results</h3>
      <p>Search results will appear here after the stores respond.</p>
    </div>`;
}

// ─── Core search ──────────────────────────────────────────────────────────────

async function loadComparison(query, page = 1) {
  const searchTerm = (query || '').trim();
  if (!searchTerm) return;

  state.currentQuery = searchTerm;
  state.currentPage  = page;

  renderLoadingState();
  resultStatus.textContent = `Searching stores for "${searchTerm}"…`;

  // Show progress chips for all known providers while waiting
  showProgressChips(Object.keys(PROVIDER_LABELS));

  const qs = buildQueryString(searchTerm, page);

  try {
    const response = await apiFetch(`/search?${qs}`);
    const data     = await response.json();

    if (data.providerResults) updateProgressChips(data.providerResults);
    renderProviderDiagnostics(data);
    updateCategoryLabel(data.detectedCategory, data.categoryLabel);

    const groupedProducts = Array.isArray(data.groupedProducts) ? data.groupedProducts : [];
    state.lastGroupedProducts = groupedProducts;

    if ((!data.products || data.products.length === 0) && groupedProducts.length === 0) {
      renderEmptyState(searchTerm, data);
      hideProgressChips();
      return;
    }

    renderMetaBar(data);

    // Prefer grouped products (Phase 2 intelligent cards)
    if (groupedProducts.length > 0) {
      renderGroupedProductCards(groupedProducts);
      renderRelatedProducts(data.groupedRelatedProducts || []);
      // Build comparison table from flattened store offers of top group
      const topGroupStores = getStores(groupedProducts[0]);
      if (topGroupStores.length > 0) {
        renderComparisonTable(topGroupStores);
      } else {
        renderComparisonTable(data.products || []);
      }
    } else {
      renderProductCards(data.products || []);
      renderRelatedProducts(data.groupedRelatedProducts || []);
      renderComparisonTable(data.products || []);
    }

    state.totalResults = data.totalGroups || data.totalResults || (data.products || []).length;
    state.hasNextPage  = data.hasNextPage || false;
    updatePaginationUI(data.page || page, state.totalResults, state.hasNextPage, data.limit || state.currentLimit);

    const catNote    = data.detectedCategory && data.detectedCategory !== 'general' ? ` (${data.detectedCategory})` : '';
    const cacheLabel = data.cached ? ' (cached)' : '';
    const groupNote  = data.totalGroups ? `, ${data.totalGroups} grouped comparisons` : '';
    resultStatus.textContent = `${state.totalResults} products found across ${data.totalPlatforms || '?'} stores${groupNote}${catNote}. Page ${data.page || page}.${cacheLabel}`;

  } catch (err) {
    renderErrorState(err.message);
    resultStatus.textContent = 'Backend unavailable.';
    hideProgressChips();
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q) {
    loadComparison(q, 1);
    document.querySelector('#stores').scrollIntoView({ behavior: 'smooth' });
  }
});

applyFiltersBtn.addEventListener('click', () => loadComparison(state.currentQuery, 1));
clearFiltersBtn.addEventListener('click', () => { resetFilters(); loadComparison(state.currentQuery, 1); });
filterSort.addEventListener('change', () => { if (state.currentQuery) loadComparison(state.currentQuery, 1); });

prevPageBtn.addEventListener('click', () => {
  if (state.currentPage > 1) { loadComparison(state.currentQuery, state.currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
});
nextPageBtn.addEventListener('click', () => {
  if (state.hasNextPage) { loadComparison(state.currentQuery, state.currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
});

providerHealthToggle.addEventListener('click', toggleProviderHealth);
providerHealthToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleProviderHealth(); }
});

document.addEventListener('click', (event) => {
  const detailLink = event.target.closest('[data-product-detail-index]');
  if (!detailLink) return;
  saveProductDetailGroup(detailLink.dataset.productDetailIndex);
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────

initCategoryBar();
renderReadyState();
loadProviderHealth(); // pre-fetch while panel stays collapsed
