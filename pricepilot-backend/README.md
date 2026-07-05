# PricePilot Backend

Express.js REST API backend for the PricePilot frontend.

This backend uses local JavaScript array data today. Store-specific service files are separated and combined through `services/marketplaceService.js`, so real APIs from Amazon, Flipkart, Myntra, Nykaa, Croma, Ajio, Reliance Digital, and Tata CliQ can be added later without changing controllers.

## Tech Stack

- Node.js
- Express.js
- REST API
- Postman for API testing

No MongoDB, Mongoose, JWT, authentication, SQL, Firebase, or TypeScript is used.

## Setup

```bash
cd pricepilot-backend
npm install
npm start
```

Server runs on:

```text
http://localhost:5000
```

Open the connected PricePilot web app here:

```text
http://localhost:5000/
```

The frontend is served by Express and calls the backend APIs automatically when you search from the smart search bar.

## API Endpoints

### Health Check

```http
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "Backend Running"
}
```

### Search Product

```http
GET /api/search?q=red shoes
```

Searches local product data, calculates final payable price, and sorts cheapest first.

### Compare Product

```http
GET /api/compare?q=red shoes
```

Returns comparison data for matching products:

- Store Name
- Product Price
- GST
- Shipping
- Bank Offer
- Coupon Discount
- Final Payable Price
- Delivery Days

### Product Details

```http
GET /api/products/:id
```

Example:

```http
GET /api/products/1
```

### Stores

```http
GET /api/stores
```

Returns all supported stores.

## Final Price Formula

```text
Final Payable Price = Product Price + GST + Shipping - Bank Offer - Coupon Discount
```

Reusable utility:

```text
utils/calculateFinalPrice.js
```

## Postman Testing

Create a new Postman collection and add these requests:

- `GET http://localhost:5000/api/health`
- `GET http://localhost:5000/api/search?q=red shoes`
- `GET http://localhost:5000/api/compare?q=red shoes`
- `GET http://localhost:5000/api/products/1`
- `GET http://localhost:5000/api/stores`

For the full working website, use the browser instead of Postman:

- `http://localhost:5000/`
- Search `red shoes`
- Search `iphone`
- Search `headphones`
- Search `beauty kit`
- Search `summer dress`
- Search `red kurta`
- Search `dolo tablet`

## Folder Structure

```text
pricepilot-backend/
  app.js
  server.js
  routes/
  controllers/
  services/
  data/
  middleware/
  utils/
  README.md
```
