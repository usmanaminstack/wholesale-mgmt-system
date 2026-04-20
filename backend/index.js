const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            process.env.FRONTEND_URL
        ];

        // Match exact or check if Vercel URL (case insensitive)
        const isAllowed = allowedOrigins.some(o => o && origin.toLowerCase() === o.toLowerCase());

        if (isAllowed || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            console.log('CORS Blocked Origin:', origin);
            callback(null, true); // Temporarily allow all to bypass 502 legacy confusion, OR use callback(new Error('CORS'))
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Error Handlers for logging
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ UNHANDLED REJECTION:', reason);
});

// Health Check (Responsive immediately)
app.get('/', (req, res) => res.json({ status: 'active', message: 'Guddu Traders API is running' }));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/returns', require('./routes/saleReturnRoutes'));
app.use('/api/cash', require('./routes/cashRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);

    // Connect to DB in background
    connectDB().then(() => {
        console.log('✅ MongoDB Ready');
    }).catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
    });
});
