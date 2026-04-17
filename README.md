# Wholesale Business Management System

A full-stack management system tailored for cold drink distributors.

## Features
- 📦 **Real-time Inventory**: Piece & Carton level stock tracking.
- 💰 **Profit Engine**: Accurate Gross/Net profit reports based on historical COGS (Cost of Goods Sold).
- 🔄 **Global Reconciliation**: Deleted transactions automatically revert stock and ledger balances.
- 📜 **Entity Ledgers**: Complete account history for every Customer and Supplier.
- 📂 **Full CRUD**: Edit and Delete support across all operational modules.
- 🖨️ **Invoice Management**: Professional PDF-ready invoices with manual price overrides.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: React (Vite), Axios, Lucide-React

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB running locally (default: `mongodb://localhost:27017/wholesale_mgmt`)

### Backend Setup
1. Navigate to the `backend` folder.
2. Run `npm install`.
3. Create a `.env` file (template provided in the folder) if you need a custom MongoDB URI.
4. Start the server:
   ```bash
   node index.js
   ```

### Frontend Setup
1. Navigate to the `frontend` folder.
2. Run `npm install`.
3. Start the development server:
   ```bash
   npm run dev
   ```

### Access
Open [http://localhost:5173](http://localhost:5173) in your browser.
