import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash, Save, ShoppingCart, Truck, Edit, Trash2, Calendar, X } from 'lucide-react';

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
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchPurchases();
        fetchInitialData();
    }, []);

    const fetchPurchases = async () => {
        const { data } = await api.get('/purchases');
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
            if (p) newItems[index].costPerCarton = p.pricePerCarton;
        }

        newItems[index].totalCost = newItems[index].quantityInCartons * newItems[index].costPerCarton;
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
            setFormData({ supplier: '', paymentType: 'Cash', paidAmount: 0, items: [{ product: '', quantityInCartons: 1, costPerCarton: 0, totalCost: 0 }], purchaseDate: new Date().toISOString().split('T')[0] });
            fetchPurchases();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '4px' }}>Restock Inventory</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Record bulk purchases and update supplier ledgers.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="primary"
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} /> New Purchase
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Supplier</th>
                                <th>Grand Total</th>
                                <th>Paid</th>
                                <th>Balance</th>
                                <th>Method</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(p => (
                                <tr key={p._id}>
                                    <td style={{ fontSize: '0.85rem' }}>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Truck size={14} color="var(--primary)" />
                                            {p.supplier?.name}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '700' }}>PKR {p.grandTotal?.toLocaleString()}</td>
                                    <td>PKR {p.paidAmount?.toLocaleString()}</td>
                                    <td style={{ color: p.balanceAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>PKR {p.balanceAmount?.toLocaleString()}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            backgroundColor: p.paymentType === 'Cash' ? '#dcfce7' : '#fee2e2',
                                            color: p.paymentType === 'Cash' ? '#166534' : '#991b1b',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {p.paymentType}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEditClick(p)} style={{ background: 'none', color: 'var(--accent)', padding: '4px' }} title="Edit"><Edit size={16} /></button>
                                            <button onClick={() => handleDeletePurchase(p._id)} style={{ background: 'none', color: 'var(--danger)', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>
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
                    <div className="card" style={{ width: '95%', maxWidth: '850px', maxHeight: '95vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Stock Purchase' : 'Record New Stock Purchase'}</h3>
                            <button onClick={() => { setShowModal(false); setIsEditing(false); setEditingPurchase(null); }} style={{ background: 'none', padding: '4px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Purchase Date</label>
                                    <input type="date" required value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Supplier</label>
                                    <select
                                        required
                                        value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Payment Type</label>
                                    <select
                                        value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Credit">Credit (Pay Later)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={{ margin: 0 }}>Stock Items</h4>
                                    <button type="button" onClick={addItem} style={{ backgroundColor: '#f1f5f9', color: 'var(--primary)', fontSize: '0.8rem', padding: '6px 12px' }}>+ Add Row</button>
                                </div>
                                {formData.items.map((item, index) => (
                                    <div key={index} className="purchase-row" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 40px', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
                                        <div>
                                            {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Product</label>}
                                            <select
                                                required value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)}
                                            >
                                                <option value="">Select Product</option>
                                                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Cartons</label>}
                                            <input
                                                type="number" min="1" required
                                                value={item.quantityInCartons} onChange={e => handleItemChange(index, 'quantityInCartons', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Cost/Carton</label>}
                                            <input
                                                type="number" required
                                                value={item.costPerCarton} onChange={e => handleItemChange(index, 'costPerCarton', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Net Line</label>}
                                            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', fontWeight: '700' }}>{item.totalCost}</div>
                                        </div>
                                        <button type="button" onClick={() => removeItem(index)} style={{ padding: '8px', color: 'var(--danger)', background: 'none' }}><Trash size={20} /></button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>Order Total: <span style={{ color: 'var(--primary)' }}>PKR {grandTotal?.toLocaleString()}</span></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '600' }}>Paid to Supplier:</span>
                                    <input
                                        type="number" style={{ width: '160px' }}
                                        value={formData.paidAmount} onChange={e => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div style={{ fontWeight: '700', color: 'var(--danger)' }}>Balance (Liability): PKR {(grandTotal - formData.paidAmount)?.toLocaleString()}</div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button type="submit" className="primary" style={{ flex: 1, padding: '14px', fontSize: '1rem' }}>
                                    <Save size={20} /> {isEditing ? 'Update Purchase' : 'Record Purchase'}
                                </button>
                                <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); setEditingPurchase(null); }} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
               @media (max-width: 768px) {
                .purchase-row { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
                .purchase-row > div:first-child { grid-column: span 2; }
                .purchase-row > button { grid-column: span 2; display: flex; align-items: center; justify-content: center; background: #fee2e2 !important; margin-top: 4px; border-radius: 8px; }
              }
            `}} />
        </div>
    );
};

export default Purchases;
