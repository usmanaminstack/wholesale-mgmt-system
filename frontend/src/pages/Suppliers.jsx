import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Truck, Search, Phone, MapPin, DollarSign, Briefcase, Trash2, History, X, CheckCircle, ArrowRight } from 'lucide-react';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', openingBalance: '' });
    const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', note: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingLedger, setLoadingLedger] = useState(false);

    useEffect(() => { fetchSuppliers(); }, []);

    const fetchSuppliers = async () => {
        const { data } = await api.get('/suppliers');
        setSuppliers(data);
    };

    const handleDeleteSupplier = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier? All ledger history will be removed.')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchSuppliers();
            } catch (err) {
                alert(err.response?.data?.message || err.message);
            }
        }
    };

    const fetchLedger = async (supplierId) => {
        setLoadingLedger(true);
        try {
            const { data } = await api.get(`/suppliers/${supplierId}/ledger`);
            setLedger(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLedger(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            const paymentBody = {
                entityType: 'Supplier',
                entityId: selectedSupplier._id,
                amount: parseFloat(paymentData.amount),
                paymentMethod: paymentData.method,
                note: paymentData.note || `Manual payment to Supplier - ${new Date().toLocaleDateString()}`
            };
            await api.post('/payments', paymentBody);
            setPaymentData({ amount: '', method: 'Cash', note: '' });
            fetchLedger(selectedSupplier._id);
            fetchSuppliers();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/suppliers', formData);
            setShowModal(false);
            setFormData({ name: '', phone: '', address: '', openingBalance: '' });
            fetchSuppliers();
        } catch (err) {
            alert(err.message);
        }
    };

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Suppliers</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Manage warehouse accounts and payables.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="primary" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                    <Plus size={20} /> Add Provider
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Search by company name..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            style={{ padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem' }} 
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Company / Warehouse</th>
                                <th>Contact Information</th>
                                <th>Total Payable</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s._id}>
                                    <td data-label="Supplier">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Supplier Account</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Contact">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text)', fontWeight: '600' }}>
                                                <Phone size={14} color="#f59e0b" /> {s.phone}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <MapPin size={14} /> {s.address}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Payable">
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', backgroundColor: s.outstandingPayable > 0 ? '#fee2e2' : '#dcfce7', color: s.outstandingPayable > 0 ? '#991b1b' : '#166534', fontWeight: '900', fontSize: '1rem' }}>
                                            PKR {s.outstandingPayable.toLocaleString()}
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setSelectedSupplier(s); setShowLedgerModal(true); fetchLedger(s._id); }} style={{ padding: '10px 20px', backgroundColor: '#fff7ed', color: '#f59e0b', fontWeight: '800', fontSize: '0.85rem', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <History size={16} /> History
                                            </button>
                                            <button onClick={() => handleDeleteSupplier(s._id)} style={{ padding: '10px', color: 'var(--danger)', backgroundColor: '#fef2f2', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '450px', padding: '32px' }}>
                        <h3 style={{ marginTop: 0, fontWeight: '800', fontSize: '1.5rem' }}>New Supplier</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>COMPANY NAME</label>
                                <input type="text" placeholder="e.g. ABC Beverages Warehouse" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>PHONE NUMBER</label>
                                <input type="text" placeholder="03xx-xxxxxxx" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>OPENING BALANCE (PAYABLE)</label>
                                <input type="number" placeholder="Enter previous debt if any" value={formData.openingBalance} onChange={e => setFormData({ ...formData, openingBalance: e.target.value })} style={{ border: '2px solid #ffedd5' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>WAREHOUSE ADDRESS</label>
                                <textarea placeholder="Location..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ height: '100px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                                <button type="submit" className="primary" style={{ flex: 2, padding: '16px', borderRadius: '16px' }}>Save Profile</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '700' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showLedgerModal && selectedSupplier && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
                    <div className="card modal-content" style={{ width: '100%', maxWidth: '1000px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '24px' }}>
                        {/* Header */}
                        <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #fff7ed, #ffffff)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Briefcase size={32} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.025em' }}>{selectedSupplier.name}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                        Payable: <span style={{ color: 'var(--danger)', fontWeight: '800' }}>PKR {selectedSupplier.outstandingPayable.toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowLedgerModal(false)} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div className="ledger-container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, overflow: 'hidden' }}>
                            {/* History */}
                            <div style={{ overflowY: 'auto', padding: '32px', borderRight: '1px solid var(--border)' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <History size={20} color="#f59e0b" /> Payment History
                                </h4>
                                {loadingLedger ? (
                                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '600' }}>Fetching ledger...</div>
                                ) : (
                                    <table className="modern-table" style={{ border: 'none' }}>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Dr (-)</th>
                                                <th>Cr (+)</th>
                                                <th style={{ textAlign: 'right' }}>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ledger.map((entry, idx) => (
                                                <tr key={idx}>
                                                    <td data-label="Date">{new Date(entry.date).toLocaleDateString()}</td>
                                                    <td data-label="Type">
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: '800',
                                                            padding: '4px 10px',
                                                            borderRadius: '8px',
                                                            backgroundColor: entry.transactionType === 'Purchase' ? '#fee2e2' : '#dcfce7',
                                                            color: entry.transactionType === 'Purchase' ? '#991b1b' : '#166534'
                                                        }}>
                                                            {entry.transactionType.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td data-label="Dr" style={{ color: 'var(--success)', fontWeight: '700' }}>{entry.debit > 0 ? `-${entry.debit.toLocaleString()}` : '—'}</td>
                                                    <td data-label="Cr" style={{ color: 'var(--danger)', fontWeight: '700' }}>{entry.credit > 0 ? `+${entry.credit.toLocaleString()}` : '—'}</td>
                                                    <td data-label="Bal" style={{ textAlign: 'right', fontWeight: '900' }}>{entry.balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {ledger.length === 0 && (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No record found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Payment */}
                            <div style={{ padding: '32px', backgroundColor: '#fcfcfc', overflowY: 'auto' }}>
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={18} /></div>
                                        Pay Supplier
                                    </h4>
                                    <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Amount Paid</label>
                                            <input
                                                type="number" required
                                                value={paymentData.amount}
                                                onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                                placeholder="PKR 0.00"
                                                style={{ fontSize: '1.25rem', fontWeight: '800' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Method</label>
                                            <select
                                                value={paymentData.method}
                                                onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                                            >
                                                <option value="Cash">Cash Payment</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Cheque">Cheque</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Note</label>
                                            <textarea
                                                value={paymentData.note}
                                                onChange={e => setPaymentData({ ...paymentData, note: e.target.value })}
                                                placeholder="Payment details..."
                                                style={{ height: '80px', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                        <button type="submit" className="primary" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer' }}>
                                            Record Payment <ArrowRight size={20} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
              @media (max-width: 900px) {
                .ledger-container { grid-template-columns: 1fr !important; overflow-y: auto !important; }
                .ledger-container > div:first-child { border-right: none !important; border-bottom: 1px solid var(--border); }
              }
            `}} />
        </div>
    );
};

export default Suppliers;

