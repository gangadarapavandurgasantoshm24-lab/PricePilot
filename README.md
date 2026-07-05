# PricePilot

> A full-stack price comparison platform for discovering products, comparing
> store offers, and calculating the true final payable price.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](pricepilot-backend/package.json)

PricePilot brings product discovery and price comparison into one clean
experience. It combines prices, GST, shipping charges, bank offers, and coupon
discounts to show the amount a customer will actually pay—not just the listed
price.

## Project status

> **Work in progress:** The frontend interface and Express.js backend are
> complete. The next phases will add live marketplace APIs and scraping, an
> AI-powered natural-language recommendation layer, price-drop alerts and other
> advanced features, automated testing, and production deployment.

## Highlights

- Search products across multiple marketplace categories
- Compare offers from supported online stores
- Calculate the final payable price automatically
- Sort matching products from lowest to highest final price
- Browse dedicated search, product, alert, and dashboard screens
- Use a modular service layer designed for future marketplace API integrations
- Access the same data through a straightforward REST API

## Supported stores

Amazon, Flipkart, Myntra, Nykaa, Croma, Ajio, Reliance Digital, Tata CLiQ,
PharmEasy, Netmeds, Apollo Pharmacy, and Amazon Pharmacy.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| API | REST |
| Data | Local JavaScript dataset |

## Project structure

```text
PricePilot/
├── pricepilot-frontend/
│   ├── assets/
│   ├── images/
│   ├── alerts/
│   ├── dashboard/
│   ├── product/
│   ├── search/
│   ├── index.html
│   ├── app.js
│   └── style.css
└── pricepilot-backend/
    ├── controllers/
    ├── data/
    ├── middleware/
    ├── routes/
    ├── services/
    ├── utils/
    ├── app.js
    └── server.js
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm

### Installation

```bash
git clone https://github.com/gangadarapavandurgasantoshm24-lab/PricePilot.git
cd PricePilot/pricepilot-backend
npm install
npm start
```

Open [http://localhost:5000](http://localhost:5000) in your browser. Express
serves the frontend and exposes the API from the same application.

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check API availability |
| `GET` | `/api/search?q=iphone` | Search and sort matching products |
| `GET` | `/api/compare?q=iphone` | Compare matching marketplace offers |
| `GET` | `/api/products/:id` | Retrieve one product by ID |
| `GET` | `/api/stores` | List supported stores |

Example:

```bash
curl "http://localhost:5000/api/search?q=headphones"
```

## Price calculation

```text
Final payable price =
  product price + GST + shipping - bank offer - coupon discount
```

The reusable calculation logic lives in
[`calculateFinalPrice.js`](pricepilot-backend/utils/calculateFinalPrice.js).

## Current scope

This version uses a local product dataset and simulated marketplace services.
The service-based backend structure makes it possible to connect official store
APIs later without redesigning the controllers or routes.

## Roadmap

- Connect live marketplace APIs
- Add user accounts and saved wishlists
- Persist price history in a database
- Send price-drop alerts
- Add automated tests and deployment workflows

## Contributing

Contributions are welcome. Fork the repository, create a focused feature branch,
and open a pull request with a clear description of the change.

## License

This project is available under the ISC License.
