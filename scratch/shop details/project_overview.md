# Wholesale Management System — Project Overview

> **Codebase**: `wholesale-mgmt-system` | **Business Name**: Guddu Traders  
> **Documentation Type**: Architecture & Structure Analysis

---

## 1. Tech Stack

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.2.0 |
| Build Tool | Vite | 5.1.4 |
| Routing | React Router DOM | 6.22.1 |
| HTTP Client | Axios | 1.6.2 |
| Charts | Chart.js + react-chartjs-2 | 4.4.1 / 5.2.0 |
| Icons | Lucide React | 0.321.0 |
| Notifications | react-hot-toast | 2.6.0 |
| Date Handling | date-fns | 3.3.1 |
| PDF Export | jsPDF + html2canvas | 2.5.1 / 1.4.1 |
| Testing | Cypress (E2E) | 13.6.0 |

### Backend
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | — |
| Framework | Express.js | 4.18.2 |
| Database | MongoDB (via Mongoose) | 8.3.2 |
| PDF Generation | PDFKit | 0.19.1 |
| AI Integration | Google Generative AI | 0.24.1 |
| Environment | dotenv | 16.3.1 |
| CORS | cors | 2.8.5 |

### Infrastructure / Deployment
- **Hosting Platform**: Railway (both frontend and backend have `railway.json`)
- **Database**: MongoDB Atlas (via `MONGO_URI` env variable)
- **Frontend URL**: Vercel (allowed in CORS whitelist)

---

## 2. Folder Structure

```
wholesale-mgmt-system/
├── backend/                        # Node.js + Express API server
│   ├── config/
│   │   └── db.js                   # MongoDB connection setup
│   ├── controllers/                # Business logic handlers (11 files)
│   │   ├── cashController.js
│   │   ├── customerController.js   # Largest — includes PDF statement
│   │   ├── dailyLedgerController.js
│   │   ├── expenseController.js
│   │   ├── paymentController.js
│   │   ├── productController.js
│   │   ├── purchaseController.js
│   │   ├── reportController.js     # Dashboard, sales, profit reports
│   │   ├── saleController.js
│   │   ├── saleReturnController.js
│   │   └── supplierController.js
│   ├── models/                     # Mongoose schemas (10 models)
│   │   ├── CashAdjustment.js
│   │   ├── Customer.js
│   │   ├── Expense.js
│   │   ├── Ledger.js               # Double-entry ledger entries
│   │   ├── Payment.js
│   │   ├── Product.js
│   │   ├── Purchase.js
│   │   ├── Sale.js
│   │   ├── SaleReturn.js
│   │   └── Supplier.js
│   ├── routes/                     # Express route definitions (10 files)
│   ├── utils/
│   │   └── ledgerHelper.js         # Shared ledger entry logic
│   ├── scripts/                    # One-off utility scripts
│   ├── index.js                    # Entry point — Express app bootstrap
│   ├── .env                        # Environment variables
│   └── package.json
│
├── frontend/                       # React + Vite SPA
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── assets/                 # Images (logo.png, etc.)
│   │   ├── components/             # Reusable UI components (6 files)
│   │   │   ├── ApiInterceptor.jsx  # Axios interceptor wrapper
│   │   │   ├── DateFilter.jsx      # Date range filter UI
│   │   │   ├── Layout.jsx          # App shell (header + sidebar)
│   │   │   ├── Modal.jsx           # Generic modal dialog
│   │   │   ├── SearchableSelect.jsx # Searchable dropdown
│   │   │   └── Sidebar.jsx         # Navigation sidebar
│   │   ├── context/
│   │   │   └── LoadingContext.jsx  # Global loading state
│   │   ├── pages/                  # Full-page views (10 pages)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Purchases.jsx
│   │   │   ├── Sales.jsx           # Largest page (~48KB)
│   │   │   ├── Customers.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── DailyLedger.jsx
│   │   ├── styles/                 # Additional CSS files
│   │   ├── utils/
│   │   │   ├── api.js              # Axios instance with base URL
│   │   │   └── dateUtils.js        # Date formatting helpers
│   │   ├── App.jsx                 # Root component + routing
│   │   ├── App.css                 # App-level styles
│   │   ├── index.css               # Global design tokens (largest CSS — 14KB)
│   │   └── main.jsx                # Vite entry point
│   ├── cypress/                    # E2E test suite
│   ├── vite.config.js
│   └── package.json
│
├── PARTNER_OVERVIEW.md             # Business/partner documentation
├── mobile_ux_test_report.md        # Mobile UX test results
├── railway.json                    # Root Railway deployment config
└── README.md
```

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite)                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │   │
│  │  │  Pages   │  │Components│  │  Context (Loading)  │ │   │
│  │  └────┬─────┘  └──────────┘  └────────────────────┘ │   │
│  │       │                                              │   │
│  │  ┌────▼──────────────────────────────────────────┐  │   │
│  │  │  Axios Instance (utils/api.js)                │  │   │
│  │  │  + ApiInterceptor (loading state + toasts)    │  │   │
│  │  └────────────────────┬──────────────────────────┘  │   │
│  └───────────────────────┼──────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP REST (JSON)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND (Railway)                          │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Express.js Server (index.js)                     │     │
│  │  ┌──────────┐  ┌─────────────┐  ┌──────────────┐ │     │
│  │  │  Routes  │→ │ Controllers │→ │    Models    │ │     │
│  │  └──────────┘  └─────────────┘  └──────┬───────┘ │     │
│  │                        │               │          │     │
│  │                ┌───────▼───────┐        │          │     │
│  │                │ ledgerHelper  │        │          │     │
│  │                │ (utils)       │        │          │     │
│  │                └───────────────┘        │          │     │
│  └──────────────────────────────────────── ┼ ─────────┘     │
└───────────────────────────────────────────┼─────────────────┘
                                            │ Mongoose ODM
                                            ▼
                              ┌─────────────────────────┐
                              │   MongoDB Atlas (Cloud)  │
                              │   Database: wholesale_mgmt│
                              └─────────────────────────┘
