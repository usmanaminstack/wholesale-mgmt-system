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
    Package
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
            fetchData(); // Refresh balances
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader">Loading Dashboard...</div>
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    padding: '10px',
                    borderRadius: '12px'
                }}>
                    <Icon size={22} />
                </div>
                {trend && (
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: trend > 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', fontWeight: '500' }}>{title}</p>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.025em' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '4px' }}>PKR</span>
                    {value?.toLocaleString()}
                </h3>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '8px' }}>Guddu Traders</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Wholesale Distributor & Cold Drink Distributor</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                    />
                    <img src="/logo.png" alt="Guddu Traders" style={{ width: '64px', height: '64px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'none' }} />
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <StatCard title={`${periodLabel} Sales`} value={stats?.todaySales} icon={TrendingUp} color="#3b82f6" trend={isToday ? 12 : null} />
                <StatCard title={`${periodLabel} Net Profit`} value={stats?.todayProfit} icon={Wallet} color="#10b981" />
                <StatCard title={`${periodLabel} Expenses`} value={stats?.todayExpenses} icon={Receipt} color="#ef4444" trend={isToday ? -5 : null} />
                <StatCard title="Total Receivable" value={stats?.totalReceivable} icon={ArrowDownRight} color="#6366f1" />
                <StatCard title="Total Payable" value={stats?.totalPayable} icon={ArrowUpRight} color="#f59e0b" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px' }}><Package size={20} color="var(--primary)" /></div>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{periodLabel} Sales</h3>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>PKR {stats?.todaySales?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}><TrendingUp size={20} color="var(--success)" /></div>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isToday ? "Today's Profit" : "Selected Profit"}</h3>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--success)' }}>PKR {stats?.todayProfit?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash in Hand</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button onClick={() => { setAdjustData({ ...adjustData, accountType: 'Cash' }); setShowAdjustModal(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>Adjust</button>
                            <Wallet size={18} color="rgba(255,255,255,0.8)" />
                        </div>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>PKR {stats?.cashInHand?.toLocaleString() || 0}</h2>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash in Bank</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button onClick={() => { setAdjustData({ ...adjustData, accountType: 'Bank' }); setShowAdjustModal(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>Adjust</button>
                            <TrendingUp size={18} color="rgba(255,255,255,0.8)" />
                        </div>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>PKR {stats?.cashInBank?.toLocaleString() || 0}</h2>
                </div>
                <div className="card" style={{ border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Alerts</h3>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>{stats?.lowStockCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '400' }}>Low Stock</span></h2>
                </div>
            </div>

            {stats?.zeroCostProductsCount > 0 && (
                <div className="card" style={{ backgroundColor: '#fff7ed', border: '1px solid #fbbf24', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <AlertTriangle color="#d97706" size={32} />
                    <div>
                        <h4 style={{ margin: 0, color: '#92400e' }}>Profit Calculation Warning</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#b45309' }}>
                            <strong>{stats.zeroCostProductsCount} products</strong> have no cost price set. Sales of these products will show 100% profit, which is inaccurate.
                            <a href="/inventory" style={{ marginLeft: '10px', fontWeight: '700', color: '#d97706' }}>Fix in Inventory →</a>
                        </p>
                    </div>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '32px'
            }}
                className="dashboard-grid"
            >
                <div className="card" style={{ border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertTriangle size={20} color="var(--accent)" /> Low Stock Alerts
                        </h3>
                        <button style={{ fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#f1f5f9' }}>View Detailed</button>
                    </div>
                    {stats?.lowStockProducts.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Stock (Pieces)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.lowStockProducts.map(p => (
                                        <tr key={p._id}>
                                            <td style={{ fontWeight: '600' }}>{p.name}</td>
                                            <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{p.stockInPieces}</td>
                                            <td>
                                                <span style={{ padding: '4px 10px', borderRadius: '50px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', fontWeight: '600' }}>CRITICAL</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Activity size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                            <p>All items are currently well-stocked.</p>
                        </div>
                    )}
                </div>

                <div className="card" style={{
                    background: stats?.netPosition >= 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="card" style={{ background: 'linear-gradient(135deg, var(--success) 0%, #15803d 100%)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.2 }}>
                                <TrendingUp size={120} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', opacity: 0.9, marginBottom: '8px', display: 'block' }}>{periodLabel} NET PROFIT</span>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.05em' }}>
                                PKR {stats?.todayProfit?.toLocaleString()}
                            </h2>
                            <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                                <Link to="/reports" style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'underline', opacity: 0.9 }}>View Complete Report & Analytics →</Link>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                            {stats?.netPosition >= 0 ? 'Surplus (Positive)' : 'Deficit (Debt)'}
                        </p>

                        <div style={{ marginTop: '40px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
                                Your business is currently in a <strong>{stats?.netPosition >= 0 ? 'healthy' : 'critical'}</strong> position.
                                {stats?.netPosition >= 0 ? ' You have more money coming in than you owe.' : ' Consider recovering outstanding payments from customers.'}
                            </p>
                        </div>
                    </div>
                    {/* Abstract background shapes */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                </div>
            </div>

            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} color="var(--primary)" /> Recent Business Activity
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="flat-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Entity</th>
                                <th>Type</th>
                                <th>Debit (Buy/Sale)</th>
                                <th>Credit (Pay/Recv)</th>
                                <th>Balance after</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((act, i) => (
                                <tr key={act._id} style={{ borderBottom: i === activities.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(act.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: '600' }}>{act.entityName}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: '#f1f5f9',
                                            fontSize: '0.7rem',
                                            fontWeight: '700'
                                        }}>{act.transactionType}</span>
                                    </td>
                                    <td style={{ color: act.debit > 0 ? 'var(--danger)' : 'inherit' }}>{act.debit > 0 ? `PKR ${act.debit.toLocaleString()}` : '-'}</td>
                                    <td style={{ color: act.credit > 0 ? 'var(--success)' : 'inherit' }}>{act.credit > 0 ? `PKR ${act.credit.toLocaleString()}` : '-'}</td>
                                    <td style={{ fontWeight: '700' }}>PKR {act.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {stats?.debugInfo && stats.debugInfo.length > 0 && (
                <div className="card" style={{ marginTop: '32px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <h3 style={{ color: '#9a3412', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} /> Diagnostic: Profit-per-Item Trace
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="flat-table">
                            <thead>
                                <tr style={{ backgroundColor: '#ffedd5' }}>
                                    <th>Product Unit</th>
                                    <th>Qty</th>
                                    <th>Unit Cost Used</th>
                                    <th>Source</th>
                                    <th>Item Revenue</th>
                                    <th>Item Cost</th>
                                    <th>Item Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.debugInfo.map((d, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: '600' }}>{d.unit}</td>
                                        <td>{d.qty}</td>
                                        <td style={{ color: d.cost > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                                            PKR {d.cost?.toLocaleString()}
                                        </td>
                                        <td><span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{d.source}</span></td>
                                        <td>PKR {d.itemRevenue?.toLocaleString() || (d.qty * (d.unitPrice || 0))}</td>
                                        <td>PKR {d.calculatedItemTotalCost?.toLocaleString()}</td>
                                        <td style={{ fontWeight: '800', color: 'var(--success)' }}>
                                            PKR {((d.itemRevenue || (d.qty * (d.unitPrice || 0))) - d.calculatedItemTotalCost)?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showAdjustModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', animation: 'scaleIn 0.2s ease-out' }}>
                        <h3 style={{ marginBottom: '20px' }}>Adjust {adjustData.accountType} Balance</h3>
                        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                <button type="button" onClick={() => setAdjustData({ ...adjustData, isAdd: true })} style={{ flex: 1, backgroundColor: adjustData.isAdd ? 'var(--success)' : 'transparent', color: adjustData.isAdd ? 'white' : 'var(--text)', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700' }}>ADD (+)</button>
                                <button type="button" onClick={() => setAdjustData({ ...adjustData, isAdd: false })} style={{ flex: 1, backgroundColor: !adjustData.isAdd ? 'var(--danger)' : 'transparent', color: !adjustData.isAdd ? 'white' : 'var(--text)', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700' }}>MINUS (-)</button>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px' }}>Amount (PKR)</label>
                                <input type="number" required value={adjustData.amount} onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })} autoFocus />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px' }}>Reason / Description</label>
                                <textarea required value={adjustData.reason} onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })} placeholder="e.g. Initial balance correction, Petty cash add..." style={{ height: '80px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="submit" className="primary" style={{ flex: 1 }}>Confirm Adjustment</button>
                                <button type="button" onClick={() => setShowAdjustModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>Cancel</button>
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
              .loader { font-weight: 600; color: var(--primary); animation: pulse 1.5s infinite; }
              @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
              @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}} />
        </div>
    );
};

export default Dashboard;
