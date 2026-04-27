import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DateFilter from '../components/DateFilter';
import { Plus, Trash, Save, ShoppingCart, Truck, Edit, Trash2, Calendar, X, ArrowRight, Package, DollarSign } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

const Purchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);

    const [formData, setFormData] = useState({
        supplier: '',
        paymentType: 'Cash',
        paidAmount: 0,
        items: [{ product: '', quantityInCartons: 1, costPerCarton: 0, totalCost: 0 }],
        purchaseDate: getLocalDateString()
    });

    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());

    useEffect(() => {
        fetchPurchases();
    }, [startDate, endDate]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchPurchases = async () => {
        let url = '/purchases';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const { data } = await api.get(url);
        setPurchases(data);
    };

    const handleDeletePurchase = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase? Stock and supplier balance will be reversed.')) {
            try {
                await api.delete(`/purchases/${id}`);
                fetchPurchases();
            } catch (err) {
                alert(err.response?.data?.message || err.message);
            }
        }
    };

    const handleEditClick = (p) => {
        setIsEditing(true);
        setEditingPurchase(p);
        setFormData({
            supplier: p.supplier?._id || p.supplier,
            paymentType: p.paymentType,
            paidAmount: p.paidAmount,
            purchaseDate: new Date(p.purchaseDate).toISOString().split('T')[0],
            items: p.items.map(item => ({
                product: item.product?._id || item.product,
                quantityInCartons: item.quantityInCartons,
                costPerCarton: item.costPerCarton,
                totalCost: item.totalCost
            }))
        });
        setShowModal(true);
    };

    const fetchInitialData = async () => {
        const [sData, pData] = await Promise.all([
            api.get('/suppliers'),
            api.get('/products')
        ]);
        setSuppliers(sData.data);
        setProducts(pData.data);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', quantityInCartons: 1, costPerCarton: 0, totalCost: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'product') {
            const p = products.find(prod => prod._id === value);
            if (p) newItems[index].costPerCarton = p.costPricePerCarton || p.pricePerCarton;
        }

        newItems[index].totalCost = (newItems[index].quantityInCartons || 0) * (newItems[index].costPerCarton || 0);
        setFormData({ ...formData, items: newItems });
    };

    const grandTotal = formData.items.reduce((acc, curr) => acc + curr.totalCost, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/purchases/${editingPurchase._id}`, { ...formData, grandTotal });
            } else {
                await api.post('/purchases', { ...formData, grandTotal });
            }
            setShowModal(false);
            setIsEditing(false);
            setEditingPurchase(null);
            setFormData({ supplier: '', paymentType: 'Cash', paidAmount: 0, items: [{ product: '', quantityInCartons: 1, costPerCarton: 0, totalCost: 0 }], purchaseDate: getLocalDateString() });
            fetchPurchases();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Restock Items</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Manage bulk inventory purchases from suppliers.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        onClear={() => { setStartDate(''); setEndDate(''); }}
                    />
                    <button
                        onClick={() => setShowModal(true)}
                        className="primary"
                        style={{ padding: '14px 28px', borderRadius: '14px' }}
                    >
                        <Plus size={20} /> New Purchase
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Restock Date</th>
                                <th>Supplier Name</th>
                                <th>Total Cost</th>
                                <th>Paid Amt</th>
                                <th>Net Balance</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(p => (
                                <tr key={p._id}>
                                    <td data-label="Date">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: '700' }}>
                                            <Calendar size={14} color="var(--primary)" /> {new Date(p.purchaseDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td data-label="Supplier">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                                            <Truck size={16} color="var(--primary)" />
                                            {p.supplier?.name}
                                        </div>
                                    </td>
                                    <td data-label="Total" style={{ fontWeight: '900' }}>PKR {p.grandTotal?.toLocaleString()}</td>
                                    <td data-label="Paid" style={{ color: 'var(--success)', fontWeight: '700' }}>PKR {p.paidAmount?.toLocaleString()}</td>
                                    <td data-label="Bal" style={{ color: p.balanceAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '900' }}>
                                        {p.balanceAmount > 0 ? `PKR ${p.balanceAmount.toLocaleString()}` : 'SETTLED'}
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="action-btn">
                                            <button onClick={() => handleEditClick(p)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Edit Entry"><Edit size={18} /></button>
                                            <button onClick={() => handleDeletePurchase(p._id)} style={{ background: '#fef2f2', color: 'var(--danger)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Delete Entry"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {purchases.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '600' }}>No purchase history found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '900px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShoppingCart size={24} />
                                </div>
                                <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.5rem' }}>{isEditing ? 'Update Stock Entry' : 'New Stock Restock'}</h3>
                            </div>
                            <button onClick={() => { setShowModal(false); setIsEditing(false); setEditingPurchase(null); }} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Purchase Date</label>
                                    <input type="date" required value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Supplier / Vendor</label>
                                    <select
                                        required
                                        value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Payment Type</label>
                                    <select
                                        value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })}
                                    >
                                        <option value="Cash">Immediate Cash</option>
                                        <option value="Credit">Credit (Supplier Account)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Package size={20} color="var(--primary)" /> Item Breakdown
                                    </h4>
                                    <button type="button" onClick={addItem} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '800', fontSize: '0.85rem', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>+ Add Row</button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="purchase-row" style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '4fr 1.5fr 2fr 2fr 50px', 
                                            gap: '16px', 
                                            alignItems: 'end',
                                            backgroundColor: 'white',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>PRODUCT</label>
                                                <select
                                                    required value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)}
                                                >
                                                    <option value="">Choose Item...</option>
                                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>CTNS</label>
                                                <input
                                                    type="number" min="0.1" step="0.1" required
                                                    value={item.quantityInCartons} onChange={e => handleItemChange(index, 'quantityInCartons', parseFloat(e.target.value))}
                                                    style={{ fontWeight: '800' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>COST / CTN</label>
                                                <input
                                                    type="number" required
                                                    value={item.costPerCarton} onChange={e => handleItemChange(index, 'costPerCarton', parseFloat(e.target.value))}
                                                    style={{ fontWeight: '800' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>TOTAL</label>
                                                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', fontWeight: '900', color: 'var(--text)', border: '1px solid var(--border)' }}>
                                                    {item.totalCost?.toLocaleString()}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeItem(index)} style={{ padding: '12px', color: 'var(--danger)', background: '#fef2f2', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.025em' }}>Order Total: <span style={{ color: 'var(--primary)' }}>PKR {grandTotal?.toLocaleString()}</span></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <label style={{ fontWeight: '900', color: '#166534', fontSize: '1rem' }}>PAID TO SUPPLIER:</label>
                                        <input
                                            type="number" style={{ width: '180px', fontSize: '1.25rem', fontWeight: '900', border: '2px solid #86efac' }}
                                            value={formData.paidAmount} onChange={e => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ fontWeight: '800', color: (grandTotal - formData.paidAmount) > 0 ? 'var(--danger)' : '#166534', fontSize: '1.1rem' }}>
                                        REMAINING: PKR {(grandTotal - formData.paidAmount)?.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                                <button type="submit" className="primary" style={{ flex: 2, padding: '18px', fontSize: '1.1rem', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <Save size={24} /> {isEditing ? 'Update Restock Entry' : 'Confirm & Record Purchase'} <ArrowRight size={20} />
                                </button>
                                <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); setEditingPurchase(null); }} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '18px', fontWeight: '900' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
               @media (max-width: 850px) {
                .purchase-row { 
                    grid-template-columns: 1fr 1fr !important; 
                    gap: 12px !important; 
                    padding: 20px !important;
                }
                .purchase-row > div:first-child { grid-column: span 2; }
                .purchase-row > div:nth-child(4) { grid-column: span 1; }
                .purchase-row > button { 
                    grid-column: span 2; 
                    margin-top: 8px;
                    padding: 14px !important;
                }
                .order-summary-panel {
                    align-items: center !important;
                    text-align: center;
                }
                .order-summary-panel > div {
                    flex-direction: column !important;
                    width: 100%;
                }
                .order-summary-panel input {
                    width: 100% !important;
                }
              }
            `}} />
        </div>
    );
};

export default Purchases;

