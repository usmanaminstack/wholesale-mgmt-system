import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DateFilter from '../components/DateFilter';
import { Plus, CreditCard, ArrowRight, Wallet, UserCheck, Search, Trash2 } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

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
            } catch (err) {
                alert(err.response?.data?.message || err.message);
            }
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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '4px' }}>Cash Payments</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Record incoming collections and outgoing supplier settlements.</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        onClear={() => { setStartDate(''); setEndDate(''); }}
                    />
                    <button onClick={() => setShowModal(true)} className="primary" style={{ padding: '12px 24px' }}>
                        <Plus size={20} /> Record New Entry
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Flow Type</th>
                                <th>Customer / Supplier</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th className="desktop-only">Reference/Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p._id}>
                                    <td style={{ fontSize: '0.85rem' }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '4px 10px',
                                            borderRadius: '50px',
                                            backgroundColor: p.entityType === 'Customer' ? '#f0fdf4' : '#fee2e2',
                                            color: p.entityType === 'Customer' ? '#166534' : '#991b1b',
                                            fontSize: '0.75rem',
                                            fontWeight: '700'
                                        }}>
                                            {p.entityType === 'Customer' ? 'INCOMING' : 'OUTGOING'}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{p.entityId?.name || '---'}</td>
                                    <td style={{ fontWeight: '800', color: p.entityType === 'Customer' ? 'var(--success)' : 'var(--danger)' }}>
                                        {p.entityType === 'Customer' ? '+' : '-'} PKR {p.amount?.toLocaleString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                            <CreditCard size={14} color="var(--text-muted)" /> {p.paymentMethod}
                                        </div>
                                    </td>
                                    <td className="desktop-only" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.note || '---'}</td>
                                    <td>
                                        <button onClick={() => handleDelete(p._id)} style={{ padding: '6px', color: 'var(--danger)', background: 'none' }} title="Delete Record"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '450px' }}>
                        <h3 style={{ marginTop: 0 }}>Record Flow</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px' }}>Payment Source/Destination</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, entityType: 'Customer', entityId: '' })}
                                        style={{ backgroundColor: formData.entityType === 'Customer' ? '#eef2ff' : 'white', border: `1px solid ${formData.entityType === 'Customer' ? 'var(--primary)' : 'var(--border)'}`, color: formData.entityType === 'Customer' ? 'var(--primary)' : 'var(--text-muted)' }}
                                    >
                                        From Customer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, entityType: 'Supplier', entityId: '' })}
                                        style={{ backgroundColor: formData.entityType === 'Supplier' ? '#fef2f2' : 'white', border: `1px solid ${formData.entityType === 'Supplier' ? 'var(--danger)' : 'var(--border)'}`, color: formData.entityType === 'Supplier' ? 'var(--danger)' : 'var(--text-muted)' }}
                                    >
                                        To Supplier
                                    </button>
                                </div>
                            </div>

                            <select
                                required
                                value={formData.entityId} onChange={e => setFormData({ ...formData, entityId: e.target.value })}
                            >
                                <option value="">Select {formData.entityType}</option>
                                {entities.map(e => <option key={e._id} value={e._id}>{e.name} (Bal: {formData.entityType === 'Customer' ? e.outstandingReceivable : e.outstandingPayable})</option>)}
                            </select>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                                <input type="number" placeholder="Amount (PKR)" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
                                <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <input type="text" placeholder="Note / Reference Number" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="primary" style={{ flex: 1 }}>Save Payment</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
