import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, User, Search, Phone, MapPin, DollarSign, Eye, History, X, CheckCircle, Trash2, ArrowRight } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', openingBalance: '' });
    const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', note: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingLedger, setLoadingLedger] = useState(false);

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        const { data } = await api.get('/customers');
        setCustomers(data);
    };

    const handleDeleteCustomer = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer? All ledger history will be removed.')) {
            try {
                await api.delete(`/customers/${id}`);
                fetchCustomers();
            } catch (err) {
                alert(err.response?.data?.message || err.message);
            }
        }
    };

    const fetchLedger = async (customerId) => {
        setLoadingLedger(true);
        try {
            const { data } = await api.get(`/customers/${customerId}/ledger`);
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
                entityType: 'Customer',
                entityId: selectedCustomer._id,
                amount: parseFloat(paymentData.amount),
                paymentMethod: paymentData.method,
                note: paymentData.note || `Manual payment from Ledger - ${new Date().toLocaleDateString()}`
            };
            await api.post('/payments', paymentBody);
            setPaymentData({ amount: '', method: 'Cash', note: '' });
            fetchLedger(selectedCustomer._id);
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/customers', formData);
        setShowModal(false);
        setFormData({ name: '', phone: '', address: '', openingBalance: '' });
        fetchCustomers();
    };

    const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Customers</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Manage credit accounts and party ledgers.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="primary" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                    <Plus size={20} /> New Customer
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name or shop..." 
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
                                <th>Name & Shop</th>
                                <th>Contact Information</th>
                                <th>Outstanding Balance</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c._id}>
                                    <td data-label="Name">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem' }}>{c.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Customer Account</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Contact">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text)', fontWeight: '600' }}>
                                                <Phone size={14} color="var(--primary)" /> {c.phone}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <MapPin size={14} /> {c.address}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Balance">
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', backgroundColor: c.outstandingReceivable > 0 ? '#fee2e2' : '#dcfce7', color: c.outstandingReceivable > 0 ? '#991b1b' : '#166534', fontWeight: '900', fontSize: '1rem' }}>
                                            PKR {c.outstandingReceivable.toLocaleString()}
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="action-btn">
                                            <button onClick={() => { setSelectedCustomer(c); setShowLedgerModal(true); fetchLedger(c._id); }} style={{ padding: '10px 16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <History size={16} /> Ledger
                                            </button>
                                            <button onClick={() => handleDeleteCustomer(c._id)} style={{ padding: '10px', color: 'var(--danger)', backgroundColor: '#fef2f2', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
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
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <h3 style={{ marginTop: 0, fontWeight: '800', fontSize: '1.5rem' }}>New Customer</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>FULL NAME</label>
                                <input type="text" placeholder="e.g. Bilal Cold Corner" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>PHONE NUMBER</label>
                                <input type="text" placeholder="03xx-xxxxxxx" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>OPENING BALANCE (DEBT)</label>
                                <input type="number" placeholder="Enter previous balance if any" value={formData.openingBalance} onChange={e => setFormData({ ...formData, openingBalance: e.target.value })} style={{ border: '2px solid var(--primary-light)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>ADDRESS</label>
                                <textarea placeholder="Shop location..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ height: '100px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                                <button type="submit" className="primary" style={{ flex: 2, padding: '16px', borderRadius: '16px' }}>Save Customer</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '700' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showLedgerModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '1000px', padding: 0, overflow: 'hidden' }}>
                        {/* Ledger Header */}
                        <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={32} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.025em' }}>{selectedCustomer.name}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                        Receivable: <span style={{ color: 'var(--danger)', fontWeight: '800' }}>PKR {selectedCustomer.outstandingReceivable.toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowLedgerModal(false)} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div className="ledger-container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, overflow: 'hidden' }}>
                            {/* History Table */}
                            <div style={{ overflowY: 'auto', padding: '32px', borderRight: '1px solid var(--border)' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <History size={20} color="var(--primary)" /> Transaction History
                                </h4>
                                {loadingLedger ? (
                                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '600' }}>Fetching ledger entries...</div>
                                ) : (
                                    <table className="modern-table" style={{ border: 'none' }}>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Debit (+)</th>
                                                <th>Credit (-)</th>
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
                                                            backgroundColor: entry.transactionType === 'Sale' ? '#e0f2fe' : '#dcfce7',
                                                            color: entry.transactionType === 'Sale' ? '#0369a1' : '#166534'
                                                        }}>
                                                            {entry.transactionType.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td data-label="Dr" style={{ color: 'var(--danger)', fontWeight: '700' }}>{entry.debit > 0 ? `+${entry.debit.toLocaleString()}` : '—'}</td>
                                                    <td data-label="Cr" style={{ color: 'var(--success)', fontWeight: '700' }}>{entry.credit > 0 ? `-${entry.credit.toLocaleString()}` : '—'}</td>
                                                    <td data-label="Bal" style={{ textAlign: 'right', fontWeight: '900' }}>{entry.balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {ledger.length === 0 && (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No record found for this customer.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Payment Panel */}
                            <div style={{ padding: '32px', backgroundColor: '#fcfcfc', overflowY: 'auto' }}>
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={18} /></div>
                                        Record Payment
                                    </h4>
                                    <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Amount Received</label>
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
                                                <option value="Cheque">Post-dated Cheque</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Note / Reference</label>
                                            <textarea
                                                value={paymentData.note}
                                                onChange={e => setPaymentData({ ...paymentData, note: e.target.value })}
                                                placeholder="e.g. Received by Ali..."
                                                style={{ height: '80px', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                        <button type="submit" className="primary" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer' }}>
                                            Save Payment <ArrowRight size={20} />
                                        </button>
                                    </form>
                                </div>

                                <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', lineHeight: '1.5', display: 'flex', gap: '10px' }}>
                                        <CheckCircle size={24} style={{ flexShrink: 0 }} /> 
                                        Recording a payment here will update the customer's balance instantly.
                                    </p>
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

export default Customers;

