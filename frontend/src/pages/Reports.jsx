import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, Calendar, Filter, PieChart, Info, TrendingUp, BarChart } from 'lucide-react';
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
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchReports();
        fetchTrends();
    }, [startDate, endDate]);

    const fetchReports = async () => {
        const { data } = await api.get(`/reports/profit?startDate=${startDate}&endDate=${endDate}`);
        setProfitData(data);
    };

    const fetchTrends = async () => {
        const { data } = await api.get('/reports/trends');
        setTrendData(data);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '8px' }}>Reports & Analytics</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Review your business performance and profit/loss.</p>
                </div>
                <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Calendar size={18} color="var(--primary)" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', border: 'none', backgroundColor: 'transparent', boxShadow: 'none' }} />
                    </div>
                    <span style={{ color: 'var(--border)' }}>|</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Calendar size={18} color="var(--primary)" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', border: 'none', backgroundColor: 'transparent', boxShadow: 'none' }} />
                    </div>
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

            <div className="card" style={{ backgroundColor: '#1e293b', color: 'white', border: 'none' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                    <Info size={20} color="#38bdf8" /> Accounting Methodology
                </h3>
                <p style={{ lineHeight: '1.6', opacity: 0.8, fontSize: '0.95rem', maxWidth: '800px' }}>
                    This report uses <strong>Accurate Cost Tracking</strong>. For every sale made, the system records the exact cost price of the item at that moment.
                    <br />• <strong>Gross Profit:</strong> Revenue minus the actual purchase cost of sold items.
                    <br />• <strong>Net Profit:</strong> Gross Profit minus all operational expenses (Fuel, Rent, Salaries etc.)
                </p>
            </div>
        </div>
    );
};

export default Reports;