```

**Pattern**: Classic **MVC** (Model–View–Controller) on backend. Frontend is a **feature-based SPA** with no micro-frontend separation.

---

## 4. State Management

> **No Redux, No Zustand, No external state library.**

State management is **local and lightweight**:

| Mechanism | Where Used | Purpose |
|---|---|---|
| `React.useState` | Every page component | Local form state, list data, modal visibility |
| `React Context API` | `LoadingContext.jsx` | **Only one global state**: API loading spinner |
| Props | Component to component | Basic prop drilling |
| `react-hot-toast` | Via `ApiInterceptor` | Global toast notifications (not really "state") |

**Key Observation**: Each page component (`Sales.jsx`, `Customers.jsx`, etc.) manages its own data fetching and state internally using `useState` + `useEffect`. There is no shared data cache or global store.

---

## 5. API Structure

### Base URL
```
Development:  http://127.0.0.1:5000/api
Production:   $VITE_API_BASE_URL (env variable → Railway URL)
```

### Route Map

| Module | Base Path | Endpoints |
|---|---|---|
| **Products** | `/api/products` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| **Suppliers** | `/api/suppliers` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| **Customers** | `/api/customers` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `GET /:id/ledger`, `GET /:id/statement` (PDF) |
| **Purchases** | `/api/purchases` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| **Sales** | `/api/sales` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| **Payments** | `/api/payments` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| **Expenses** | `/api/expenses` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| **Reports** | `/api/reports` | `GET /dashboard`, `GET /sales`, `GET /purchases`, `GET /profit`, `GET /trends`, `GET /activity`, `GET /daily-ledger` |
| **Returns** | `/api/returns` | Standard CRUD |
| **Cash** | `/api/cash` | Cash adjustment endpoints |

**API Style**: RESTful. JSON request/response. No versioning (`/v1/`).

---

## 6. Authentication Flow

> [!WARNING]
> **No authentication system is implemented.**

- There is **no login page**, no JWT tokens, no session management, no role-based access control (RBAC).
- The backend has **no auth middleware** — all API endpoints are publicly accessible.
- The `Layout.jsx` header hardcodes the text `"Admin"` as the user label (static, not dynamic).
- CORS is configured to allow `localhost` and Vercel origins, providing minimal network-level restriction.

**Implication**: This is an **internal-use, single-user system** designed for a single business (Guddu Traders) with the assumption that only trusted parties access it.

---

## 7. Main Modules

| # | Module | Frontend Page | Backend Controller | Description |
|---|---|---|---|---|
| 1 | **Dashboard** | `Dashboard.jsx` | `reportController.js` | Overview stats, charts, recent activity |
| 2 | **Inventory** | `Inventory.jsx` | `productController.js` | Product stock management |
| 3 | **Sales** | `Sales.jsx` | `saleController.js` | Create/manage sales orders, invoices |
| 4 | **Purchases** | `Purchases.jsx` | `purchaseController.js` | Supplier purchase orders |
| 5 | **Customers** | `Customers.jsx` | `customerController.js` | Customer CRM + ledger + PDF statement |
| 6 | **Suppliers** | `Suppliers.jsx` | `supplierController.js` | Supplier management + ledger |
| 7 | **Payments** | `Payments.jsx` | `paymentController.js` | Cash/credit payment recording |
| 8 | **Expenses** | `Expenses.jsx` | `expenseController.js` | Business expense tracking |
| 9 | **Reports** | `Reports.jsx` | `reportController.js` | Sales/purchase/profit analytical reports |
| 10 | **Daily Ledger** | `DailyLedger.jsx` | `dailyLedgerController.js` | Day-wise transaction ledger |
| 11 | **Sale Returns** | _(embedded)_ | `saleReturnController.js` | Return/refund management |
| 12 | **Cash Adjustments** | _(embedded)_ | `cashController.js` | Manual cash balance corrections |

---

## 8. Reusable Components

Located in `frontend/src/components/`:

| Component | File | Purpose |
|---|---|---|
| **Layout** | `Layout.jsx` | App shell — wraps all pages with Sidebar + Header + loading overlay |
| **Sidebar** | `Sidebar.jsx` | Navigation menu with route links |
| **Modal** | `Modal.jsx` | Generic overlay modal dialog |
| **SearchableSelect** | `SearchableSelect.jsx` | Dropdown with live search/filter capability |
| **DateFilter** | `DateFilter.jsx` | Date range picker (used across reports, ledger, etc.) |
| **ApiInterceptor** | `ApiInterceptor.jsx` | Non-visual — attaches Axios request/response interceptors |

---

## 9. Utilities & Helpers

### Frontend (`frontend/src/utils/`)

| File | Exports | Description |
|---|---|---|
| `api.js` | `api` (default) | Configured Axios instance with `baseURL` from env |
| `dateUtils.js` | `getLocalDateString`, `formatDate`, `formatDateShort`, `getYesterdayDate`, `getDaysAgoDate` | Timezone-safe date formatting helpers (specifically handles UTC→Pakistan timezone offset bug) |

### Backend (`backend/utils/`)

| File | Exports | Description |
|---|---|---|
| `ledgerHelper.js` | `addLedgerEntry` | Shared utility for writing double-entry ledger records. Auto-calculates running balance for both Customer and Supplier entities. |

### Backend Config (`backend/config/`)

| File | Description |
|---|---|
| `db.js` | MongoDB connection function using `mongoose.connect()` — called asynchronously after server starts |

---

## 10. Backend Communication Flow

```
Frontend Page Component
       │
       │ calls api.get('/customers') or api.post('/sales', data)
       ▼
  utils/api.js  (Axios instance)
       │
       │ Request interceptor fires → setLoading(true)
       ▼
  ApiInterceptor.jsx
       │
       │ HTTP Request over network (JSON)
       ▼
  Express Router  (e.g. /api/sales → saleRoutes.js)
       │
       │ routes to handler function
       ▼
  Controller  (e.g. saleController.js → createSale)
       │
       ├─► Mongoose Model (.find(), .save(), .populate())
       │         │
       │         ▼
       │    MongoDB Atlas  (read/write)
       │
       ├─► ledgerHelper.addLedgerEntry()  [on mutations]
       │         │
       │         ▼
       │    Ledger collection  (running balance written)
       │
       └─► res.json({ success, message, data })
                 │
                 ▼
  ApiInterceptor.jsx
       │ Response interceptor fires:
       │   → setLoading(false)
       │   → toast.success(message)  [for non-GET]
       │   → toast.error(message)    [on error]
       ▼
Frontend Page Component
       │ updates local state with response data
       │ re-renders UI
       ▼
     User sees updated data
```

### Key Communication Behaviors
- **Loading State**: Every API call automatically toggles a global full-screen loading spinner via `LoadingContext`.
- **Error Handling**: All errors are caught centrally by `ApiInterceptor` and shown as toast notifications — no scattered try/catch needed in pages.
- **Success Notifications**: Non-GET requests auto-show success toasts using the `message` field from API response.
- **PDF Statements**: Customer statements are generated **server-side** using PDFKit and streamed back as binary PDF response.
- **AI Integration**: Backend has `@google/generative-ai` dependency — used in report or analytics feature (Gemini AI integration).

---

*Documentation generated: 2026-07-09 | Codebase: wholesale-mgmt-system*
