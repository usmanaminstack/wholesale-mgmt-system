const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const CashAdjustment = require('../models/CashAdjustment');

exports.getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryDateStart = new Date();
        queryDateStart.setHours(0, 0, 0, 0);
        let queryDateEnd = new Date();
        queryDateEnd.setHours(23, 59, 59, 999);

        if (startDate) {
            queryDateStart = new Date(startDate);
            queryDateStart.setHours(0, 0, 0, 0);
        }
        if (endDate) {
            queryDateEnd = new Date(endDate);
            queryDateEnd.setHours(23, 59, 59, 999);
        }

        const todaySalesDocs = await Sale.find({ saleDate: { $gte: queryDateStart, $lte: queryDateEnd } });
        let todaySalesTotal = 0;
        let todayCOGSTotal = 0;
        let debugInfo = [];

        for (const sale of todaySalesDocs) {
            todaySalesTotal += sale.totalAmount;
            for (const item of sale.items) {
                let cost = item.costAtSale;
                let source = 'Stored';

                if (!cost) {
                    const prod = await Product.findById(item.product);
                    if (prod) {
                        source = 'Fallback';
                        const ppc = prod.piecesPerCarton || 1;
                        const cCost = prod.costPricePerCarton || 0;
                        const pCost = prod.costPricePerPiece || 0;
                        cost = item.unit === 'Carton' ? (cCost || pCost * ppc) : (pCost || cCost / ppc);
                    } else {
                        source = 'NotFound';
                    }
                }

                const itemTotalCost = (cost || 0) * item.quantity;
                const itemRevenue = item.totalPrice || (item.quantity * item.priceAtSale);
                todayCOGSTotal += itemTotalCost;

                debugInfo.push({
                    saleId: sale._id,
                    product: item.product,
                    unit: item.unit,
                    qty: item.quantity,
                    unitPrice: item.priceAtSale,
                    itemRevenue: itemRevenue,
                    cost: cost,
                    source: source,
                    calculatedItemTotalCost: itemTotalCost
                });
            }
        }

        console.log('Today Profit Debug:', {
            sales: todaySalesTotal,
            cogs: todayCOGSTotal,
            profit: todaySalesTotal - todayCOGSTotal
        });

        const todayExpenses = await Expense.aggregate([
            { $match: { expenseDate: { $gte: queryDateStart, $lte: queryDateEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const todayExpensesTotal = todayExpenses[0]?.total || 0;

        const customers = await Customer.find({});
        const totalReceivable = customers.reduce((acc, curr) => acc + curr.outstandingReceivable, 0);

        const suppliers = await Supplier.find({});
        const totalPayable = suppliers.reduce((acc, curr) => acc + curr.outstandingPayable, 0);

        const lowStockProducts = await Product.find({
            $expr: { $lte: ['$stockInPieces', '$lowStockThreshold'] }
        });

        // Find products with missing cost data
        const zeroCostProductsCount = await Product.countDocuments({
            costPricePerCarton: { $lte: 0 },
            costPricePerPiece: { $lte: 0 }
        });

        // 1. CASH IN HAND & BANK (OVERALL)
        // Helper to sum by payment method
        const getBalance = async (methodType) => {
            const methods = methodType === 'Bank' ? ['Bank Transfer', 'Cheque'] : ['Cash'];

            const [sIn, pIn, purOut, payOut, expOut, adjSum] = await Promise.all([
                Sale.aggregate([{ $match: { paymentType: { $in: methods } } }, { $group: { _id: null, total: { $sum: '$receivedAmount' } } }]),
                Payment.aggregate([{ $match: { entityType: 'Customer', paymentMethod: { $in: methods } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                Purchase.aggregate([{ $match: { paymentType: { $in: methods } } }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
                Payment.aggregate([{ $match: { entityType: 'Supplier', paymentMethod: { $in: methods } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                Expense.aggregate([{ $match: { paymentMethod: { $in: methods } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                CashAdjustment.aggregate([{ $match: { accountType: methodType } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
            ]);

            const totalIn = (sIn[0]?.total || 0) + (pIn[0]?.total || 0);
            const totalOut = (purOut[0]?.total || 0) + (payOut[0]?.total || 0) + (expOut[0]?.total || 0);
            const adjustments = adjSum[0]?.total || 0;
            return totalIn - totalOut + adjustments;
        };

        const cashInHand = await getBalance('Cash');
        const cashInBank = await getBalance('Bank');

        res.json({
            todaySales: todaySalesTotal,
            todayCOGS: todayCOGSTotal,
            todayExpenses: todayExpensesTotal,
            todayProfit: todaySalesTotal - todayCOGSTotal - todayExpensesTotal,
            totalReceivable,
            totalPayable,
            netPosition: totalReceivable - totalPayable,
            cashInHand,
            cashInBank,
            lowStockCount: lowStockProducts.length,
            lowStockProducts: lowStockProducts.slice(0, 5),
            zeroCostProductsCount,
            debugInfo
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.saleDate = { $gte: start, $lte: end };
        }
        const sales = await Sale.find(query).populate('customer').populate('items.product');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPurchaseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.purchaseDate = { $gte: start, $lte: end };
        }
        const purchases = await Purchase.find(query).populate('supplier').populate('items.product');
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProfitReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(0);
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const sales = await Sale.find({ saleDate: { $gte: start, $lte: end } });

        let totalSales = 0;
        let totalCostOfGoodsSold = 0;

        for (const sale of sales) {
            totalSales += sale.totalAmount;
            for (const item of sale.items) {
                let cost = item.costAtSale;

                // Fallback for old sales or sales with 0 cost
                if (!cost) {
                    const prod = await Product.findById(item.product);
                    if (prod) {
                        const ppc = prod.piecesPerCarton || 1;
                        const cCost = prod.costPricePerCarton || 0;
                        const pCost = prod.costPricePerPiece || 0;
                        cost = item.unit === 'Carton' ? (cCost || pCost * ppc) : (pCost || cCost / ppc);
                    }
                }

                totalCostOfGoodsSold += (cost || 0) * item.quantity;
            }
        }

        const expenses = await Expense.find({ expenseDate: { $gte: start, $lte: end } });
        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        const grossProfit = totalSales - totalCostOfGoodsSold;

        res.json({
            totalSales,
            totalExpenses,
            totalCOGS: totalCostOfGoodsSold,
            grossProfit: grossProfit,
            netProfit: grossProfit - totalExpenses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTrends = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const sales = await Sale.aggregate([
            { $match: { saleDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
                    revenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const expenses = await Expense.aggregate([
            { $match: { expenseDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$expenseDate" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({ sales, expenses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getRecentActivity = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const Ledger = require('../models/Ledger');
        const activities = await Ledger.find(query)
            .sort({ date: -1 })
            .limit(10)
            .populate('entityId');

        const formattedActivities = activities.map(act => ({
            ...act._doc,
            entityName: act.entityId?.name || 'Walk-in'
        }));

        res.json(formattedActivities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
