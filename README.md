# PricePilot 🚀

> **AI-Powered Shopping Comparison Platform**
> Find the true final payable price — after GST, shipping, bank offers and coupons — across 12 Indian e-commerce platforms from one intelligent dashboard.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Playwright](https://img.shields.io/badge/Playwright-Browser_Automation-45BA4B?logo=playwright&logoColor=white)](https://playwright.dev)
[![Tests](https://img.shields.io/badge/Tests-264_passing-success)](./pricepilot-backend/tests)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)

---

## 📸 Features

| Feature | Description |
|---------|-------------|
| **12 Platforms** | Amazon, Flipkart, Myntra, Nykaa, Purplle, Meesho, Ajio, Apollo, PharmEasy, Tata 1mg, Reliance Digital, Croma |
| **Category Routing** | Auto-detects query category — only relevant providers queried |
| **True Final Price** | Calculates GST + shipping − bank offer − coupon per product |
| **Provider Strategy** | Official API → Playwright → Mock fallback per provider |
| **Redis Cache** | Configurable TTL, rich cache keys (10 dimensions) |
| **Pagination** | `page` + `limit` on every search endpoint |
| **Provider Health** | Live health dashboard with metrics per provider |
| **Browser Metrics** | Playwright browser pool status via `GET /api/browser` |
| **Analytics** | Search history, hit-rate, provider performance tracking |
| **264 Tests** | 18 Jest suites — zero failures |

---

## 🏗️ Architecture

```
Search Query
     │
     ▼
Category Detector ──── detects: electronics / fashion / beauty / medicine / home
     │
     ▼
Provider Capability Matrix ──── selects only relevant providers
     │
     ▼
Provider Factory ─┬─ official-api ──► Amazon PA API v5 (SigV4)
                  ├─ playwright  ──► Myntra / Purplle / Meesho (mock fallback)
                  └─ mock        ──► All other platforms

     │
     ▼
Platform Manager ──── Promise.allSettled (per-provider timeout + retries)
     │
     ▼
Normalization → Pricing Engine → Filter → Sort → Paginate
     │
     ▼
Redis Cache ──► Response
     │
     ▼
Frontend Dashboard (Vanilla JS)
```

### Provider Strategy Pattern

```
config/providers.js
  strategy: 'official-api' ──► providers/amazon/amazon.official.js
  strategy: 'playwright'   ──► providers/myntra/myntra.playwright.js
  strategy: 'mock'         ──► providers/*/provider.js
```

Changing a provider's strategy requires editing **only** `config/providers.js`.

---

## 📁 Project Structure

```
PricePilot/
├── pricepilot-backend/
│   ├── app.js                        # Express app entry
│   ├── config/
│   │   ├── providers.js              # Strategy per platform
│   │   ├── providerCapabilities.js   # Category → provider matrix
│   │   ├── browser.js                # Playwright settings
│   │   └── selectors/                # DOM selectors per platform
│   ├── controllers/                  # HTTP request handlers
│   ├── services/
│   │   ├── platformManager.js        # Orchestrates all providers
│   │   ├── providerFactory.js        # Strategy dispatch
│   │   ├── providerRegistry.js       # Runtime provider store
│   │   ├── categoryDetector.js       # Keyword → category
│   │   ├── browserManager.js         # Playwright lifecycle
│   │   ├── browserQueue.js           # Concurrency-limited page pool
│   │   ├── cache.service.js          # Redis wrapper
│   │   ├── normalization.service.js  # Raw → unified schema
│   │   ├── pricing.service.js        # Final payable calculation
│   │   ├── filtering.service.js      # 8-dimension filter
│   │   ├── sorting.service.js        # 7 sort strategies
│   │   └── analytics.service.js      # Search telemetry
│   ├── providers/
│   │   ├── base/playwrightProvider.js # Abstract base (Template Method)
│   │   ├── amazon/
│   │   │   ├── amazon.official.js    # PA API v5 + AWS SigV4
│   │   │   └── amazon.mock.js
│   │   ├── myntra/myntra.playwright.js
│   │   ├── purplle/purplle.playwright.js
│   │   ├── meesho/meesho.playwright.js
│   │   └── [8 other mock providers]
│   ├── routes/                       # Express routers
│   ├── middleware/                   # Error, logger, rate-limit
│   ├── utils/                        # Helpers, validators, logger
│   └── tests/                        # 18 Jest suites, 264 tests
└── pricepilot-frontend/
    ├── index.html
    ├── app.js                        # Vanilla JS (Week 6 complete)
    └── style.css                     # 1,900+ lines design system
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Redis (optional — caching gracefully degrades without it)
- Amazon PA API credentials (optional — falls back to mock)

### Installation

```bash
# Clone the repo
git clone https://github.com/gangadarapavandurgasantoshm24-lab/PricePilot.git
cd PricePilot/pricepilot-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your settings (Redis URL, Amazon credentials)

# Start the backend
npm start
```

Open `pricepilot-frontend/index.html` in your browser (or serve with any static server).

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Redis (optional)
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# Amazon PA API (optional — uses mock if not set)
AMAZON_ACCESS_KEY=your_key
AMAZON_SECRET_KEY=your_secret
AMAZON_PARTNER_TAG=your_tag
AMAZON_REGION=us-east-1

# Browser (Playwright)
BROWSER_HEADLESS=true
BROWSER_MAX_PAGES=5
BROWSER_QUEUE_TIMEOUT=60000
```

---

## 🧪 Tests

```bash
cd pricepilot-backend
npm test
```

**18 test suites · 264 tests · 0 failures**

| Suite | Tests | Coverage |
|-------|-------|---------|
| categoryDetector | 30 | Keyword matching, all 7 categories |
| providerRouting | 22 | Capability matrix, E2E routing |
| playwrightProviders | 24 | Interface compliance, mock fallback |
| categorySearch | 15 | API integration with category detection |
| browserQueue | 10 | Concurrency, error recovery |
| browserManager | 16 | Lifecycle, metrics |
| providerFactory | 11 | Strategy dispatch |
| pagination | 10 | page/limit/hasNextPage |
| platformManager | — | Provider orchestration |
| searchApi | — | Full search API |
| + 8 more suites | — | Filtering, sorting, pricing, analytics... |

---

## 🛣️ API Reference

### `GET /api/search`

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `category` | string | Override auto-detection (`electronics`, `fashion`, `beauty`, `medicine`, `home`, `groceries`) |
| `platform` | string | Filter to one platform |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `sortBy` | string | `lowestPrice`, `highestRating`, `highestDiscount`, `alphabetical` |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `brand` | string | Brand filter |
| `minRating` | number | Minimum rating filter |
| `availability` | boolean | Stock availability filter |

**Response includes:** `detectedCategory`, `categoryLabel`, `providerResults`, `hasNextPage`, `totalResults`, `cached`, `executionTimeMs`

### `GET /api/providers` — Provider health dashboard

### `GET /api/browser` — Playwright browser pool metrics

### `GET /api/analytics` — Search analytics

---

## 🗓️ Development Timeline

| Week | Focus | Deliverables |
|------|-------|-------------|
| **1** | Foundation | Express + routes + basic product API |
| **2** | Frontend | Vanilla JS dashboard, search, comparison table |
| **3** | Backend expansion | Redis cache, search history, analytics, multi-platform mock |
| **4** | Provider framework | Provider Registry, Factory, Health Monitor, Strategy Pattern, HTTP Client, Retry System |
| **5** | Browser infrastructure | Playwright base, BrowserManager, BrowserQueue, Amazon Official API, Pagination |
| **6** | Real providers | Category routing, Myntra + Purplle + Meesho Playwright providers, 264 tests |
| **7** *(planned)* | AI features | Semantic search, product matching, ingredient analysis, deal explanation |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## ⚖️ Legal & Compliance

- All Playwright providers only access **publicly visible** search results
- No authentication bypass, CAPTCHA bypass, or rate-limit circumvention
- Platform integrations must comply with each platform's Terms of Service
- This project is for **educational and portfolio purposes**

---

## 📄 License

MIT © 2025 Gangadara Pavan Durga Santosh M

---

<p align="center">Built with ❤️ as a production-architecture showcase project</p>
