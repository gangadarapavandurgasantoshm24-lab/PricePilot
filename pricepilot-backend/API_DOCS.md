# PricePilot API Documentation

**Version:** 1.0.0 (Week 4 – Provider Framework)  
**Base URL:** `http://localhost:5000/api`  
**Content-Type:** `application/json`

> All endpoints return JSON. Successful responses include `"success": true`.
> Error responses include `"success": false` and a `"message"` field.

---

## Endpoints

### 1. Health Check

```
GET /api/health
```

Returns server liveness.

**Response 200**
```json
{
  "success": true,
  "message": "Backend Running"
}
```

---

### 2. Search Products

```
GET /api/search
```

Searches across all enabled providers.

**Query Parameters**

| Parameter    | Type   | Required | Description                                                  |
|--------------|--------|----------|--------------------------------------------------------------|
| `q`          | string | ✅       | Search term (e.g. `?q=red+shoes`)                           |
| `sortBy`     | string | ❌       | `lowestPrice` \| `lowestListingPrice` \| `highestRating` \| `highestDiscount` \| `platform` \| `alphabetical` \| `newest` |
| `brand`      | string | ❌       | Filter by brand name (case-insensitive)                     |
| `platform`   | string | ❌       | Filter by platform key (e.g. `amazon`, `flipkart`)          |
| `category`   | string | ❌       | Filter by category (partial match)                           |
| `minPrice`   | number | ❌       | Minimum current price (INR)                                 |
| `maxPrice`   | number | ❌       | Maximum current price (INR)                                 |
| `minRating`  | number | ❌       | Minimum rating (0–5)                                        |
| `minDiscount`| number | ❌       | Minimum discount percentage                                 |
| `availability`| boolean | ❌    | `true` = in-stock only, `false` = out-of-stock only         |

