# Guddu Traders — Wholesale Management System
### Complete Project Overview for Partners / Collaborators

---

## 1. What is This System?

This is a **full-stack web-based wholesale management system** built specifically for a trading business ("Guddu Traders"). It digitizes day-to-day wholesale operations — inventory, buying & selling, customer/supplier accounts, payments, expenses, and financial reporting — all in one place.

**Business Purpose:** Replace manual registers / spreadsheets with a live, accurate system that tracks money in, money out, stock levels, and profit in real time.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React 18 + Vite | SPA, React Router v6 |
| **Styling** | Vanilla CSS | Custom design system |
| **Charts** | Chart.js + react-chartjs-2 | Dashboard graphs |
| **PDF Export** | jsPDF + html2canvas | Invoice / report download |
| **Icons** | Lucide React | Consistent icon set |
| **HTTP Client** | Axios | All API calls |
| **Backend** | Node.js + Express | REST API |
| **Database** | MongoDB + Mongoose | Hosted on MongoDB Atlas |
| **Deployment** | Railway (backend) + Vercel (frontend) | CORS configured for both |

---

## 3. Project Structure

```
wholesale-mgmt-system/
├── backend/                     ← Node/Express API
│   ├── index.js                 ← Entry point, CORS, route mounting
│   ├── config/db.js             ← MongoDB Atlas connection
│   ├── models/                  ← Mongoose schemas (10 models)
│   ├── controllers/             ← Business logic (10 controllers)
│   ├── routes/                  ← API routes (10 route files)
│   ├── utils/ledgerHelper.js    ← Shared ledger utility
│   └── scripts/clearData.js     ← Dev utility to wipe DB
│
├── frontend/                    ← React + Vite app
│   ├── src/
│   │   ├── App.jsx              ← Root routing
│   │   ├── pages/               ← 9 full-page views
│   │   ├── components/          ← Layout, Sidebar, DateFilter
│   │   ├── context/             ← Global state (if any)
│   │   ├── utils/               ← Date helpers, formatting
│   │   └── styles/              ← CSS modules / global styles
│   └── vite.config.js
│
└── railway.json                 ← Railway deployment config
```

---

## 4. Database Models (MongoDB)

### 4.1 Product
```
name, customerProductName (for invoices), category,
piecesPerCarton, costPricePerCarton, costPricePerPiece,
lastPurchasePricePerCarton, lastPurchasePricePerPiece,
pricePerCarton, pricePerPiece, stockInPieces,
lowStockThreshold, isActive
```
- Supports **dual-unit** selling (Cartons & Pieces)
- Virtual field: `stockInCartons = stockInPieces / piecesPerCarton`
- Cost price is **weighted average** — auto-updated on every purchase

### 4.2 Customer
```
name, phone, address,
totalSales, totalReceived, openingBalance, outstandingReceivable
```

### 4.3 Supplier
```
name, contactPerson, phone, email, address,
totalPurchases, totalPaid, openingBalance, outstandingPayable
```

### 4.4 Sale
```
customer (ref), customerName (guest),
items[]: { product, quantity, unit(Carton|Piece), costAtSale, priceAtSale, totalPrice }
totalAmount, receivedAmount, discount, balanceAmount,
paymentType (Cash|Credit), saleDate, isRetail
```

### 4.5 Purchase
```
supplier (ref),
items[]: { product, quantityInCartons, costPerCarton, totalCost }
grandTotal, paidAmount, balanceAmount,
paymentType (Cash|Credit), purchaseDate, referenceId
```

### 4.6 Payment
```
entityType (Customer|Supplier), entityId,
amount, paymentDate, paymentMethod (Cash|Bank|Other), note
```

### 4.7 Ledger
```
entityType (Customer|Supplier), entityId,
transactionType (Sale|Purchase|Payment|Return),
referenceId, debit, credit, balance (running), description, date
```
> The Ledger is a **double-entry style running balance** per entity. Every sale, purchase, payment, and return automatically creates a ledger entry.

