import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DateFilter from '../components/DateFilter';
import { Plus, Trash, Save, ShoppingBag, User, Eye, Edit, Printer, X, Trash2, Download } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showOutOfStock, setShowOutOfStock] = useState(false);

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

    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());

    useEffect(() => {
        fetchSales();
    }, [startDate, endDate]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchSales = async () => {
        let url = '/sales';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const { data } = await api.get(url);
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

    const downloadPDF = async () => {
        const element = document.getElementById('receipt-print-area');
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            // Calculate height in mm based on an 80mm width
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 200]
            });
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`receipt-${selectedSale._id.slice(-8)}.pdf`);
        } catch (error) {
            console.error("Could not generate PDF", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Sales</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Manage invoices and daily transactions.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }} className="header-actions">
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        onClear={() => { setStartDate(''); setEndDate(''); }}
                    />
                    <button onClick={() => { setIsEditing(false); setSelectedSale(null); setShowModal(true); }} className="primary" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                        <Plus size={20} /> New Sale
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Total Amount</th>
                                <th>Received</th>
                                <th>Balance</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(s => (
                                <tr key={s._id}>
                                    <td data-label="Date">{new Date(s.saleDate).toLocaleDateString()}</td>
                                    <td data-label="Customer" style={{ fontWeight: '700', color: 'var(--primary)' }}>{s.customer?.name || s.customerName || 'Guest'}</td>
                                    <td data-label="Total" style={{ fontWeight: '800' }}>{s.totalAmount?.toLocaleString()}</td>
                                    <td data-label="Recv">{s.receivedAmount?.toLocaleString()}</td>
                                    <td data-label="Bal" style={{ color: s.balanceAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '700' }}>{s.balanceAmount?.toLocaleString()}</td>
                                    <td data-label="Type">
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            backgroundColor: s.isRetail ? 'var(--primary-light)' : '#e0f2fe',
                                            color: s.isRetail ? 'var(--primary-dark)' : '#0369a1',
                                            fontSize: '0.75rem',
                                            fontWeight: '700'
                                        }}>
                                            {s.isRetail ? 'Retail' : 'Wholesale'}
                                        </span>
                                    </td>
                                    <td data-label="Status">
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            backgroundColor: s.balanceAmount === 0 ? '#dcfce7' : '#fee2e2',
                                            color: s.balanceAmount === 0 ? '#166534' : '#991b1b',
                                            fontSize: '0.75rem',
                                            fontWeight: '700'
                                        }}>
                                            {s.balanceAmount === 0 ? 'PAID' : 'DUE'}
                                        </span>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setSelectedSale(s); setShowViewModal(true); }} style={{ background: '#f8fafc', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }} title="View"><Eye size={18} /></button>
                                            <button onClick={() => handleEditClick(s)} style={{ background: '#f8fafc', color: 'var(--accent)', padding: '10px', borderRadius: '10px' }} title="Edit"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteSale(s._id)} style={{ background: '#fef2f2', color: 'var(--danger)', padding: '10px', borderRadius: '10px' }} title="Delete"><Trash2 size={18} /></button>
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
                    <div className="card modal-content" style={{ width: '95%', maxWidth: '1000px', maxHeight: '92vh', overflowY: 'auto', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ margin: 0, fontWeight: '800' }}>{isEditing ? 'Update Sale' : 'New Sale'}</h2>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }} className="desktop-only">
                                    <input type="checkbox" id="oos" checked={showOutOfStock} onChange={e => setShowOutOfStock(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                    <label htmlFor="oos">Show Out of Stock</label>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                    <button type="button" onClick={() => setFormData({ ...formData, isRetail: true })} style={{ flex: 1, backgroundColor: formData.isRetail ? 'var(--primary)' : 'white', color: formData.isRetail ? 'white' : 'var(--text)', border: '1px solid var(--border)', padding: '12px' }}>Retail Sale</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, isRetail: false })} style={{ flex: 1, backgroundColor: !formData.isRetail ? 'var(--primary)' : 'white', color: !formData.isRetail ? 'white' : 'var(--text)', border: '1px solid var(--border)', padding: '12px' }}>Wholesale Sale</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <label>Customer Type</label>
                                        <select
                                            value={formData.customer} onChange={e => {
                                                const c = customers.find(cust => cust._id === e.target.value);
                                                setFormData({ ...formData, customer: e.target.value, customerName: c ? c.name : '' });
                                            }}
                                        >
                                            <option value="">Walking / New Customer</option>
                                            {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    {!formData.customer && (
                                        <>
                                            <div>
                                                <label>Customer Name</label>
                                                <input type="text" placeholder="Full name" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                                            </div>
                                            <div>
                                                <label>Phone Number</label>
                                                <input type="text" placeholder="03xx-xxxxxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label>Payment Method</label>
                                        <select value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })} >
                                            <option value="Cash">Cash Payment</option>
                                            <option value="Credit">Credit (Balance)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, fontWeight: '700' }}>Order Items</h3>
                                    <button type="button" onClick={addItem} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 20px', borderRadius: '12px' }}>+ Add Item</button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="invoice-row" style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1fr 1.5fr 1.5fr 48px', gap: '16px', alignItems: 'end', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                            <div>
                                                <label className="desktop-only">Product Selection</label>
                                                <select required value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)} >
                                                    <option value="">-- Choose Product --</option>
                                                    {products
                                                        .filter(p => showOutOfStock || p.stockInPieces > 0 || item.product === p._id)
                                                        .map(p => (
                                                            <option key={p._id} value={p._id}>
                                                                {p.name} (Stock: {(p.stockInPieces / (p.piecesPerCarton || 1)).toFixed(1)} Ctn)
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                            <div>
                                                <label className="desktop-only">Unit</label>
                                                <select value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} >
                                                    <option value="Carton">Cartons</option>
                                                    <option value="Piece">Pieces</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="desktop-only">Qty</label>
                                                <input type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="desktop-only">Price</label>
                                                <input type="number" required value={item.priceAtSale} onChange={e => handleItemChange(index, 'priceAtSale', parseFloat(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="desktop-only">Subtotal</label>
                                                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', fontWeight: '800', textAlign: 'right' }}>{item.totalPrice?.toLocaleString()}</div>
                                            </div>
                                            <button type="button" onClick={() => removeItem(index)} style={{ padding: '12px', color: 'var(--danger)', background: '#fff1f2', borderRadius: '10px' }}><Trash2 size={20} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', borderTop: '2px solid var(--border)', paddingTop: '32px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>• Stock will be automatically adjusted.</p>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>• For credit sales, a ledger entry will be created.</p>
                                    <p style={{ margin: '0', fontSize: '0.9rem' }}>• Print option available after saving.</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Gross Total:</span>
                                        <span style={{ fontWeight: '700' }}>PKR {totalAmount?.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Discount:</span>
                                        <input
                                            type="number" style={{ width: '120px', fontWeight: '800', textAlign: 'right', color: 'var(--accent)' }}
                                            value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--primary-light)', borderRadius: '12px' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>Net Total:</span>
                                        <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.3rem' }}>PKR {(totalAmount - formData.discount)?.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Amount Received:</span>
                                        <input
                                            type="number" style={{ width: '120px', fontWeight: '800', textAlign: 'right' }}
                                            value={formData.receivedAmount} onChange={e => setFormData({ ...formData, receivedAmount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', color: (totalAmount - formData.discount - formData.receivedAmount) > 0 ? 'var(--danger)' : 'var(--success)' }}>Balance Due:</span>
                                        <span style={{ fontWeight: '900', color: (totalAmount - formData.discount - formData.receivedAmount) > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1.1rem' }}>PKR {(totalAmount - formData.discount - formData.receivedAmount)?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                                <button type="submit" className="primary" style={{ flex: 2, padding: '16px', fontSize: '1.1rem', borderRadius: '16px' }}>
                                    <Save size={22} /> {isEditing ? 'Update Invoice' : 'Create Invoice'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '700' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showViewModal && selectedSale && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: '95%', maxWidth: '400px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', borderRadius: '24px' }}>
                        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>Invoice Receipt</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={printInvoice} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}><Printer size={20} /></button>
                                <button onClick={downloadPDF} style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '10px' }}><Download size={20} /></button>
                                <button onClick={() => setShowViewModal(false)} style={{ background: '#f1f5f9', color: 'var(--text)', padding: '10px', borderRadius: '10px' }}><X size={20} /></button>
                            </div>
                        </div>

                        <div id="receipt-print-area" className="pos-receipt">
                            <div className="pos-receipt-header">
                                <h1 className="pos-receipt-title">GUDDU TRADERS</h1>
                                <p style={{ margin: '4px 0', fontSize: '12px', fontWeight: '700' }}>Wholesale Distributor</p>
                                <p style={{ margin: '0', fontSize: '11px' }}>Ph: 03xx-xxxxxxx</p>
                            </div>

                            <div style={{ marginBottom: '16px', fontSize: '12px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span><strong>ID:</strong> {selectedSale._id.slice(-6).toUpperCase()}</span>
                                    <span>{new Date(selectedSale.saleDate).toLocaleDateString()}</span>
                                </div>
                                <div><strong>Client:</strong> {selectedSale.customer?.name || selectedSale.customerName || 'Walk-in'}</div>
                                <div><strong>Type:</strong> {selectedSale.isRetail ? 'Retail' : 'Wholesale'}</div>
                            </div>

                            <table className="pos-receipt-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #000' }}>
                                        <th style={{ textAlign: 'left', padding: '8px 0' }}>Item</th>
                                        <th style={{ textAlign: 'center', padding: '8px 0' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '8px 0' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.items.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px 0' }}>
                                                <div style={{ fontWeight: '700' }}>{item.product?.name || 'Item'}</div>
                                                <div style={{ fontSize: '10px', color: '#666' }}>@{item.priceAtSale.toLocaleString()}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '700' }}>{item.totalPrice.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="pos-total-section" style={{ borderTop: '2px solid #000', paddingTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Gross Total</span>
                                    <span>{selectedSale.totalAmount.toLocaleString()}</span>
                                </div>
                                {(selectedSale.discount || 0) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--accent)' }}>
                                        <span>Discount</span>
                                        <span>-{(selectedSale.discount || 0).toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '900', fontSize: '16px' }}>
                                    <span>NET TOTAL</span>
                                    <span>PKR {(selectedSale.totalAmount - (selectedSale.discount || 0)).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Received</span>
                                    <span>{selectedSale.receivedAmount.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: selectedSale.balanceAmount > 0 ? '#e11d48' : '#059669' }}>
                                    <span>BALANCE</span>
                                    <span>PKR {selectedSale.balanceAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pos-footer" style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
                                Software by Guddu Traders <br />
                                <strong>THANK YOU FOR YOUR BUSINESS</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
              @media print {
                body * { visibility: hidden; }
                .invoice-print-area, .invoice-print-area * { visibility: visible; }
                .invoice-print-area { position: absolute; left: 0; top: 0; width: 100% !important; }
                .no-print { display: none !important; }
              }
              @media (max-width: 768px) {
                .header-actions { width: 100%; }
                .header-actions button { width: 100%; }
                .invoice-row { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
                .invoice-row > div:first-child { grid-column: span 2; }
                .invoice-row label { display: block !important; font-size: 0.75rem; margin-bottom: 4px; color: var(--text-muted); font-weight: 700; }
                .invoice-row button { grid-column: span 2; margin-top: 8px; }
                .modal-content { padding: 20px !important; }
              }
            `}} />
        </div>
    );
};

export default Sales;

