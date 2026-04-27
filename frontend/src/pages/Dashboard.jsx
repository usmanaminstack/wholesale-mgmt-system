import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import DateFilter from '../components/DateFilter';
import {
    TrendingUp,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Wallet,
    TrendingDown,
    Activity,
    Package,
    Plus,
    Minus,
    ExternalLink
} from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustData, setAdjustData] = useState({ accountType: 'Cash', amount: '', reason: '', isAdd: true });

    const isToday = startDate === endDate && startDate === getLocalDateString();
    const periodLabel = isToday ? "Today's" : "Period";

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sData, aData] = await Promise.all([
                api.get(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/reports/activity?startDate=${startDate}&endDate=${endDate}`)
            ]);
            setStats(sData.data);
            setActivities(aData.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalAmount = adjustData.isAdd ? parseFloat(adjustData.amount) : -parseFloat(adjustData.amount);
            await api.post('/cash/adjust', {
                accountType: adjustData.accountType,
                amount: finalAmount,
                reason: adjustData.reason
            });
            setShowAdjustModal(false);
            setAdjustData({ accountType: 'Cash', amount: '', reason: '', isAdd: true });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>Guddu Traders...</div>
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color, trend, bg }) => (
        <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            borderLeft: `6px solid ${color}`,
            background: bg || 'white'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    padding: '8px',
                    borderRadius: '10px'
                }}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: trend > 0 ? 'var(--success)' : 'var(--danger)', backgroundColor: trend > 0 ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: '20px' }}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.025em' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px', fontWeight: '600' }}>PKR</span>
                    {value?.toLocaleString()}
                </h3>
            </div>
        </div>
    );

    return (
        <div className="animate-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>
                        <span style={{ color: 'var(--primary)' }}>Guddu</span> Traders
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} color="var(--primary)" /> Premium Cold Drink Wholesale Distribution
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        onClear={() => { setStartDate(''); setEndDate(''); }}
                    />
                    <button onClick={() => setShowAdjustModal(true)} className="primary" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                        <Plus size={20} /> Adjust Cash
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <StatCard title={`${periodLabel} Sales`} value={stats?.todaySales} icon={TrendingUp} color="var(--primary)" trend={isToday ? 12 : null} />
                <StatCard title={`${periodLabel} Profit`} value={stats?.todayProfit} icon={Wallet} color="var(--success)" />
                <StatCard title={`${periodLabel} Expenses`} value={stats?.todayExpenses} icon={Receipt} color="var(--danger)" trend={isToday ? -5 : null} />
                <StatCard title="Receivable" value={stats?.totalReceivable} icon={ArrowDownRight} color="var(--accent)" />
                <StatCard title="Payable" value={stats?.totalPayable} icon={ArrowUpRight} color="#f59e0b" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="card" style={{ 
                    background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #1e293b 100%)', 
                    color: 'white', 
                    border: 'none',
                    padding: '32px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800' }}>Cash in Hand</h3>
                            <button onClick={() => { setAdjustData({ ...adjustData, accountType: 'Cash' }); setShowAdjustModal(true); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Adjust</button>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.025em' }}>PKR {stats?.cashInHand?.toLocaleString() || 0}</h2>
                        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                            <Activity size={14} /> Total Available Capital
                        </div>
                    </div>
                    <Wallet size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', color: 'rgba(255,255,255,0.05)' }} />
                </div>

                <div className="card" style={{ 
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', 
                    color: 'white', 
                    border: 'none',
                    padding: '32px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800' }}>Bank Balance</h3>
                            <button onClick={() => { setAdjustData({ ...adjustData, accountType: 'Bank' }); setShowAdjustModal(true); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Adjust</button>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.025em' }}>PKR {stats?.cashInBank?.toLocaleString() || 0}</h2>
                        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                            <TrendingUp size={14} /> Business Account
                        </div>
                    </div>
                    <ArrowUpRight size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', color: 'rgba(255,255,255,0.05)' }} />
                </div>
            </div>

            {stats?.zeroCostProductsCount > 0 && (
                <div className="card" style={{ backgroundColor: '#fff7ed', border: '2px solid #fbbf24', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                    <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '16px' }}><AlertTriangle color="#d97706" size={28} /></div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: '#92400e', fontWeight: '800', fontSize: '1.1rem' }}>Cost Data Missing</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: '#b45309', fontWeight: '500' }}>
                            <strong>{stats.zeroCostProductsCount} products</strong> have no cost price set. This makes profit reports inaccurate.
                        </p>
                    </div>
                    <Link to="/inventory" style={{ backgroundColor: '#d97706', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>Fix Now</Link>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '32px',
                marginBottom: '40px'
            }} className="dashboard-grid">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertTriangle size={20} color="var(--danger)" /> Critical Stock
                        </h3>
                        <Link to="/inventory" style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}>View All →</Link>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        {stats?.lowStockProducts.length > 0 ? (
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Pieces Left</th>
                                        <th style={{ textAlign: 'right' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.lowStockProducts.map(p => (
                                        <tr key={p._id}>
                                            <td data-label="Product" style={{ fontWeight: '700' }}>{p.name}</td>
                                            <td data-label="Stock" style={{ color: 'var(--danger)', fontWeight: '800' }}>{p.stockInPieces}</td>
                                            <td data-label="Status" style={{ textAlign: 'right' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '50px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', fontWeight: '800' }}>CRITICAL</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Package size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                <p style={{ fontWeight: '600' }}>Stock levels are healthy.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ 
                    background: 'var(--bg)', 
                    padding: '32px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    border: '2px dashed var(--border)',
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <TrendingUp size={40} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800' }}>{periodLabel} Net Profit</h3>
                        <h2 style={{ margin: '8px 0', fontSize: '3rem', fontWeight: '900', color: 'var(--success)', letterSpacing: '-0.05em' }}>PKR {stats?.todayProfit?.toLocaleString()}</h2>
                    </div>
                    <Link to="/reports" className="primary" style={{ textDecoration: 'none', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        Full Analysis <ExternalLink size={18} />
                    </Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} color="var(--primary)" /> Business Activity
                    </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Party Name</th>
                                <th>Category</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th style={{ textAlign: 'right' }}>Running Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((act, i) => (
                                <tr key={act._id}>
                                    <td data-label="Date">{new Date(act.date).toLocaleDateString()}</td>
                                    <td data-label="Entity" style={{ fontWeight: '700' }}>{act.entityName}</td>
                                    <td data-label="Type">
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            backgroundColor: '#f1f5f9',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: 'var(--text-muted)'
                                        }}>{act.transactionType}</span>
                                    </td>
                                    <td data-label="Debit" style={{ color: 'var(--danger)', fontWeight: '600' }}>{act.debit > 0 ? `PKR ${act.debit.toLocaleString()}` : '—'}</td>
                                    <td data-label="Credit" style={{ color: 'var(--success)', fontWeight: '600' }}>{act.credit > 0 ? `PKR ${act.credit.toLocaleString()}` : '—'}</td>
                                    <td data-label="Balance" style={{ fontWeight: '800', textAlign: 'right' }}>PKR {act.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAdjustModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '32px' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontWeight: '800' }}>Adjust {adjustData.accountType}</h3>
                        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
                                <button type="button" onClick={() => setAdjustData({ ...adjustData, isAdd: true })} style={{ flex: 1, backgroundColor: adjustData.isAdd ? 'var(--success)' : 'transparent', color: adjustData.isAdd ? 'white' : 'var(--text-muted)', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}><Plus size={16} /> ADD</button>
                                <button type="button" onClick={() => setAdjustData({ ...adjustData, isAdd: false })} style={{ flex: 1, backgroundColor: !adjustData.isAdd ? 'var(--danger)' : 'transparent', color: !adjustData.isAdd ? 'white' : 'var(--text-muted)', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}><Minus size={16} /> DEDUCT</button>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>AMOUNT (PKR)</label>
                                <input type="number" required value={adjustData.amount} onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })} autoFocus style={{ fontSize: '1.2rem', fontWeight: '800' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>REASON</label>
                                <textarea required value={adjustData.reason} onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })} placeholder="Initial correction, expense, etc." style={{ height: '100px', padding: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="primary" style={{ flex: 2, padding: '14px' }}>Save Changes</button>
                                <button type="button" onClick={() => setShowAdjustModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', fontWeight: '700' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
              @media (max-width: 900px) {
                .dashboard-grid { grid-template-columns: 1fr !important; }
              }
              .loader { animation: pulse 1.5s infinite; }
              @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            `}} />
        </div>
    );
};

export default Dashboard;