### 4.8 Expense
```
category (rent/fuel/salary etc.), amount,
description, paymentMethod (Cash|Bank Transfer|Cheque), expenseDate
```

### 4.9 SaleReturn
```
saleId (ref), customer (ref),
items[]: { product, quantity, unit, priceAtReturn }
totalRefundAmount, reason, returnDate
```

### 4.10 CashAdjustment
```
accountType (Cash|Bank), amount, reason, adjustmentDate
```
> Used to manually correct Cash-in-Hand or Bank balance (e.g. opening balance entry, corrections)

---

## 5. API Endpoints

| Prefix | Resource | Operations |
|---|---|---|
| `/api/products` | Products / Inventory | CRUD |
| `/api/customers` | Customers | CRUD + Ledger |
| `/api/suppliers` | Suppliers | CRUD + Ledger |
| `/api/purchases` | Purchases (stock-in) | CRUD + stock update + supplier ledger |
| `/api/sales` | Sales (stock-out) | CRUD + stock update + customer ledger |
| `/api/payments` | Customer/Supplier Payments | CRUD |
| `/api/expenses` | Business Expenses | CRUD |
| `/api/returns` | Sale Returns | Create + stock reversal |
| `/api/cash` | Cash Adjustments | Create + Query |
| `/api/reports` | Dashboard & Reports | Read-only analytics |

### Report Endpoints
| Route | Returns |
|---|---|
| `GET /api/reports/dashboard` | Today's sales, COGS, expenses, profit, receivables, payables, cash in hand, bank balance, low stock |
| `GET /api/reports/sales` | Filtered sales list with products populated |
| `GET /api/reports/purchases` | Filtered purchases list with suppliers populated |
| `GET /api/reports/profit` | Gross profit, net profit, COGS, total expenses for date range |
| `GET /api/reports/trends` | Monthly sales & expenses for last 6 months |
| `GET /api/reports/activity` | Last 10 ledger entries (recent activity feed) |

All date-filtered endpoints accept `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` query params.

---

## 6. Key Business Logic

### 6.1 Inventory / Stock
- Stock is stored **in pieces** always (internally)
- Display converts to cartons: `stockInPieces / piecesPerCarton`
- **Purchase** → adds pieces to stock
- **Sale** → deducts pieces from stock (handles Carton or Piece unit)
- **Sale Return** → restores pieces back to stock
- **Delete Purchase/Sale** → fully reverses stock changes

### 6.2 Average Cost Pricing
When a new purchase arrives:
```
newAvgCostPerPiece = (oldQty × oldCost + newTotalCost) / totalQty
```
Cost price per carton and per piece are both updated. This ensures COGS (cost of goods sold) is accurate.

### 6.3 Profit Calculation
```
Gross Profit = Total Sales Revenue - COGS
Net Profit   = Gross Profit - Total Expenses
```
COGS per sale item = `costAtSale × quantity` (stored at time of sale, not current cost).

### 6.4 Cash & Bank Balance
Calculated dynamically as:
```
Cash In Hand = (Cash Sales received + Customer cash payments)
             - (Cash Purchases paid + Supplier cash payments + Cash Expenses)
             + Cash Adjustments

Cash In Bank = Same formula but for Bank/Cheque transactions
```

### 6.5 Double-Entry Ledger
Every transaction auto-creates ledger entries:

| Event | Customer Ledger | Supplier Ledger |
|---|---|---|
| Sale | Debit (customer owes) | — |
| Sale Payment received | Credit (reduces balance) | — |
| Purchase | — | Credit (we owe supplier) |
| Purchase Payment made | — | Debit (reduces balance) |
| Return | Credit (reduces customer balance) | — |

Running balance is calculated per entity using the previous balance.

### 6.6 Guest / Walk-in Customers
- Sales can be made without selecting a customer (walk-in retail)
- If a credit balance > 0 exists, system **auto-creates a Customer record**
- `isRetail` flag distinguishes retail vs wholesale sales

---

