import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash, Save, ShoppingBag, User, Eye, Edit, Printer, X, Trash2 } from 'lucide-react';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        customer: '',
        customerName: '',
        phone: '',
        address: '',
        saveAsCustomer: false,
        paymentType: 'Cash',
        receivedAmount: 0,
        discount: 0,
        isRetail: true,
        items: [{ product: '', quantity: 1, unit: 'Carton', priceAtSale: 0, totalPrice: 0 }]
    });

    useEffect(() => {
        fetchSales();
        fetchInitialData();
    }, []);

    const fetchSales = async () => {
        const { data } = await api.get('/sales');
        setSales(data);
    };

    const fetchInitialData = async () => {
        const [cData, pData] = await Promise.all([
            api.get('/customers'),
            api.get('/products')
        ]);
        setCustomers(cData.data);
        setProducts(pData.data);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', quantity: 1, unit: 'Carton', priceAtSale: 0, totalPrice: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        const p = products.find(prod => prod._id === newItems[index].product);
        if (p) {
            if (field === 'product' || field === 'unit') {
                newItems[index].priceAtSale = newItems[index].unit === 'Carton' ? p.pricePerCarton : p.pricePerPiece;
            }
            // Recalculate total for this item
            newItems[index].totalPrice = newItems[index].quantity * (newItems[index].priceAtSale || 0);
        }

        setFormData({ ...formData, items: newItems });
    };

    const totalAmount = formData.items.reduce((acc, curr) => acc + curr.totalPrice, 0);

    const handleEditClick = (sale) => {
        setIsEditing(true);
        setSelectedSale(sale);
        setFormData({
            customer: sale.customer?._id || '',
            customerName: sale.customerName || '',
            phone: sale.customer?.phone || '',
            address: sale.customer?.address || '',
            saveAsCustomer: !!sale.customer,
            paymentType: sale.paymentType,
            receivedAmount: sale.receivedAmount,
            discount: sale.discount || 0,
            isRetail: sale.isRetail,
            items: sale.items.map(item => ({
                product: item.product?._id || item.product,
                quantity: item.quantity,
                unit: item.unit,
                priceAtSale: item.priceAtSale,
                totalPrice: item.totalPrice
            }))
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submissionData = {
                ...formData,
                customer: formData.customer === '' ? null : formData.customer,
                totalAmount
            };

            if (isEditing) {
                await api.put(`/sales/${selectedSale._id}`, submissionData);
            } else {
                await api.post('/sales', submissionData);
            }

            setShowModal(false);
            setIsEditing(false);
            setSelectedSale(null);
            setFormData({ customer: '', customerName: '', phone: '', address: '', saveAsCustomer: false, paymentType: 'Cash', receivedAmount: 0, isRetail: true, items: [{ product: '', quantity: 1, unit: 'Carton', priceAtSale: 0, totalPrice: 0 }] });
            fetchSales();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const printInvoice = () => {
        window.print();
    };

    const handleDeleteSale = async (id) => {
        if (window.confirm('Are you sure you want to delete this sale? All stock and financial impacts will be reversed.')) {
            try {
                await api.delete(`/sales/${id}`);
                fetchSales();
            } catch (err) {
                alert(err.response?.data?.message || err.message);
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '4px' }}>Sales</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Create invoices and track your daily revenue.</p>
                </div>
                <button onClick={() => { setIsEditing(false); setSelectedSale(null); setShowModal(true); }} className="primary" style={{ padding: '12px 24px' }}>
                    <Plus size={20} /> New Sale
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Total Amount</th>
                                <th>Received</th>
                                <th>Balance</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(s => (
                                <tr key={s._id}>
                                    <td style={{ fontSize: '0.85rem' }}>{new Date(s.saleDate).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: '600' }}>{s.customer?.name || s.customerName || 'Guest'}</td>
                                    <td style={{ fontWeight: '700' }}>PKR {s.totalAmount?.toLocaleString()}</td>
                                    <td>PKR {s.receivedAmount?.toLocaleString()}</td>
                                    <td style={{ color: s.balanceAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>PKR {s.balanceAmount?.toLocaleString()}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: s.isRetail ? '#f1f5f9' : '#e0f2fe',
                                            color: s.isRetail ? '#475569' : '#0369a1',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {s.isRetail ? 'Retail' : 'Wholesale'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: s.balanceAmount === 0 ? '#dcfce7' : '#fee2e2',
                                            color: s.balanceAmount === 0 ? '#166534' : '#991b1b',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {s.balanceAmount === 0 ? 'PAID' : 'DUE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => { setSelectedSale(s); setShowViewModal(true); }} style={{ background: 'none', color: 'var(--primary)', padding: '4px' }} title="View Invoice"><Eye size={18} /></button>
                                            <button onClick={() => handleEditClick(s)} style={{ background: 'none', color: 'var(--accent)', padding: '4px' }} title="Edit Invoice"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteSale(s._id)} style={{ background: 'none', color: 'var(--danger)', padding: '4px' }} title="Delete Invoice"><Trash2 size={18} /></button>
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
                    <div className="card" style={{ width: '95%', maxWidth: '900px', maxHeight: '95vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Sale Invoice' : 'Create Sale Invoice'}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setFormData({ ...formData, isRetail: true })} style={{ backgroundColor: formData.isRetail ? 'var(--primary)' : '#f1f5f9', color: formData.isRetail ? 'white' : 'var(--text)', fontSize: '0.8rem' }}>Retail</button>
                                <button type="button" onClick={() => setFormData({ ...formData, isRetail: false })} style={{ backgroundColor: !formData.isRetail ? 'var(--primary)' : '#f1f5f9', color: !formData.isRetail ? 'white' : 'var(--text)', fontSize: '0.8rem' }}>Wholesale</button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Existing Customer</label>
                                    <select
                                        value={formData.customer} onChange={e => {
                                            const c = customers.find(cust => cust._id === e.target.value);
                                            setFormData({ ...formData, customer: e.target.value, customerName: c ? c.name : '' });
                                        }}
                                    >
                                        <option value="">Guest/Walk-in</option>
                                        {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                {!formData.customer && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Guest Name</label>
                                            <input type="text" placeholder="e.g. Walking Customer" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Phone (Required for Ledger)</label>
                                            <input type="text" placeholder="Contact number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                                            <input
                                                type="checkbox"
                                                id="saveAsCustomer"
                                                checked={formData.saveAsCustomer || (totalAmount - formData.receivedAmount > 0)}
                                                disabled={totalAmount - formData.receivedAmount > 0}
                                                onChange={e => setFormData({ ...formData, saveAsCustomer: e.target.checked })}
                                            />
                                            <label htmlFor="saveAsCustomer" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}>
                                                {totalAmount - formData.receivedAmount > 0 ? 'Will be saved as Customer (Credit Sale)' : 'Save as Permanent Customer'}
                                            </label>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Payment Mode</label>
                                    <select value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })} >
                                        <option value="Cash">Cash</option>
                                        <option value="Credit">Credit (Udhaar)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={{ margin: 0 }}>Items Selection</h4>
                                    <button type="button" onClick={addItem} style={{ backgroundColor: '#f1f5f9', color: 'var(--primary)', fontSize: '0.8rem', padding: '6px 12px' }}>+ Add Row</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="invoice-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '12px', alignItems: 'end' }}>
                                            <div>
                                                {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Product</label>}
                                                <select required value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)} >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Unit</label>}
                                                <select value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} >
                                                    <option value="Carton">Carton</option>
                                                    <option value="Piece">Piece</option>
                                                </select>
                                            </div>
                                            <div>
                                                {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Qty</label>}
                                                <input type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} />
                                            </div>
                                            <div>
                                                {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Unit Price</label>}
                                                <input
                                                    type="number"
                                                    required
                                                    value={item.priceAtSale}
                                                    onChange={e => handleItemChange(index, 'priceAtSale', parseFloat(e.target.value))}
                                                    style={{ fontWeight: '700' }}
                                                />
                                            </div>
                                            <div>
                                                {index === 0 && <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '600' }}>Net Total</label>}
                                                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', fontWeight: '800' }}>{item.totalPrice?.toLocaleString()}</div>
                                            </div>
                                            <button type="button" onClick={() => removeItem(index)} style={{ padding: '8px', color: 'var(--danger)', background: 'none' }}><Trash size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gross Total: PKR {totalAmount?.toLocaleString()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '600' }}>Discount:</span>
                                    <input
                                        type="number" style={{ width: '160px', fontWeight: 'bold', color: 'var(--accent)' }}
                                        value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                                    Net Total: <span style={{ color: 'var(--primary)' }}>PKR {(totalAmount - formData.discount)?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '600' }}>Advance Received:</span>
                                    <input
                                        type="number" style={{ width: '160px' }}
                                        value={formData.receivedAmount} onChange={e => setFormData({ ...formData, receivedAmount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div style={{ fontWeight: '800', color: (totalAmount - formData.discount - formData.receivedAmount) > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1.1rem' }}>
                                    Balance Due: PKR {(totalAmount - formData.discount - formData.receivedAmount)?.toLocaleString()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button type="submit" className="primary" style={{ flex: 1, padding: '14px', fontSize: '1rem' }}>
                                    <Save size={20} /> {isEditing ? 'Update & Save Invoice' : 'Generate & Save Invoice'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showViewModal && selectedSale && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card invoice-print-area" style={{ width: '95%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', padding: '40px' }}>
                        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                            <button onClick={printInvoice} style={{ backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={18} /> Print</button>
                            <button onClick={() => setShowViewModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '60px', height: '60px' }} />
                            <div>
                                <h1 style={{ margin: 0, color: 'var(--primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>GUDDU TRADERS</h1>
                                <p style={{ margin: '8px 0', fontSize: '1.2rem', fontWeight: '700' }}>Wholesale Distributor & Cold Drink Distributor</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quality Service • Reliable Supply</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Bill To:</h4>
                                <h3 style={{ margin: 0 }}>{selectedSale.customer?.name || selectedSale.customerName || 'Walking Customer'}</h3>
                                <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>{selectedSale.customer?.phone || 'N/A'}</p>
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>{selectedSale.customer?.address || 'N/A'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Invoice Details:</h4>
                                <p style={{ margin: '4px 0', fontSize: '0.85rem' }}><strong>Inv #:</strong> {selectedSale._id.slice(-8).toUpperCase()}</p>
                                <p style={{ margin: '4px 0', fontSize: '0.85rem' }}><strong>Date:</strong> {new Date(selectedSale.saleDate).toLocaleDateString()}</p>
                                <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Type:</strong> {selectedSale.isRetail ? 'Retail' : 'Wholesale'}</p>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--text)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px 0' }}>Item Description</th>
                                    <th>Qty</th>
                                    <th>Unit</th>
                                    <th>Price</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSale.items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 0', fontWeight: '500' }}>{item.product?.name || 'Deleted Product'}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unit}</td>
                                        <td>{item.priceAtSale.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{item.totalPrice.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ width: '250px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Grand Total:</span>
                                    <span style={{ fontWeight: '700' }}>PKR {selectedSale.totalAmount.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Received:</span>
                                    <span>PKR {selectedSale.receivedAmount.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '2px solid var(--text)', fontSize: '1.1rem' }}>
                                    <span style={{ fontWeight: '800' }}>Balance:</span>
                                    <span style={{ fontWeight: '800', color: selectedSale.balanceAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>PKR {selectedSale.balanceAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '60px', textAlign: 'center', borderTop: '1px dashed var(--border)', paddingTop: '20px' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thank you for your business! Please visit again.</p>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
              @media print {
                body * { visibility: hidden; }
                .invoice-print-area, .invoice-print-area * { visibility: visible; }
                .invoice-print-area { position: absolute; left: 0; top: 0; width: 100% !important; max-width: none !important; box-shadow: none !important; }
                .no-print { display: none !important; }
                .card { border: none !important; }
              }
              @media (max-width: 768px) {
                .invoice-row { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
                .invoice-row > div:first-child { grid-column: span 2; }
                .invoice-row > button { grid-column: span 2; display: flex; align-items: center; justify-content: center; background: #fee2e2 !important; margin-top: 4px; border-radius: 8px; }
              }
            `}} />
        </div>
    );
};

export default Sales;
