import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DateFilter from '../components/DateFilter';
import { Plus, CreditCard, ArrowRight, Wallet, UserCheck, Search, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, X, Info } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';
import Modal from '../components/Modal';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        entityType: 'Customer',
        entityId: '',
        amount: 0,
        paymentMethod: 'Cash',
        note: ''
    });

    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());

    useEffect(() => {
        fetchPayments();
    }, [startDate, endDate]);

    useEffect(() => {
        fetchEntities();
    }, []);

    const fetchPayments = async () => {
        let url = '/payments';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const { data } = await api.get(url);
        setPayments(data);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment record? Balances will be reverted.')) {
            try {
                await api.delete(`/payments/${id}`);
                fetchPayments();
            } catch (err) {}
        }
    };

    const fetchEntities = async () => {
        const [cData, sData] = await Promise.all([
            api.get('/customers'),
            api.get('/suppliers')
        ]);
        setCustomers(cData.data);
        setSuppliers(sData.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/payments', formData);
            setShowModal(false);
            setFormData({ entityType: 'Customer', entityId: '', amount: 0, paymentMethod: 'Cash', note: '' });
            fetchPayments();
        } catch (err) {
            alert(err.message);
        }
    };


    const entities = formData.entityType === 'Customer' ? customers : suppliers;

    return (
        <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Cash Payments</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Manage collections from customers and payments to vendors.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        onClear={() => { setStartDate(''); setEndDate(''); }}
                    />
                    <button onClick={() => setShowModal(true)} className="primary desktop-only" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                        <Plus size={20} /> Record Entry
                    </button>
                </div>
            </div>

            <button data-testid="record-payment-fab" onClick={() => setShowModal(true)} className="fab-button mobile-only" title="Record Payment">
                <Plus size={32} />
            </button>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Transaction Date</th>
                                <th>Flow Type</th>
                                <th>Party Name</th>
                                <th>Amount</th>
                                <th className="desktop-only">Method</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p._id}>
                                    <td data-label="Date">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: '700' }}>
                                            <Calendar size={14} color="var(--primary)" /> {new Date(p.paymentDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td data-label="Type">
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '10px',
                                            backgroundColor: p.entityType === 'Customer' ? '#f0fdf4' : '#fef2f2',
                                            color: p.entityType === 'Customer' ? '#166534' : '#ef4444',
                                            fontSize: '0.75rem',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.025em'
                                        }}>
                                            {p.entityType === 'Customer' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                            {p.entityType === 'Customer' ? 'Collection' : 'Payment'}
                                        </div>
                                    </td>
                                    <td data-label="Party">
                                        <div style={{ fontWeight: '800', color: 'var(--text)' }}>{p.entityId?.name || '---'}</div>
                                    </td>
                                    <td data-label="Amount">
                                        <div style={{ fontWeight: '900', fontSize: '1.1rem', color: p.entityType === 'Customer' ? 'var(--success)' : 'var(--danger)' }}>
                                            {p.entityType === 'Customer' ? '+' : '-'} PKR {p.amount?.toLocaleString()}
                                        </div>
                                    </td>
                                    <td data-label="Method" className="desktop-only">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            <Wallet size={14} /> {p.paymentMethod}
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div className="action-btn" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleDelete(p._id)} style={{ padding: '10px', color: 'var(--danger)', background: '#fef2f2', border: 'none', borderRadius: '12px', cursor: 'pointer' }} title="Remove Entry"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '600' }}>No payment records found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="480px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h3 data-testid="modal-title" style={{ margin: 0, fontWeight: '900', fontSize: '1.5rem' }}>Record Cash Flow</h3>
                    <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Transaction Flow</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, entityType: 'Customer', entityId: '' })}
                                style={{ 
                                    padding: '16px',
                                    borderRadius: '16px',
                                    fontWeight: '800',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: formData.entityType === 'Customer' ? 'var(--primary-light)' : 'white', 
                                    border: `2px solid ${formData.entityType === 'Customer' ? 'var(--primary)' : 'var(--border)'}`, 
                                    color: formData.entityType === 'Customer' ? 'var(--primary)' : 'var(--text-muted)' 
                                }}
                            >
                                <ArrowDownLeft size={24} />
                                Collection
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, entityType: 'Supplier', entityId: '' })}
                                style={{ 
                                    padding: '16px',
                                    borderRadius: '16px',
                                    fontWeight: '800',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: formData.entityType === 'Supplier' ? '#fef2f2' : 'white', 
                                    border: `2px solid ${formData.entityType === 'Supplier' ? 'var(--danger)' : 'var(--border)'}`, 
                                    color: formData.entityType === 'Supplier' ? 'var(--danger)' : 'var(--text-muted)' 
                                }}
                            >
                                <ArrowUpRight size={24} />
                                Settlement
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>{formData.entityType === 'Customer' ? 'Customer Name' : 'Supplier Name'}</label>
                        <select
                            required
                            value={formData.entityId} onChange={e => setFormData({ ...formData, entityId: e.target.value })}
                            style={{ fontWeight: '700' }}
                        >
                            <option value="">Select Account...</option>
                            {entities.map(e => (
                                <option key={e._id} value={e._id}>
                                    {e.name} (Bal: PKR {(formData.entityType === 'Customer' ? e.outstandingReceivable : e.outstandingPayable)?.toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Amount (PKR)</label>
                            <input type="number" placeholder="0.00" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} style={{ fontWeight: '900', fontSize: '1.1rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Method</label>
                            <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} style={{ fontWeight: '700' }}>
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Reference / Note</label>
                        <input type="text" placeholder="Optional reference info..." value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                        <button type="submit" className="primary" style={{ flex: 2, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            Record Transaction <ArrowRight size={20} />
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '800' }}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Payments;
