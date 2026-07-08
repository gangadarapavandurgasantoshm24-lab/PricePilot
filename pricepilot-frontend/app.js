/**
 * PricePilot Frontend – Week 6
 *
 * Week 5 features (retained):
 *  ✓ Search Progress Panel – per-provider chips with animated spinner
 *  ✓ Pagination controls – Prev/Next with page indicator + total count
 *  ✓ Browser Status Row – GET /api/browser metrics in health panel
 *  ✓ Strategy badge colouring – official-api=green, playwright=purple, mock=amber
 *  ✓ Loading / error / empty states
 *  ✓ Filter/sort controls (8 dimensions)
 *  ✓ Provider Health Dashboard
 *
 * Week 6 additions:
 *  ✓ Category selector bar – 7 chips (All, Electronics, Fashion, Beauty, Medicine, Home, Groceries)
 *  ✓ Auto-detected category badge after each search
 *  ✓ Category-aware provider routing (3 new providers: Myntra, Purplle, Meesho)
 *  ✓ Enhanced product cards – reviews, delivery estimate, category badge
 *  ✓ Enhanced comparison table – highlight badges (Best Deal, Lowest Price, Highest Rated, Highest Discount)
 *  ✓ detectedCategory/categoryLabel shown from API response
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

// Week 5: Search progress
const searchProgressPanel = document.querySelector('#searchProgressPanel');
const progressChips       = document.querySelector('#progressChips');

// Week 5: Pagination
const paginationBar  = document.querySelector('#paginationBar');
const paginationInfo = document.querySelector('#paginationInfo');
const prevPageBtn    = document.querySelector('#prevPageBtn');
const nextPageBtn    = document.querySelector('#nextPageBtn');
const pageIndicator  = document.querySelector('#pageIndicator');

// Week 5: Browser status
const browserStatusRow = document.querySelector('#browserStatusRow');
const bpAvailable      = document.querySelector('#bpAvailable');
const bpBrowsers       = document.querySelector('#bpBrowsers');
const bpPages          = document.querySelector('#bpPages');
const bpQueue          = document.querySelector('#bpQueue');
const bpUptime         = document.querySelector('#bpUptime');

// Week 6: Category bar
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
  tatacliq:        'assets/store-logos/tatacliq.svg',
  reliancedigital: 'assets/store-logos/reliance-digital.svg',
  pharmeasy:       'assets/store-logos/pharmeasy.svg',
  tata1mg:         'assets/store-logos/pharmeasy.svg',
  netmeds:         'assets/store-logos/netmeds.svg'
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
  currentQuery:    'red shoes',
  currentPage:     1,
  currentLimit:    20,
  currentCategory: '',   // '' = auto-detect
  totalResults:    0,
  hasNextPage:     false
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
    .format(v).replace('₹', 'Rs. ');

const getStoreKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');

const getProductTitle   = (p) => p.productName || p.title || 'Product';
const getProductStore   = (p) => p.platform || p.store || 'Store';
const getListingPrice   = (p) => p.currentPrice || p.productPrice || p.finalPayablePrice || 0;
const getCharge         = (p, k) => Number(p[k] || 0);
const getTotalSavings   = (p) => p.totalSavings || getCharge(p, 'bankOffer') + getCharge(p, 'couponDiscount');
const getProductUrl     = (p) => p.productUrl || p.productURL || '#compare';
const getReviewCount    = (p) => p.reviewCount || p.reviews || 0;
const getDeliveryDays   = (p) => p.deliveryDays || p.deliveryEstimate || null;

function getFinalPayablePrice(p) {
  if (p.finalPayablePrice !== undefined) return p.finalPayablePrice;
  return Math.max(0,
    getListingPrice(p) + getCharge(p, 'gst') + getCharge(p, 'shipping')
    - getCharge(p, 'bankOffer') - getCharge(p, 'couponDiscount')
  );
}

function getDiscountPercent(p) {
  if (p.discountPercentage !== undefined) return p.discountPercentage;
  const s = getTotalSavings(p);
  const l = getListingPrice(p);
  return l ? Math.max(0, Math.round((s / l) * 100)) : 0;
}

// ─── Badge renderers ──────────────────────────────────────────────────────────

function renderSourceBadge(source, strategy) {
  const src = source || strategy || 'mock';
  if (src === 'official-api')
    return `<span class="badge source-api">✓ Official API</span>`;
  if (src === 'playwright')
    return `<span class="badge" style="background:rgba(124,58,237,.12);color:#7c3aed">🎭 Playwright</span>`;
  if (src === 'mock-fallback')
    return `<span class="badge source-mock">⚡ Mock (no creds)</span>`;
  return `<span class="badge source-mock">⚡ Mock</span>`;
}

const renderRatingBadge = (r) =>
  r ? `<span class="badge rating">★ ${Number(r).toFixed(1)}</span>` : '';

const renderAvailabilityChip = (available) =>
  available === false
    ? `<span class="availability-chip out-of-stock">⊘ Out of stock</span>`
    : `<span class="availability-chip in-stock">✓ In Stock</span>`;

function renderStoreLogo(store, cls) {
  const logo = storeLogoMap[getStoreKey(store)];
  if (logo) return `<span class="${cls}"><img src="${logo}" alt="${store} logo"></span>`;
  return `<span class="${cls} logo-fallback" aria-label="${store}">${String(store).slice(0, 2).toUpperCase()}</span>`;
}

// Week 6: category badge
const renderCategoryBadge = (cat) =>
  cat ? `<span class="category-badge">${cat}</span>` : '';

// Week 6: delivery chip
const renderDeliveryChip = (days) =>
  days ? `<span class="delivery-chip">🚚 ${days === 1 ? 'Tomorrow' : `${days} days`}</span>` : '';

// Week 6: review count
const renderReviews = (count) =>
  count > 0 ? `<span class="review-count-chip">(${count.toLocaleString('en-IN')} reviews)</span>` : '';

// ─── Week 6: Comparison highlight badges ─────────────────────────────────────

function computeHighlights(products) {
  if (!products.length) return {};

  const finals   = products.map(getFinalPayablePrice);
  const ratings  = products.map(p => Number(p.rating) || 0);
  const discounts = products.map(getDiscountPercent);

  const minFinal    = Math.min(...finals);
  const maxRating   = Math.max(...ratings);
  const maxDiscount = Math.max(...discounts);

  return {
    bestDeal:        products.findIndex((p, i) => finals[i]   === minFinal),
    highestRated:    products.findIndex((p, i) => ratings[i]  === maxRating    && maxRating   > 0),
    highestDiscount: products.findIndex((p, i) => discounts[i] === maxDiscount && maxDiscount > 0)
  };
}

function renderHighlightBadges(index, highlights) {
  const badges = [];
  if (index === highlights.bestDeal)        badges.push(`<span class="highlight-badge best-deal">Best Deal</span>`);
  if (index === highlights.highestRated)    badges.push(`<span class="highlight-badge highest-rated">★ Top Rated</span>`);
  if (index === highlights.highestDiscount) badges.push(`<span class="highlight-badge highest-discount">🔥 Max Discount</span>`);
  return badges.join('');
}

// ─── Week 5: Search progress chips ───────────────────────────────────────────

const PROVIDER_LABELS = {
  amazon: 'Amazon', flipkart: 'Flipkart', nykaa: 'Nykaa',
  myntra: 'Myntra', ajio: 'Ajio', meesho: 'Meesho', purplle: 'Purplle',
  apollo: 'Apollo', pharmeasy: 'PharmEasy', tata1mg: 'Tata 1mg',
  reliancedigital: 'Reliance Digital', croma: 'Croma'
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
  providerResults.forEach(({ name, success, count, error }) => {
    const chip = document.querySelector(`#chip-${name}`);
    if (!chip) return;
    chip.className = `progress-chip ${success ? 'done' : 'error'}`;
    chip.innerHTML = success
      ? `✓ ${PROVIDER_LABELS[name] || name} <small>(${count})</small>`
      : `✕ ${PROVIDER_LABELS[name] || name}`;
    if (error) chip.title = error;
  });
}

const hideProgressChips = () =>
  searchProgressPanel && searchProgressPanel.classList.remove('visible');

// ─── Week 6: Category bar ─────────────────────────────────────────────────────

function initCategoryBar() {
  if (!categoryBar) return;
  categoryBar.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      categoryBar.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentCategory = chip.dataset.category || '';
      loadComparison(state.currentQuery, 1);
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

// ─── Week 5: Pagination ───────────────────────────────────────────────────────

function updatePaginationUI(page, totalResults, hasNextPage, limit) {
  if (!paginationBar) return;
  const start = totalResults === 0 ? 0 : (page - 1) * limit + 1;
  const end   = Math.min(page * limit, totalResults);
  paginationInfo.textContent  = `Showing ${start}–${end} of ${totalResults} products`;
  pageIndicator.textContent   = `Page ${page}`;
  prevPageBtn.disabled        = page <= 1;
  nextPageBtn.disabled        = !hasNextPage;
  paginationBar.style.display = totalResults > 0 ? 'flex' : 'none';
}

const hidePagination = () =>
  paginationBar && (paginationBar.style.display = 'none');

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
    pp.textContent = `${data.totalPlatforms} providers queried`;
    bar.appendChild(pp);
  }

  resultStatus.insertAdjacentElement('beforebegin', bar);
}

// ─── State renderers ──────────────────────────────────────────────────────────

function renderLoadingState() {
  productResults.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner" aria-label="Loading"></div>
      <p>Searching across all stores…</p>
    </div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>`;
  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listing Price</span><span>GST + Shipping</span>
      <span>Offers Applied</span><span>Final Payable</span><span>Buy Now</span>
    </div>`;
}

function renderErrorState(message) {
  productResults.innerHTML = `
    <div class="error-state">
      <h3>Backend Unreachable</h3>
      <p>${message || 'Make sure pricepilot-backend is running (npm start).'}</p>
    </div>`;
  hidePagination();
  hideProgressChips();
}

function renderEmptyState(query) {
  productResults.innerHTML = `
    <div class="empty-state">
      <h3>No products found for "${query}"</h3>
      <p>Try: lipstick, iPhone, running shoes, laptop, paracetamol, pressure cooker.</p>
    </div>`;
  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listing Price</span><span>GST + Shipping</span>
      <span>Offers Applied</span><span>Final Payable</span><span>Buy Now</span>
    </div>`;
  resultStatus.textContent = `No results found for "${query}".`;
  hidePagination();
}

// ─── Week 6: Enhanced product cards ──────────────────────────────────────────

function renderProductCards(products) {
  productResults.innerHTML = products.map(p => `
    <article class="product-card">
      ${renderStoreLogo(getProductStore(p), 'store-logo')}
      <div class="badge-row">
        ${renderSourceBadge(p.source, p._strategy)}
        ${renderRatingBadge(p.rating)}
        ${renderReviews(getReviewCount(p))}
      </div>
      ${renderCategoryBadge(p.category)}
      <img src="${p.image}" alt="${getProductTitle(p)}" loading="lazy">
      <h3>${getProductTitle(p)}</h3>
      <div class="card-meta">
        <strong>${formatCurrency(getListingPrice(p))}</strong>
        <span>${getDiscountPercent(p)}% off</span>
      </div>
      <div class="price-breakdown">
        <span>GST ${formatCurrency(getCharge(p, 'gst'))} | Shipping ${getCharge(p, 'shipping') === 0 ? 'Free' : formatCurrency(getCharge(p, 'shipping'))}</span>
        <span>Bank offer −${formatCurrency(getCharge(p, 'bankOffer'))} | Coupon −${formatCurrency(getCharge(p, 'couponDiscount'))}</span>
        <span>${renderAvailabilityChip(p.availability)} ${renderDeliveryChip(getDeliveryDays(p))}</span>
      </div>
      <p class="final-price"><span>Final payable</span> ${formatCurrency(getFinalPayablePrice(p))}</p>
    </article>`).join('');
}

// ─── Week 6: Enhanced comparison table ───────────────────────────────────────

function renderComparisonTable(products) {
  const highlights = computeHighlights(products);

  const rows = products.map((p, i) => `
    <div class="comparison-row ${i === 0 ? 'best-deal' : ''}" role="row">
      <span class="store-cell">
        ${renderStoreLogo(getProductStore(p), 'mini-logo')}
        <span>
          ${getProductStore(p)}
          ${i === 0 ? '<em>Best final price</em>' : ''}
          <br><small style="opacity:.6">${renderHighlightBadges(i, highlights)}</small>
        </span>
      </span>
      <strong>${formatCurrency(getListingPrice(p))}</strong>
      <span>GST ${formatCurrency(getCharge(p, 'gst'))} + ${getCharge(p, 'shipping') === 0 ? 'free shipping' : formatCurrency(getCharge(p, 'shipping'))}</span>
      <span>−${formatCurrency(getTotalSavings(p))}</span>
      <strong class="payable">${formatCurrency(getFinalPayablePrice(p))}</strong>
      <a href="${getProductUrl(p)}" target="_blank" rel="noopener noreferrer">Buy Now</a>
    </div>`).join('');

  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listing Price</span><span>GST + Shipping</span>
      <span>Offers Applied</span><span>Final Payable</span><span>Buy Now</span>
    </div>${rows}`;
}

// ─── Provider Health Panel ────────────────────────────────────────────────────

function strategyDisplay(strategy) {
  const map = {
    'official-api':  { cls: 'official-api',  label: 'Official API' },
    'playwright':    { cls: 'playwright',     label: 'Playwright' },
    'mock-fallback': { cls: 'mock-fallback',  label: 'Mock (no creds)' },
    'mock':          { cls: '',               label: 'Mock' }
  };
  return map[strategy] || { cls: '', label: strategy || 'mock' };
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

// ─── Core search ──────────────────────────────────────────────────────────────

async function loadComparison(query, page = 1) {
  const searchTerm = (query || '').trim() || 'red shoes';
  state.currentQuery = searchTerm;
  state.currentPage  = page;

  renderLoadingState();
  resultStatus.textContent = `Searching stores for "${searchTerm}"…`;

  // Show progress chips for all known providers
  showProgressChips(Object.keys(PROVIDER_LABELS));

  const qs = buildQueryString(searchTerm, page);

  try {
    const response = await apiFetch(`/search?${qs}`);
    const data     = await response.json();

    if (data.providerResults) updateProgressChips(data.providerResults);

    // Week 6: update category label
    updateCategoryLabel(data.detectedCategory, data.categoryLabel);

    if (!data.products || data.products.length === 0) {
      renderEmptyState(searchTerm);
      hideProgressChips();
      return;
    }

    renderMetaBar(data);
    renderProductCards(data.products);
    renderComparisonTable(data.products);

    state.totalResults = data.totalResults || data.products.length;
    state.hasNextPage  = data.hasNextPage || false;
    updatePaginationUI(data.page || page, state.totalResults, state.hasNextPage, data.limit || state.currentLimit);

    const catNote    = data.detectedCategory && data.detectedCategory !== 'general' ? ` (${data.detectedCategory})` : '';
    const cacheLabel = data.cached ? ' (cached)' : '';
    resultStatus.textContent = `${state.totalResults} products found across ${data.totalPlatforms || '?'} stores${catNote}. Page ${data.page || page}.${cacheLabel}`;

    setTimeout(hideProgressChips, 1500);
  } catch (err) {
    renderErrorState(err.message);
    resultStatus.textContent = 'Backend unavailable.';
    hideProgressChips();
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loadComparison(searchInput.value, 1);
  document.querySelector('#compare').scrollIntoView({ behavior: 'smooth' });
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

// ─── Bootstrap ───────────────────────────────────────────────────────────────

initCategoryBar();
loadComparison('red shoes', 1);
loadProviderHealth(); // pre-fetch while panel stays collapsed
