# PricePilot Complete Working Model Test Cases

Use these test cases after starting the backend:

```bash
cd pricepilot-backend
npm start
```

Open the connected website:

```text
http://localhost:5000/
```

## Frontend + Backend Integration Test Cases

| Test Case ID | Test Scenario | Steps | Expected Result | Status |
| --- | --- | --- | --- | --- |
| TC-UI-01 | Open PricePilot web app | Open `http://localhost:5000/` in browser | Login page and dashboard UI should load with PricePilot design | Pass |
| TC-UI-02 | Login demo flow | Enter any email/password and click `Login` | Page should scroll to dashboard section | Pass |
| TC-UI-03 | Search red shoes | Type `red shoes` in smart search and click `Search` | Product cards and comparison table should update with red shoe products | Pass |
| TC-UI-04 | Cheapest product first | Search `red shoes` | Comparison table should show the lowest final payable price first | Pass |
| TC-UI-05 | Search iPhone | Type `iphone` and click `Search` | iPhone products should appear in cards/table | Pass |
| TC-UI-06 | Search headphones | Type `headphones` and click `Search` | Headphone product should appear | Pass |
| TC-UI-07 | Search beauty kit | Type `beauty kit` and click `Search` | Nykaa beauty product should appear | Pass |
| TC-UI-08 | Search summer dress | Type `summer dress` and click `Search` | Myntra dress product should appear | Pass |
| TC-UI-09 | Search red kurta | Type `red kurta` and click `Search` | Fashion kurta products from Myntra, Amazon, Ajio, and Tata CliQ should appear | Pass |
| TC-UI-10 | Search pharmacy medicine | Type `dolo tablet` and click `Search` | Pharmacy products from Apollo Pharmacy, PharmEasy, Netmeds, and Amazon Pharmacy should appear | Pass |
| TC-UI-11 | No result search | Type `laptop bag xyz` and click `Search` | Empty state should show `No matching products found` | Pass |
| TC-UI-12 | Buy Now links | Click any `Buy Now` button | Store product URL should open in a new tab | Pass |

## Postman API Test Cases

### TC-API-01: Health Check

Request:

```http
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Backend Running"
}
```

### TC-API-02: Get Supported Stores

Request:

```http
GET http://localhost:5000/api/stores
```

Expected response:

```json
{
  "success": true,
  "stores": [
    "Amazon",
    "Flipkart",
    "Myntra",
    "Nykaa",
    "Croma",
    "Ajio",
    "Reliance Digital",
    "Tata CliQ",
    "Apollo Pharmacy",
    "PharmEasy",
    "Netmeds",
    "Amazon Pharmacy"
  ]
}
```

### TC-API-03: Search Product

Request:

```http
GET http://localhost:5000/api/search?q=red%20shoes
```

Expected result:

- `success` should be `true`
- `search` should be `red shoes`
- `totalStores` should be `5`
- `products` should contain matching red shoe products
- Every product should include `finalPayablePrice`
- Products should be sorted by cheapest final payable price

### TC-API-04: Compare Product

Request:

```http
GET http://localhost:5000/api/compare?q=red%20shoes
```

Expected result:

- `success` should be `true`
- Products should contain:
  - `store`
  - `productPrice`
  - `gst`
  - `shipping`
  - `bankOffer`
  - `couponDiscount`
  - `finalPayablePrice`
  - `deliveryDays`
- Cheapest final payable price should come first

### TC-API-05: Product Details

### TC-API-04A: Search Fashion Product

Request:

```http
GET http://localhost:5000/api/search?q=red%20kurta
```

Expected result:

- `success` should be `true`
- Products should include fashion kurtas
- Stores should include Myntra, Amazon, Ajio, and Tata CliQ
- Cheapest final payable price should come first

### TC-API-04B: Search Pharmacy Product

Request:

```http
GET http://localhost:5000/api/search?q=dolo%20tablet
```

Expected result:

- `success` should be `true`
- Products should include Dolo/paracetamol tablet results
- Stores should include Apollo Pharmacy, PharmEasy, Netmeds, and Amazon Pharmacy
- Cheapest final payable price should come first

### TC-API-05: Product Details

Request:

```http
GET http://localhost:5000/api/products/1
```

Expected result:

- `success` should be `true`
- Product ID should be `1`
- Product should include complete product information
- Product should include `finalPayablePrice`

### TC-API-06: Product Not Found

Request:

```http
GET http://localhost:5000/api/products/999
```

Expected response:

```json
{
  "success": false,
  "message": "Product not found"
}
```

Expected status code:

```text
404
```

### TC-API-07: No Search Results

Request:

```http
GET http://localhost:5000/api/search?q=randomunknownproduct
```

Expected response:

```json
{
  "success": true,
  "search": "randomunknownproduct",
  "totalStores": 0,
  "products": []
}
```

### TC-API-08: Invalid Route

Request:

```http
GET http://localhost:5000/api/invalid
```

Expected result:

- `success` should be `false`
- Message should say route not found
- Status code should be `404`

## Final Price Calculation Test

Formula:

```text
Final Payable Price = Product Price + GST + Shipping - Bank Offer - Coupon Discount
```

Example for product ID `1`:

```text
3999 + 720 + 0 - 500 - 200 = 4019
```

Expected:

```json
{
  "finalPayablePrice": 4019
}
```

## Complete Demo Flow

1. Start backend using `npm start`.
2. Open `http://localhost:5000/`.
3. Click login.
4. Search `red shoes`.
5. Check product cards.
6. Check comparison table.
7. Confirm cheapest final price is first.
8. Click `Buy Now`.
9. Test APIs in Postman.

If all cases pass, the PricePilot working model is complete for local sample-data comparison.
