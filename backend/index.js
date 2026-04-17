const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const startServer = async () => {
    try {
        await connectDB();

        const app = express();

        const corsOptions = {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        };

        app.use(cors(corsOptions));
        app.use(bodyParser.json());

        // Health Check
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

        const PORT = parseInt(process.env.PORT) || 5000;
        console.log(`Attempting to start server on port ${PORT}...`);

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`SUCCESS: Server is listening on 0.0.0.0:${PORT}`);
        });

        server.on('error', (error) => {
            console.error('SERVER ERROR:', error);
        });
    } catch (err) {
        console.error('CRITICAL: Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
