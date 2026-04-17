import React, { useState, useEffect } from 'react';
import api from '../utils/api';
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

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sData, aData] = await Promise.all([
                    api.get('/reports/dashboard'),
                    api.get('/reports/activity')
                ]);
                setStats(sData.data);
                setActivities(aData.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '8px' }}>Guddu Traders</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Wholesale Distributor & Cold Drink Distributor</p>
                </div>
                <img src="/logo.png" alt="Guddu Traders" style={{ width: '64px', height: '64px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <StatCard title="Today's Sales" value={stats?.todaySales} icon={TrendingUp} color="#3b82f6" trend={12} />
                <StatCard title="Today's Net Profit" value={stats?.todayProfit} icon={Wallet} color="#10b981" />
                <StatCard title="Today's Expenses" value={stats?.todayExpenses} icon={Receipt} color="#ef4444" trend={-5} />
                <StatCard title="Total Receivable" value={stats?.totalReceivable} icon={ArrowDownRight} color="#6366f1" />
                <StatCard title="Total Payable" value={stats?.totalPayable} icon={ArrowUpRight} color="#f59e0b" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px' }}><Package size={20} color="var(--primary)" /></div>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Sales</h3>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>PKR {stats?.todaySales?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}><TrendingUp size={20} color="var(--success)" /></div>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Profit</h3>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--success)' }}>PKR {stats?.todayProfit?.toLocaleString()}</h2>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px' }}><AlertTriangle size={20} color="var(--secondary)" /></div>
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
                        <h3 style={{ marginBottom: '8px', opacity: 0.9 }}>Net Liquidity Position</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '32px' }}>Total Receivables - Total Payables</p>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>PKR</span>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                                {Math.abs(stats?.netPosition)?.toLocaleString()}
                            </h2>
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

            <style dangerouslySetInnerHTML={{
                __html: `
              @media (max-width: 900px) {
                .dashboard-grid { grid-template-columns: 1fr !important; }
              }
              .loader { font-weight: 600; color: var(--primary); animation: pulse 1.5s infinite; }
              @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            `}} />
        </div>
    );
};

export default Dashboard;