**Response 200**
```json
{
  "success": true,
  "query": "red shoes",
  "cached": false,
  "totalPlatforms": 10,
  "totalResults": 24,
  "executionTimeMs": 312,
  "providerResults": [
    {
      "platform": "amazon",
      "name": "amazon",
      "success": true,
      "count": 4,
      "executionTimeMs": 98,
      "strategy": "mock"
    }
  ],
  "products": [
    {
      "platform": "flipkart",
      "productId": "fk-001",
      "productName": "Nike Red Running Shoes",
      "brand": "Nike",
      "category": "footwear",
      "currentPrice": 5999,
      "originalPrice": 7999,
      "gst": 0,
      "shipping": 0,
      "bankOffer": 500,
      "couponDiscount": 200,
      "totalSavings": 700,
      "finalPayablePrice": 5299,
      "discountPercentage": 25,
      "rating": 4.3,
      "reviewCount": 1200,
      "image": "https://...",
      "productUrl": "https://...",
      "availability": true,
      "source": "mock",
      "fetchedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response 400**
```json
{
  "success": false,
  "message": "Search query is required. Use /api/search?q=laptop"
}
```

---

### 3. Search Single Platform

```
GET /api/platform/:platform
```

Searches a single provider.

**Path Parameters**

| Parameter  | Description                    |
|------------|--------------------------------|
| `platform` | Provider key (e.g. `amazon`)  |

**Query Parameters** – Same as `/api/search`.

**Response 200** – Same shape as `/api/search`.

**Response 404**
```json
{
  "success": false,
  "message": "Unsupported platform: xyz",
  "supportedPlatforms": ["amazon", "flipkart", ...]
}
```

---

### 4. List Supported Platforms

```
GET /api/platforms
```

**Response 200**
```json
{
  "success": true,
  "platforms": [
    "amazon",
    "flipkart",
    "nykaa",
    "apollo",
    "pharmeasy",
    "tata1mg",
    "myntra",
    "ajio",
    "reliancedigital",
    "croma"
  ]
}
```

---

### 5. Provider Health Dashboard

```
GET /api/providers
```

Returns health status and configuration for all registered providers.

**Response 200**
```json
{
  "success": true,
  "summary": {
    "total": 10,
    "healthy": 8,
    "degraded": 1,
    "unhealthy": 1
  },
  "providers": [
    {
      "provider": "amazon",
      "status": "Healthy",
      "strategy": "mock",
      "priority": 1,
      "enabled": true,
      "averageResponseTime": 124,
      "successfulRequests": 84,
      "failedRequests": 1,
      "totalRequests": 85,
      "lastError": null,
      "lastChecked": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Provider status values**

| Status      | Meaning                                              |
|-------------|------------------------------------------------------|
| `Healthy`   | No failures recorded                                |
| `Degraded`  | Some failures, but at least one success             |
| `Unhealthy` | All requests have failed                            |
| `Disabled`  | Provider is disabled in `config/providers.js`       |

---

### 6. Search Analytics

```
GET /api/analytics
```

Returns aggregated metrics since server start.

**Response 200**
```json
{
  "success": true,
  "analytics": {
    "totalSearches": 142,
    "averageResponseTimeMs": 287,
    "cacheHits": 38,
    "cacheMisses": 104,
    "cacheHitRate": "26.8%",
    "cacheMissRate": "73.2%",
    "providerStats": [
      {
        "platform": "amazon",
        "successfulRequests": 140,
        "failedRequests": 2,
        "totalRequests": 142,
        "successRate": "98.6%"
      }
    ],
    "mostSearchedTerms": [
      { "term": "iphone", "count": 23 },
      { "term": "red shoes", "count": 18 }
    ],
    "mostSearchedBrands": [
      { "term": "apple", "count": 45 },
      { "term": "samsung", "count": 30 }
    ]
  }
}
```

---

### 7. Search History

```
GET /api/history
```

Returns recent search history (most-recent first).

**Query Parameters**

| Parameter | Type   | Default | Max | Description             |
|-----------|--------|---------|-----|-------------------------|
| `limit`   | number | `50`    | `100` | Max entries to return |

**Response 200**
```json
{
  "success": true,
  "count": 50,
  "history": [
    {
      "query": "iphone",
      "timestamp": "2025-01-01T12:00:00.000Z",
      "totalResults": 12,
      "executionTimeMs": 312,
      "cached": false
    }
  ]
}
```

---

## Error Codes

| HTTP Status | Meaning                                   |
|-------------|-------------------------------------------|
| `400`       | Bad request (missing or invalid params)   |
| `404`       | Resource or platform not found            |
| `500`       | Internal server error                     |

---

## Supported Platforms

| Key              | Store              | Category    |
|------------------|--------------------|-------------|
| `amazon`         | Amazon             | General     |
| `flipkart`       | Flipkart           | General     |
| `nykaa`          | Nykaa              | Beauty      |
| `apollo`         | Apollo Pharmacy    | Pharma      |
| `pharmeasy`      | PharmEasy          | Pharma      |
| `tata1mg`        | Tata 1mg           | Pharma      |
| `myntra`         | Myntra             | Fashion     |
| `ajio`           | Ajio               | Fashion     |
| `reliancedigital`| Reliance Digital   | Electronics |
| `croma`          | Croma              | Electronics |

### Platform Aliases

The API also accepts these aliases:

| Alias              | Resolves to        |
|--------------------|--------------------|
| `reliance-digital` | `reliancedigital`  |
| `reliance`         | `reliancedigital`  |
| `tata-1mg`         | `tata1mg`          |
| `1mg`              | `tata1mg`          |
| `apollo-pharmacy`  | `apollo`           |

---

## Notes

- All providers currently use the `mock` strategy (Week 4).
- Real API or Playwright integrations will be added in Week 5 without changing this interface.
- Cache TTL defaults to 30 minutes (configurable via `CACHE_TTL` in `.env`).
- Provider timeout defaults to 5000ms (configurable via `DEFAULT_TIMEOUT` in `.env`).
- Provider retries default to 2 (configurable via `RETRY_COUNT` in `.env`).
