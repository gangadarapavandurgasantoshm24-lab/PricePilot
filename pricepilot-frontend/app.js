const API_BASE_URL = '/api';

const searchForm = document.querySelector('#searchForm');
const searchInput = document.querySelector('#searchInput');
const productResults = document.querySelector('#productResults');
const comparisonResults = document.querySelector('#comparisonResults');
const resultStatus = document.querySelector('#resultStatus');
const loginForm = document.querySelector('#loginForm');

const storeLogoMap = {
  amazon: 'assets/store-logos/amazon.svg',
  amazonpharmacy: 'assets/store-logos/amazon-pharmacy.svg',
  flipkart: 'assets/store-logos/flipkart.svg',
  myntra: 'assets/store-logos/myntra.svg',
  nykaa: 'assets/store-logos/nykaa.svg',
  croma: 'assets/store-logos/croma.svg',
  ajio: 'assets/store-logos/ajio.svg',
  tatacliq: 'assets/store-logos/tatacliq.svg',
  reliancedigital: 'assets/store-logos/reliance-digital.svg',
  apollopharmacy: 'assets/store-logos/apollo-pharmacy.svg',
  pharmeasy: 'assets/store-logos/pharmeasy.svg',
  netmeds: 'assets/store-logos/netmeds.svg'
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value).replace('₹', 'Rs. ');
}

function getStoreKey(store) {
  return store.toLowerCase().replace(/\s+/g, '');
}

function getDiscountPercent(product) {
  const savings = product.bankOffer + product.couponDiscount;
  return Math.max(0, Math.round((savings / product.productPrice) * 100));
}

function renderStoreLogo(store, className) {
  const logo = storeLogoMap[getStoreKey(store)];

  if (logo) {
    return `<span class="${className}"><img src="${logo}" alt="${store} logo"></span>`;
  }

  return `<span class="${className} logo-fallback" aria-label="${store}">${store.slice(0, 2).toUpperCase()}</span>`;
}

function renderProductCards(products) {
  productResults.innerHTML = products.map((product) => `
    <article class="product-card">
      ${renderStoreLogo(product.store, 'store-logo')}
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <div class="card-meta">
        <strong>${formatCurrency(product.productPrice)}</strong>
        <span>${getDiscountPercent(product)}% off</span>
      </div>
      <div class="price-breakdown">
        <span>GST: ${formatCurrency(product.gst)} | Shipping: ${product.shipping === 0 ? 'Free' : formatCurrency(product.shipping)}</span>
        <span>Best offer selected: bank ${formatCurrency(product.bankOffer)} + coupon ${formatCurrency(product.couponDiscount)}</span>
      </div>
      <p class="final-price"><span>Final payable</span> ${formatCurrency(product.finalPayablePrice)}</p>
    </article>
  `).join('');
}

function renderComparisonTable(products) {
  const rows = products.map((product, index) => `
    <div class="comparison-row ${index === 0 ? 'best-deal' : ''}" role="row">
      <span class="store-cell">
        ${renderStoreLogo(product.store, 'mini-logo')}
        <span>${product.store}${index === 0 ? ' <em>Best final price</em>' : ''}</span>
      </span>
      <strong>${formatCurrency(product.productPrice)}</strong>
      <span>Bank ${formatCurrency(product.bankOffer)} + coupon ${formatCurrency(product.couponDiscount)}</span>
      <span>${product.deliveryDays} days</span>
      <strong class="payable">${formatCurrency(product.finalPayablePrice)}</strong>
      <a href="${product.productURL}" target="_blank" rel="noopener">Buy Now</a>
    </div>
  `).join('');

  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listing Price</span><span>Best Offer Selected</span><span>Delivery</span><span>Final Payable</span><span>Buy Now</span>
    </div>
    ${rows}
  `;
}

function renderEmptyState(query) {
  productResults.innerHTML = `
    <div class="empty-state">
      <h3>No matching products found</h3>
      <p>Try searching for red shoes, red kurta, dolo tablet, iPhone, headphones, beauty kit, or summer dress.</p>
    </div>
  `;

  comparisonResults.innerHTML = `
    <div class="comparison-row table-head" role="row">
      <span>Store</span><span>Listing Price</span><span>Best Offer Selected</span><span>Delivery</span><span>Final Payable</span><span>Buy Now</span>
    </div>
  `;

  resultStatus.textContent = `No backend results found for "${query}".`;
}

async function loadComparison(query) {
  const searchTerm = query.trim() || 'red shoes';
  resultStatus.textContent = `Searching stores for "${searchTerm}"...`;

  try {
    const [searchResponse, compareResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchTerm)}`),
      fetch(`${API_BASE_URL}/compare?q=${encodeURIComponent(searchTerm)}`)
    ]);

    if (!searchResponse.ok || !compareResponse.ok) {
      throw new Error('Backend request failed');
    }

    const searchData = await searchResponse.json();
    const compareData = await compareResponse.json();

    if (!searchData.products.length) {
      renderEmptyState(searchTerm);
      return;
    }

    renderProductCards(searchData.products);
    renderComparisonTable(compareData.products);
    resultStatus.textContent = `${searchData.products.length} matching products found across ${searchData.totalStores} stores. Cheapest final price is shown first.`;
  } catch (error) {
    resultStatus.textContent = 'Backend connection failed. Make sure npm start is running in pricepilot-backend.';
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#dashboard').scrollIntoView({ behavior: 'smooth' });
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadComparison(searchInput.value);
  document.querySelector('#compare').scrollIntoView({ behavior: 'smooth' });
});

loadComparison('red shoes');
