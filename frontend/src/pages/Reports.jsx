import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DateFilter from '../components/DateFilter';
import { FileText, Calendar, Filter, PieChart, Info, TrendingUp, BarChart, Printer, Eye } from 'lucide-react';
import { getLocalDateString, getDaysAgoDate } from '../utils/dateUtils';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
);

const Reports = () => {
    const [profitData, setProfitData] = useState(null);
    const [trendData, setTrendData] = useState(null);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [startDate, setStartDate] = useState(getLocalDateString(getDaysAgoDate(30)));
    const [endDate, setEndDate] = useState(getLocalDateString());

    useEffect(() => {
        fetchReports();
        fetchTrends();
        if (showDetails) {
            fetchDetails();
        }
    }, [startDate, endDate, showDetails]);

    const fetchReports = async () => {
        const { data } = await api.get(`/reports/profit?startDate=${startDate}&endDate=${endDate}`);
        setProfitData(data);
    };

    const fetchTrends = async () => {
        const { data } = await api.get('/reports/trends');
        setTrendData(data);
    };

    const fetchDetails = async () => {
        setDetailsLoading(true);
        try {
            const [sData, pData, eData] = await Promise.all([
                api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/reports/purchases?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/expenses?startDate=${startDate}&endDate=${endDate}`)
            ]);
            setSales(sData.data);
            setPurchases(pData.data);
            setExpenses(eData.data);
        } catch (err) {
            alert("Error loading details: " + err.message);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '8px' }}>Reports & Analytics</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Review your business performance and profit/loss.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                    />
                    <button onClick={handlePrint} style={{ backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="card" style={{ borderLeft: '6px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>TOTAL REVENUE</span>
                        <PieChart size={18} color="var(--primary)" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>PKR {profitData?.totalSales?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '6px solid #64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>COST OF GOODS</span>
                        <FileText size={18} color="#64748b" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>PKR {profitData?.totalCOGS?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '6px solid #f97316' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>GROSS PROFIT</span>
                        <TrendingUp size={18} color="#f97316" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#f97316' }}>PKR {profitData?.grossProfit?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '6px solid var(--danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>OPERATING EXPENSES</span>
                        <Filter size={18} color="var(--danger)" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>PKR {profitData?.totalExpenses?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '6px solid var(--success)', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '700' }}>NET PROFIT POSITION (FINAL)</span>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#dcfce7', color: 'var(--success)' }}><TrendingUp size={24} /></div>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: 'var(--success)' }}>PKR {profitData?.netProfit?.toLocaleString()}</h2>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Calculation: <strong>Gross Profit</strong> - <strong>Expenses</strong></p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '32px', marginBottom: '40px' }}>
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', fontWeight: '700' }}>Monthly Sales Performance</h3>
                    {trendData && (
                        <Bar
                            data={{
                                labels: trendData.sales.map(s => s._id),
                                datasets: [{
                                    label: 'Monthly Revenue (PKR)',
                                    data: trendData.sales.map(s => s.revenue),
                                    backgroundColor: '#3b82f6',
                                    borderRadius: 8
                                }]
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' } }
                            }}
                        />
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', fontWeight: '700' }}>Expense vs Revenue Trend</h3>
                    {trendData && (
                        <Line
                            data={{
                                labels: trendData.sales.map(s => s._id),
                                datasets: [
                                    {
                                        label: 'Revenue',
                                        data: trendData.sales.map(s => s.revenue),
                                        borderColor: '#10b981',
                                        tension: 0.4
                                    },
                                    {
                                        label: 'Expenses',
                                        data: trendData.expenses.map(e => e.total),
                                        borderColor: '#ef4444',
                                        tension: 0.4
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' } }
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: '40px', padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Detailed Transaction Summary</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {!showDetails ? (
                            <button
                                onClick={() => setShowDetails(true)}
                                className="primary"
                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                                <Eye size={16} /> Load Detailed Data
                            </button>
                        ) : (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{startDate} to {endDate}</div>
                        )}
                    </div>
                </div>
                {showDetails && (
                    <div style={{ overflowX: 'auto' }}>
                        {detailsLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ marginBottom: '12px' }}></div>
                                Fetching itemized records...
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Entity/Note</th>
                                        <th>Rev</th>
                                        <th>Cost</th>
                                        <th style={{ textAlign: 'right' }}>Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map(s => (
                                        <tr key={s._id}>
                                            <td data-label="Date">{new Date(s.saleDate).toLocaleDateString()}</td>
                                            <td data-label="Type"><span style={{ color: 'var(--success)', fontWeight: '600' }}>SALE</span></td>
                                            <td data-label="Entity">{s.customer?.name || s.customerName || 'Walk-in'}</td>
                                            <td data-label="Rev" style={{ fontWeight: '600' }}>{s.totalAmount.toLocaleString()}</td>
                                            <td data-label="Cost" style={{ color: 'var(--text-muted)' }}>-</td>
                                            <td data-label="Net" style={{ color: 'var(--success)', fontWeight: '700', textAlign: 'right' }}>+{s.totalAmount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {purchases.map(p => (
                                        <tr key={p._id}>
                                            <td data-label="Date">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                                            <td data-label="Type"><span style={{ color: 'var(--danger)', fontWeight: '600' }}>PURCH</span></td>
                                            <td data-label="Entity">{p.supplier?.name || 'Unknown'}</td>
                                            <td data-label="Rev" style={{ color: 'var(--text-muted)' }}>-</td>
                                            <td data-label="Cost" style={{ fontWeight: '600' }}>{p.grandTotal.toLocaleString()}</td>
                                            <td data-label="Net" style={{ color: 'var(--danger)', fontWeight: '700', textAlign: 'right' }}>-{p.grandTotal.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {expenses.map(e => (
                                        <tr key={e._id}>
                                            <td data-label="Date">{new Date(e.expenseDate).toLocaleDateString()}</td>
                                            <td data-label="Type"><span style={{ color: '#f59e0b', fontWeight: '600' }}>EXP</span></td>
                                            <td data-label="Entity">{e.description || e.category}</td>
                                            <td data-label="Rev" style={{ color: 'var(--text-muted)' }}>-</td>
                                            <td data-label="Cost" style={{ fontWeight: '600' }}>{e.amount.toLocaleString()}</td>
                                            <td data-label="Net" style={{ color: 'var(--danger)', fontWeight: '700', textAlign: 'right' }}>-{e.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {sales.length === 0 && purchases.length === 0 && expenses.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot style={{ backgroundColor: '#f8fafc', fontWeight: '800' }} className="desktop-only">
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'right' }}>PERIOD TOTALS:</td>
                                        <td style={{ color: 'var(--success)' }}>PKR {profitData?.totalSales?.toLocaleString()}</td>
                                        <td style={{ color: 'var(--danger)' }}>PKR {((profitData?.totalCOGS || 0) + (profitData?.totalExpenses || 0)).toLocaleString()}</td>
                                        <td style={{ backgroundColor: '#f0fdf4', color: 'var(--success)', textAlign: 'right' }}>PKR {profitData?.netProfit?.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                )}
                {!showDetails && (
                    <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f8fafc', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Detailed transaction lists are hidden to save system resources. Click <strong>"Load Detailed Data"</strong> to view.
                    </div>
                )}
            </div>

            <div className="card no-print" style={{ backgroundColor: '#1e293b', color: 'white', border: 'none', marginBottom: '40px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                    <Info size={20} color="#38bdf8" /> Accounting Methodology
                </h3>
                <p style={{ lineHeight: '1.6', opacity: 0.8, fontSize: '0.95rem', maxWidth: '800px' }}>
                    This report uses <strong>Accurate Cost Tracking</strong>. For every sale made, the system records the exact cost price of the item at that moment.
                    <br />• <strong>Gross Profit:</strong> Revenue minus the actual purchase cost of sold items.
                    <br />• <strong>Net Profit:</strong> Gross Profit minus all operational expenses (Fuel, Rent, Salaries etc.)
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
                    table { border: 1px solid #e2e8f0 !important; }
                    th, td { border: 1px solid #e2e8f0 !important; }
                    header, nav, .sidebar { display: none !important; }
                }
            `}} />
        </div>
    );
};

export default Reports;