## 7. Frontend Pages

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/` | KPI cards (sales, profit, cash), charts, low stock alerts, recent activity |
| **Inventory** | `/inventory` | Product list, add/edit/delete products, stock levels, low stock highlighting |
| **Purchases** | `/purchases` | Record stock purchases from suppliers, view history, edit/delete with full reversal |
| **Sales** | `/sales` | Create sales (wholesale/retail), multi-item, invoice print/PDF, edit/delete |
| **Customers** | `/customers` | Customer list, opening balance, ledger view per customer, add payments |
| **Suppliers** | `/suppliers` | Supplier list, opening balance, ledger view per supplier, add payments |
| **Payments** | `/payments` | Standalone payments to/from customers or suppliers |
| **Expenses** | `/expenses` | Log business expenses by category |
| **Reports** | `/reports` | Sales report, purchase report, profit report — all date-filterable, PDF export |

---

## 8. Shared Components

| Component | Purpose |
|---|---|
| `Layout.jsx` | Shell with sidebar + main content area |
| `Sidebar.jsx` | Navigation menu with icons (lucide-react), highlights active route |
| `DateFilter.jsx` | Reusable date range picker used across all filterable pages |

---

## 9. Deployment Setup

### Backend — Railway
- Deployed via `railway.json` with NIXPACKS builder
- Start command: `node index.js`
- Health check at `/` → returns `{ status: 'active', message: 'Guddu Traders API is running' }`
- Environment variables needed:
  - `MONGODB_URI` — MongoDB Atlas connection string
  - `PORT` — Auto-set by Railway
  - `FRONTEND_URL` — Vercel frontend URL (for CORS)

### Frontend — Vercel
- Standard Vite build (`npm run build`)
- CORS is already whitelisted for `*.vercel.app` in backend CORS config
- The `VITE_API_URL` env variable should point to the Railway backend URL

### CORS Configuration
The backend allows:
- `http://localhost:5173` and `http://localhost:5174` (dev)
- The `FRONTEND_URL` environment variable
- Any `*.vercel.app` domain (auto-allowed)

---

## 10. Local Development — How to Run

### Backend
```bash
cd backend
npm install
# Create .env file with: MONGODB_URI=<your-atlas-uri>
node index.js
# OR: npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Create .env file with: VITE_API_URL=http://localhost:5000
npm run dev
# App runs on http://localhost:5173
```

---

## 11. Important Notes for the Developer

1. **Delete = Full Reversal** — Deleting a sale or purchase reverses stock, customer/supplier totals, AND removes ledger entries. This keeps data consistent.

2. **costAtSale is captured at time of sale** — Even if the product cost changes later (new purchase), historical profit reports stay accurate.

3. **Weighted average cost** — Cost price is recalculated on every new purchase. Deleting a purchase tries to reverse the average.

4. **No authentication** — The system currently has **no login/user system**. It is expected to run in a trusted environment (local network or private URL). Adding auth is a potential future enhancement.

5. **No multi-branch support** — Single store/warehouse assumed.

6. **Opening Balances** — For existing businesses migrating to this system, customers and suppliers have an `openingBalance` field. Cash adjustments are used to set the opening cash/bank balance.

7. **Low Stock Alerts** — Each product has a `lowStockThreshold`. The dashboard flags products at or below this threshold.

8. **PDF Generation** — Sales page supports invoice printing. Reports page supports PDF export via jsPDF + html2canvas.

---

## 12. Potential Future Enhancements

- [ ] User authentication & role-based access (admin vs viewer)
- [ ] Multi-user support (salesperson tracking)
- [ ] WhatsApp/SMS invoice sharing
- [ ] Mobile-responsive layout improvements
- [ ] Barcode scanning for inventory
- [ ] Purchase order / quotation workflow
- [ ] Multi-warehouse / branch support
- [ ] Automated daily backup / data export

---

*Document generated: April 2026*
*Codebase location: `wholesale-mgmt-system/` (monorepo — backend + frontend)*
