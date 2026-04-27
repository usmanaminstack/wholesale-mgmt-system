import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DateFilter from '../components/DateFilter';
import { Plus, Receipt, Search, Filter, Trash2, PiggyBank, Edit2, X, Wallet, Calendar, ArrowRight } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({ category: '', amount: 0, description: '', paymentMethod: 'Cash', expenseDate: getLocalDateString() });

    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());

    useEffect(() => { fetchExpenses(); }, [startDate, endDate]);

    const fetchExpenses = async () => {
        let url = '/expenses';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const { data } = await api.get(url);
        setExpenses(data);
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchExpenses();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleEditClick = (e) => {
        setIsEditing(true);
        setEditingExpense(e);
        setFormData({
            category: e.category,
            amount: e.amount,
            description: e.description,
            expenseDate: new Date(e.expenseDate).toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/expenses/${editingExpense._id}`, formData);
            } else {
                await api.post('/expenses', formData);
            }
            setShowModal(false);
            setIsEditing(false);
            setEditingExpense(null);
            setFormData({ category: '', amount: 0, description: '', expenseDate: new Date().toISOString().split('T')[0] });
            fetchExpenses();
        } catch (err) {
            alert(err.message);
        }
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Expenses</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Track utility bills, fuel, rent, and operational costs.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        onClear={() => { setStartDate(''); setEndDate(''); }}
                    />
                    <button onClick={() => setShowModal(true)} className="primary" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                        <Plus size={20} /> Add Expense
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px', 
                    background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)', 
                    color: 'white',
                    border: 'none',
                    padding: '24px'
                }}>
                    <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                        <PiggyBank size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expenditure</p>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: '900' }}>PKR {totalExpenses?.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Expense Details</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th className="desktop-only">Payment Method</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(e => (
                                <tr key={e._id}>
                                    <td data-label="Details">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Receipt size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: 'var(--text)', fontSize: '0.95rem' }}>{e.description || 'General Expense'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} /> {new Date(e.expenseDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Category">
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: 'var(--bg)',
                                            color: 'var(--secondary)',
                                            fontSize: '0.75rem',
                                            fontWeight: '800',
                                            border: '1px solid var(--border)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {e.category}
                                        </span>
                                    </td>
                                    <td data-label="Amount">
                                        <div style={{ fontWeight: '900', color: 'var(--danger)', fontSize: '1.1rem' }}>
                                            PKR {e.amount?.toLocaleString()}
                                        </div>
                                    </td>
                                    <td data-label="Method" className="desktop-only">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                                            <Wallet size={14} /> {e.paymentMethod || 'Cash'}
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="action-btn">
                                            <button onClick={() => handleEditClick(e)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Edit"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteExpense(e._id)} style={{ background: '#fef2f2', color: 'var(--danger)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '600' }}>No expense records found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.5rem' }}>{isEditing ? 'Edit Expense' : 'Record Expense'}</h3>
                            <button onClick={() => { setShowModal(false); setIsEditing(false); setEditingExpense(null); }} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>EXPENSE DATE</label>
                                    <input type="date" required value={formData.expenseDate} onChange={e => setFormData({ ...formData, expenseDate: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>CATEGORY</label>
                                    <select
                                        required
                                        value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Fuel">Fuel / Logistics</option>
                                        <option value="Rent">Shop Rent</option>
                                        <option value="Salary">Staff Salaries</option>
                                        <option value="Electricity">Electricity / Utilities</option>
                                        <option value="Maintenance">Shop Maintenance</option>
                                        <option value="Other">Miscellaneous</option>
                                    </select>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>AMOUNT (PKR)</label>
                                    <input type="number" placeholder="0.00" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} style={{ fontSize: '1.25rem', fontWeight: '800' }} />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>PAYMENT METHOD</label>
                                    <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                        <option value="Cash">Cash in Hand</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>REMARKS / DESCRIPTION</label>
                                    <textarea placeholder="Details about this expenditure..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ height: '80px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                                <button type="submit" className="primary" style={{ flex: 2, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    {isEditing ? 'Update Entry' : 'Save Expense'} <ArrowRight size={20} />
                                </button>
                                <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); setEditingExpense(null); }} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '800' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
