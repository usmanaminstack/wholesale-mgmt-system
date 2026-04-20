import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Truck, Search, Phone, MapPin, DollarSign, Briefcase, Trash2, History, X, CheckCircle } from 'lucide-react';

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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '4px' }}>Suppliers</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage wholesale warehouses and supplier accounts.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="primary" style={{ padding: '12px 24px' }}>
                    <Plus size={20} /> Add Provider
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input type="text" placeholder="Search suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', padding: '4px', maxWidth: '400px', boxShadow: 'none' }} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Contact</th>
                                <th>Payable</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s._id}>
                                    <td data-label="Supplier">
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff7ed', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Briefcase size={18} />
                                            </div>
                                            {s.name}
                                        </div>
                                    </td>
                                    <td data-label="Contact">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}><Phone size={12} /> {s.phone}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}><MapPin size={12} /> {s.address}</div>
                                        </div>
                                    </td>
                                    <td data-label="Payable">
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', backgroundColor: s.outstandingPayable > 0 ? '#fee2e2' : '#f0fdf4', color: s.outstandingPayable > 0 ? '#991b1b' : '#166534', fontWeight: '700' }}>
                                            <DollarSign size={14} /> {s.outstandingPayable.toLocaleString()}
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setSelectedSupplier(s); setShowLedgerModal(true); fetchLedger(s._id); }} style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', color: 'var(--primary)', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><History size={14} /> History</button>
                                            <button onClick={() => handleDeleteSupplier(s._id)} style={{ padding: '8px', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }} title="Delete"><Trash2 size={18} /></button>
                                        </div>
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
                        <h3 style={{ marginTop: 0 }}>Add Supplier Profile</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
                            <input type="text" placeholder="Company / Supplier Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input type="text" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent)' }}>Opening Balance (Previous Payable)</label>
                                <input type="number" placeholder="e.g. 10000" value={formData.openingBalance} onChange={e => setFormData({ ...formData, openingBalance: e.target.value })} />
                            </div>
                            <textarea placeholder="Warehouse Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ height: '80px' }} />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="primary" style={{ flex: 1 }}>Save Supplier</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showLedgerModal && selectedSupplier && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Account History: {selectedSupplier.name}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Payable: <strong>PKR {selectedSupplier.outstandingPayable.toLocaleString()}</strong></p>
                            </div>
                            <button onClick={() => setShowLedgerModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>

                        <div className="ledger-modal-content" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', height: '100%', overflow: 'hidden' }}>
                            <div style={{ overflowY: 'auto', padding: '24px', borderRight: '1px solid var(--border)' }}>
                                {loadingLedger ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)' }}>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Dr (-)</th>
                                                <th>Cr (+)</th>
                                                <th style={{ textAlign: 'right' }}>Bal</th>
                                            </tr>
                                        </thead>
                                        <tbody style={{ fontSize: '0.85rem' }}>
                                            {ledger.map((entry, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td data-label="Date" style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{new Date(entry.date).toLocaleDateString()}</td>
                                                    <td data-label="Type">
                                                        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: entry.transactionType === 'Purchase' ? '#fee2e2' : '#dcfce7', color: entry.transactionType === 'Purchase' ? '#991b1b' : '#166534' }}>
                                                            {entry.transactionType}
                                                        </span>
                                                    </td>
                                                    <td data-label="Debit" style={{ color: 'var(--success)', fontWeight: '600' }}>{entry.debit > 0 ? `-${entry.debit.toLocaleString()}` : '-'}</td>
                                                    <td data-label="Credit" style={{ color: 'var(--danger)', fontWeight: '600' }}>{entry.credit > 0 ? `+${entry.credit.toLocaleString()}` : '-'}</td>
                                                    <td data-label="Balance" style={{ textAlign: 'right', fontWeight: '700' }}>{entry.balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {ledger.length === 0 && (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No transactions found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div style={{ padding: '24px', backgroundColor: '#fcfcfc' }}>
                                <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={18} color="var(--danger)" /> Record Payment</h4>
                                <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <input type="number" required value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} placeholder="Amount Paid (PKR)" />
                                    <select value={paymentData.method} onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                    <textarea value={paymentData.note} onChange={e => setPaymentData({ ...paymentData, note: e.target.value })} placeholder="Reference / Notes" style={{ height: '60px' }} />
                                    <button type="submit" className="danger" style={{ padding: '12px', color: 'white', backgroundColor: '#ef4444' }}><CheckCircle size={18} /> Save Payment</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
              @media (max-width: 850px) {
                .ledger-modal-content { grid-template-columns: 1fr !important; overflow-y: auto !important; }
                .ledger-modal-content > div { border-right: none !important; border-bottom: 1px solid var(--border); }
              }
            `}} />
        </div>
    );
};

export default Suppliers;
