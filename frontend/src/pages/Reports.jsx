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
        <div className="animate-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '8px' }}>Analytics</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Review profit, loss, and business growth trends.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }} className="header-actions">
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                    />
                    <button onClick={handlePrint} style={{ backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px' }}>
                        <Printer size={18} /> <span className="desktop-only">Print Report</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="card" style={{ borderTop: '4px solid var(--primary)', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
                        <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}><PieChart size={20} /></div>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900' }}>PKR {profitData?.totalSales?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderTop: '4px solid #64748b', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost of Goods</span>
                        <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#64748b' }}><FileText size={20} /></div>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900' }}>PKR {profitData?.totalCOGS?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderTop: '4px solid #f59e0b', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Profit</span>
                        <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#f59e0b' }}><TrendingUp size={20} /></div>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900', color: '#f59e0b' }}>PKR {profitData?.grossProfit?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderTop: '4px solid var(--danger)', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expenses</span>
                        <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fee2e2', color: 'var(--danger)' }}><Filter size={20} /></div>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900' }}>PKR {profitData?.totalExpenses?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '8px solid var(--success)', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', gridColumn: '1 / -1', padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Net Profit Position</span>
                            <h2 style={{ margin: '8px 0 0 0', fontSize: '3rem', fontWeight: '900', color: 'var(--success)', letterSpacing: '-0.05em' }}>PKR {profitData?.netProfit?.toLocaleString()}</h2>
                        </div>
                        <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><TrendingUp size={48} /></div>
                    </div>
                    <p style={{ margin: 0, fontSize: '1rem', color: '#15803d', fontWeight: '600' }}>Profit after deducting all operational costs and item purchases.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '40px' }} className="charts-grid">
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.25rem', fontWeight: '800' }}>Sales Performance</h3>
                    {trendData && (
                        <div style={{ height: '300px' }}>
                            <Bar
                                data={{
                                    labels: trendData.sales.map(s => s._id),
                                    datasets: [{
                                        label: 'Revenue',
                                        data: trendData.sales.map(s => s.revenue),
                                        backgroundColor: '#2563eb',
                                        borderRadius: 6
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true, ticks: { font: { weight: 'bold' } } } }
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.25rem', fontWeight: '800' }}>Revenue vs Expense</h3>
                    {trendData && (
                        <div style={{ height: '300px' }}>
                            <Line
                                data={{
                                    labels: trendData.sales.map(s => s._id),
                                    datasets: [
                                        {
                                            label: 'Revenue',
                                            data: trendData.sales.map(s => s.revenue),
                                            borderColor: '#10b981',
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            fill: true,
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
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: '40px', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Transaction Summary</h3>
                    {!showDetails ? (
                        <button
                            onClick={() => setShowDetails(true)}
                            className="primary"
                            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        >
                            <Eye size={18} /> View itemized list
                        </button>
                    ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '8px' }}>
                            {startDate} — {endDate}
                        </div>
                    )}
                </div>
                {showDetails && (
                    <div style={{ overflowX: 'auto' }}>
                        {detailsLoading ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Loading records...
                            </div>
                        ) : (
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Party / Description</th>
                                        <th>Revenue</th>
                                        <th>Cost/Exp</th>
                                        <th style={{ textAlign: 'right' }}>Net Impact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map(s => (
                                        <tr key={s._id}>
                                            <td data-label="Date">{new Date(s.saleDate).toLocaleDateString()}</td>
                                            <td data-label="Type"><span style={{ color: 'var(--success)', fontWeight: '800' }}>SALE</span></td>
                                            <td data-label="Entity">{s.customer?.name || s.customerName || 'Walk-in'}</td>
                                            <td data-label="Rev" style={{ fontWeight: '700' }}>{s.totalAmount.toLocaleString()}</td>
                                            <td data-label="Cost">—</td>
                                            <td data-label="Net" style={{ color: 'var(--success)', fontWeight: '800', textAlign: 'right' }}>+{s.totalAmount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {purchases.map(p => (
                                        <tr key={p._id}>
                                            <td data-label="Date">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                                            <td data-label="Type"><span style={{ color: 'var(--danger)', fontWeight: '800' }}>PURCHASE</span></td>
                                            <td data-label="Entity">{p.supplier?.name || 'Unknown'}</td>
                                            <td data-label="Rev">—</td>
                                            <td data-label="Cost" style={{ fontWeight: '700' }}>{p.grandTotal.toLocaleString()}</td>
                                            <td data-label="Net" style={{ color: 'var(--danger)', fontWeight: '800', textAlign: 'right' }}>-{p.grandTotal.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {expenses.map(e => (
                                        <tr key={e._id}>
                                            <td data-label="Date">{new Date(e.expenseDate).toLocaleDateString()}</td>
                                            <td data-label="Type"><span style={{ color: '#f59e0b', fontWeight: '800' }}>EXPENSE</span></td>
                                            <td data-label="Entity">{e.description || e.category}</td>
                                            <td data-label="Rev">—</td>
                                            <td data-label="Cost" style={{ fontWeight: '700' }}>{e.amount.toLocaleString()}</td>
                                            <td data-label="Net" style={{ color: 'var(--danger)', fontWeight: '800', textAlign: 'right' }}>-{e.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {!showDetails && (
                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Individual transactions are hidden. Use the <b>"View itemized list"</b> button to load details.
                    </div>
                )}
            </div>

            <div className="card no-print" style={{ backgroundColor: 'var(--sidebar-bg)', color: 'white', border: 'none', marginBottom: '40px', padding: '32px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 0, color: 'var(--sidebar-hover)' }}>
                    <Info size={24} /> Financial Insights
                </h3>
                <p style={{ lineHeight: '1.7', opacity: 0.9, fontSize: '1rem', maxWidth: '900px', margin: 0 }}>
                    Our <b>Weighted Average Costing</b> system ensures your profit reports are precise. 
                    Gross Profit accounts for the exact cost of stock sold, while Net Profit factors in all operating expenses 
                    like fuel, rent, and salaries for a complete business health overview.
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
                    table { border: 1px solid #e2e8f0 !important; }
                    header, nav, .sidebar { display: none !important; }
                }
                @media (max-width: 768px) {
                    .header-actions { width: 100%; }
                    .header-actions > * { width: 100% !important; }
                    .charts-grid { grid-template-columns: 1fr !important; }
                }
            `}} />
        </div>
    );
};

export default Reports;

