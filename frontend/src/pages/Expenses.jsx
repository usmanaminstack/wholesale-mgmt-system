import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DateFilter from '../components/DateFilter';
import { Plus, Receipt, Search, Filter, Trash2, PiggyBank, Edit2, X } from 'lucide-react';
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
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '4px' }}>Business Expenses</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Record utility bills, fuel, rent, and other operational costs.</p>
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
                        <Plus size={20} /> Add Expense
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fef2f2', border: 'none' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fee2e2', color: 'var(--danger)' }}><PiggyBank size={24} /></div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: 'var(--danger)' }}>TOTAL SPENT</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>PKR {totalExpenses?.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(e => (
                                <tr key={e._id}>
                                    <td style={{ fontSize: '0.85rem' }}>{new Date(e.expenseDate).toLocaleDateString()}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '50px',
                                            backgroundColor: '#f1f5f9',
                                            color: 'var(--secondary)',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase'
                                        }}>
                                            {e.category}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '700', color: 'var(--danger)' }}>PKR {e.amount?.toLocaleString()}</td>
                                    <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.paymentMethod || 'Cash'}</span></td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{e.description || 'No description provided'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEditClick(e)} style={{ background: 'none', color: 'var(--accent)', padding: '4px' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteExpense(e._id)} style={{ background: 'none', color: 'var(--danger)', padding: '4px' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No expenses recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Expense' : 'New Expense Entry'}</h3>
                            <button onClick={() => { setShowModal(false); setIsEditing(false); setEditingExpense(null); }} style={{ background: 'none', padding: '4px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Expense Date</label>
                                <input type="date" required value={formData.expenseDate} onChange={e => setFormData({ ...formData, expenseDate: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Expense Category</label>
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

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Amount Spent</label>
                                <input type="number" placeholder="0.00" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Payment Method</label>
                                <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                    <option value="Cash">Cash in Hand</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Remarks</label>
                                <textarea placeholder="What was this for?" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ height: '80px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="primary" style={{ flex: 1 }}>{isEditing ? 'Update Expense' : 'Save Expense'}</button>
                                <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); setEditingExpense(null); }} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
