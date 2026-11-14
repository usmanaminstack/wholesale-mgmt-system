import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DateFilter from '../components/DateFilter';
import { Plus, Trash, Save, ShoppingBag, User, Eye, Edit, Printer, X, Trash2, Download, Share2, CheckCircle2, Search, Keyboard } from 'lucide-react';
import { getLocalDateString, formatDate } from '../utils/dateUtils';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';


const Sales = () => {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showOutOfStock, setShowOutOfStock] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastCreatedInvoice, setLastCreatedInvoice] = useState(null);
    const [recentCustomerIds, setRecentCustomerIds] = useState([]);

    const formRef = useRef(null);
    const receivedAmountRef = useRef(null);
    const discountRef = useRef(null);

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
        previousBalance: 0,
        saleDate: getLocalDateString(),
        items: [{ product: '', quantity: 1, unit: 'Piece', priceAtSale: 0, totalPrice: 0 }]
    });

    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());

    useEffect(() => {
        fetchSales();
    }, [startDate, endDate]);

    useEffect(() => {
        fetchInitialData();
        // Load recent customer IDs from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem('recentCustomerIds') || '[]');
            setRecentCustomerIds(saved);
        } catch (e) { }
    }, []);

    // Global keyboard shortcuts when modal is open
    useEffect(() => {
        if (!showModal) return;

        const handleKeyDown = (e) => {
            // Ctrl+Enter → Submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                formRef.current?.requestSubmit();
            }
            // Ctrl+N → Add new item row
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                addItem();
            }
            // Ctrl+D → Focus discount field
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                discountRef.current?.focus();
                discountRef.current?.select();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showModal, formData]);

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

    // Save customer to recent list
    const saveRecentCustomer = (customerId) => {
        if (!customerId) return;
        const updated = [customerId, ...recentCustomerIds.filter(id => id !== customerId)].slice(0, 5);
        setRecentCustomerIds(updated);
        localStorage.setItem('recentCustomerIds', JSON.stringify(updated));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product: '', quantity: 1, unit: 'Piece', priceAtSale: 0, totalPrice: 0 }]
        }));
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
            if (field === 'product') {
                newItems[index].priceAtSale = p.pricePerPiece || 0;
            }
            newItems[index].totalPrice = newItems[index].quantity * (newItems[index].priceAtSale || 0);
        }

        const updatedFormData = { ...formData, items: newItems };

        // Auto-add next row when last row gets a product selected
        if (field === 'product' && value && index === newItems.length - 1) {
            newItems.push({ product: '', quantity: 1, unit: 'Piece', priceAtSale: 0, totalPrice: 0 });
            updatedFormData.items = newItems;
        }

        // Auto-fill received amount for Cash payments
        if (updatedFormData.paymentType === 'Cash') {
            const newTotal = newItems.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
            updatedFormData.receivedAmount = newTotal - (updatedFormData.discount || 0);
        }

        setFormData(updatedFormData);
    };

    const totalAmount = formData.items.reduce((acc, curr) => acc + curr.totalPrice, 0);

    // Auto-fill received when payment type changes to Cash
    const handlePaymentTypeChange = (paymentType) => {
        const newData = { ...formData, paymentType };
        if (paymentType === 'Cash') {
            newData.receivedAmount = totalAmount - (formData.discount || 0);
        }
        setFormData(newData);
    };

    // Auto-fill received when discount changes (for Cash)
    const handleDiscountChange = (discount) => {
        const newData = { ...formData, discount };
        if (formData.paymentType === 'Cash') {
            newData.receivedAmount = totalAmount - discount;
        }
        setFormData(newData);
    };

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
            saleDate: sale.saleDate ? getLocalDateString(new Date(sale.saleDate)) : getLocalDateString(),
            items: sale.items.map(item => ({
                product: item.product?._id || item.product,
                quantity: item.quantity,
                unit: item.unit,
                priceAtSale: item.priceAtSale,
                totalPrice: item.totalPrice
            })),
            previousBalance: sale.previousBalance || 0
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ customer: '', customerName: '', phone: '', address: '', saveAsCustomer: false, paymentType: 'Cash', receivedAmount: 0, discount: 0, isRetail: true, previousBalance: 0, saleDate: getLocalDateString(), items: [{ product: '', quantity: 1, unit: 'Piece', priceAtSale: 0, totalPrice: 0 }] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Clean up empty trailing rows
            const cleanItems = formData.items.filter(item => item.product);
            if (cleanItems.length === 0) {
                toast.error('Please add at least one product');
                return;
            }

            const submissionData = {
                ...formData,
                items: cleanItems,
                customer: formData.customer === '' ? null : formData.customer,
                totalAmount
            };

            let response;
            if (isEditing) {
                response = await api.put(`/sales/${selectedSale._id}`, submissionData);
            } else {
                response = await api.post('/sales', submissionData);
            }

            // Save to recent customers
            if (formData.customer) {
                saveRecentCustomer(formData.customer);
            }

            if (!isEditing) {
                setLastCreatedInvoice(response.data.sale || response.data);
                setShowSuccessModal(true);
            }

            setShowModal(false);
            setIsEditing(false);
            setSelectedSale(null);
            resetForm();
            fetchSales();
        } catch (err) {
            console.error(err);
        }
    };

    const downloadPDF = async (sale = selectedSale) => {
        const targetSale = sale || selectedSale;
        if (!targetSale) return;

        if (!selectedSale || selectedSale._id !== targetSale._id) {
            setSelectedSale(targetSale);
        }
        setShowViewModal(true);

        setTimeout(async () => {
            const element = document.getElementById('receipt-print-area');
            if (!element) {
                toast.error("Preparing invoice... please try again.");
                return;
            }

            const loadingToast = toast.loading("Generating A4 PDF...");
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: -window.scrollY
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const pdfWidth = 210;
                const pdfHeight = 297;
                const margin = 10;
                const printWidth = pdfWidth - (margin * 2);
                const printHeight = (canvas.height * printWidth) / canvas.width;

                if (printHeight <= (pdfHeight - (margin * 2))) {
                    pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
                } else {
                    const scaleFactor = (pdfHeight - (margin * 2)) / printHeight;
                    pdf.addImage(imgData, 'JPEG', margin, margin, printWidth * scaleFactor, printHeight * scaleFactor);
                }

                pdf.save(`Invoice-${targetSale._id.slice(-6).toUpperCase()}.pdf`);
                toast.success("A4 PDF Downloaded!", { id: loadingToast });
            } catch (err) {
                console.error("PDF generation failed:", err);
                toast.error("Could not generate PDF.", { id: loadingToast });
            }
        }, 500);
    };

    const handleShare = async (saleToShare = lastCreatedInvoice || selectedSale) => {
        const targetSale = saleToShare || selectedSale;
        if (!targetSale) return;

        if (!selectedSale || selectedSale._id !== targetSale._id) {
            setSelectedSale(targetSale);
        }
        setShowViewModal(true);

        setTimeout(async () => {
            const element = document.getElementById('receipt-print-area');
            if (!element) {
                toast.error("Preparing receipt for sharing...");
                return;
            }

            const loadingToast = toast.loading("Preparing PDF...", { id: 'share-loading' });
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: -window.scrollY
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const pdfWidth = 210;
                const pdfHeight = 297;
                const margin = 10;
                const printWidth = pdfWidth - (margin * 2);
                const printHeight = (canvas.height * printWidth) / canvas.width;

                if (printHeight <= (pdfHeight - (margin * 2))) {
                    pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
                } else {
                    const scaleFactor = (pdfHeight - (margin * 2)) / printHeight;
                    pdf.addImage(imgData, 'JPEG', margin, margin, printWidth * scaleFactor, printHeight * scaleFactor);
                }

                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], `Invoice-${targetSale._id.slice(-6).toUpperCase()}.pdf`, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Invoice #${targetSale._id.slice(-6).toUpperCase()}`,
                        text: `Invoice from Suriya Enterprises for PKR ${targetSale.totalAmount.toLocaleString()}`
                    });
                    toast.success("Shared successfully!", { id: loadingToast });
                } else {
                    // Fallback to direct download
                    pdf.save(`Invoice-${targetSale._id.slice(-6).toUpperCase()}.pdf`);
                    toast.success("PDF Downloaded!", { id: loadingToast });
                }
            } catch (err) {
                console.error('Error sharing:', err);
                toast.error("Sharing failed.", { id: loadingToast });
            }
        }, 500);
    };

    const printInvoice = (sale = selectedSale) => {
        const targetSale = sale || selectedSale;
        if (!targetSale) return;
        if (!selectedSale || selectedSale._id !== targetSale._id) {
            setSelectedSale(targetSale);
        }
        setShowViewModal(true);

        setTimeout(() => {
            window.print();
        }, 800);
    };

    const handleDeleteSale = async (id) => {
        if (window.confirm('Are you sure you want to delete this sale? All stock and financial impacts will be reversed.')) {
            try {
                await api.delete(`/sales/${id}`);
                fetchSales();
            } catch (err) {
                // Error handled by interceptor
            }
        }
    };

    const downloadPNG = async (sale = selectedSale) => {
        const targetSale = sale || selectedSale;
        if (!targetSale) return;

        if (!selectedSale || selectedSale._id !== targetSale._id) {
            setSelectedSale(targetSale);
        }
        setShowViewModal(true);

        setTimeout(async () => {
            const element = document.getElementById('receipt-print-area');
            if (!element) {
                toast.error("Preparing receipt... please try again.");
                return;
            }
            const loadingToast = toast.loading("Generating clear image...");
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: -window.scrollY
                });

                canvas.toBlob((blob) => {
                    if (!blob) {
                        toast.error("Failed to generate image.", { id: loadingToast });
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Invoice-${targetSale._id.slice(-6).toUpperCase()}.png`;
                    document.body.appendChild(link);
                    link.click();

                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 200);

                    toast.success("Image saved to downloads!", { id: loadingToast });
                }, 'image/png');
            } catch (error) {
                console.error("Could not generate PNG", error);
                toast.error("Failed to generate image.", { id: loadingToast });
            }
        }, 500);
    };

    // Recent customers as quick-pick chips
    const recentCustomers = recentCustomerIds
        .map(id => customers.find(c => c._id === id))
        .filter(Boolean)
        .slice(0, 5);


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
                    <button onClick={() => { setIsEditing(false); setSelectedSale(null); resetForm(); setShowModal(true); }} className="primary desktop-only" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                        <Plus size={20} /> New Sale
                    </button>
                </div>
            </div>

            <button data-testid="new-sale-fab" onClick={() => { setIsEditing(false); setSelectedSale(null); resetForm(); setShowModal(true); }} className="fab-button mobile-only" title="New Sale">
                <Plus size={32} />
            </button>

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
                                    <td data-label="Date">{formatDate(s.saleDate)}</td>
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
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="action-btn">
                                            <button onClick={() => { setSelectedSale(s); setShowViewModal(true); }} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="View"><Eye size={18} /></button>
                                            <button onClick={() => handleEditClick(s)} style={{ background: 'var(--primary-light)', color: 'var(--accent)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Edit"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteSale(s._id)} style={{ background: '#fef2f2', color: 'var(--danger)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="1000px">
                {/* Keyboard shortcut bar - desktop only */}
                <div className="kbd-bar">
                    <span className="kbd-bar-label"><Keyboard size={14} /> Shortcuts:</span>
                    <span className="kbd-hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Save</span>
                    <span className="kbd-hint"><kbd>Ctrl</kbd>+<kbd>N</kbd> Add Row</span>
                    <span className="kbd-hint"><kbd>Ctrl</kbd>+<kbd>D</kbd> Discount</span>
                    <span className="kbd-hint"><kbd>Tab</kbd> Next Field</span>
                    <span className="kbd-hint"><kbd>Esc</kbd> Close</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontWeight: '800' }}>{isEditing ? 'Update Sale' : 'New Sale'}</h2>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }} className="desktop-only">
                            <input type="checkbox" id="oos" checked={showOutOfStock} onChange={e => setShowOutOfStock(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                            <label htmlFor="oos" style={{ margin: 0 }}>Show Out of Stock</label>
                        </div>
                        <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                    </div>
                </div>

                <form ref={formRef} onSubmit={handleSubmit}>
                    <div className="sales-meta-section" style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <button type="button" onClick={() => setFormData({ ...formData, isRetail: true })} style={{ flex: 1, backgroundColor: formData.isRetail ? 'var(--primary)' : 'white', color: formData.isRetail ? 'white' : 'var(--text)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Retail Sale</button>
                            <button type="button" onClick={() => setFormData({ ...formData, isRetail: false })} style={{ flex: 1, backgroundColor: !formData.isRetail ? 'var(--primary)' : 'white', color: !formData.isRetail ? 'white' : 'var(--text)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Wholesale Sale</button>
                        </div>

                        {/* Quick-pick recent customers - desktop only */}
                        {recentCustomers.length > 0 && !isEditing && (
                            <div className="quick-pick-chips">
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', alignSelf: 'center', marginRight: '4px' }}>Recent:</span>
                                {recentCustomers.map(c => (
                                    <button
                                        key={c._id}
                                        type="button"
                                        className={`quick-chip ${formData.customer === c._id ? 'active' : ''}`}
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                customer: c._id,
                                                customerName: c.name,
                                                previousBalance: c.outstandingReceivable || 0,
                                                phone: c.phone || formData.phone,
                                                address: c.address || formData.address
                                            });
                                        }}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="sales-meta-grid">
                            <div>
                                <label>Customer Type</label>
                                <SearchableSelect
                                    options={customers}
                                    value={formData.customer}
                                    onChange={e => {
                                        const c = customers.find(cust => cust._id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            customer: e.target.value,
                                            customerName: c ? c.name : '',
                                            previousBalance: c ? (c.outstandingReceivable || 0) : 0,
                                            phone: c ? c.phone : formData.phone,
                                            address: c ? c.address : formData.address
                                        });
                                    }}
                                    placeholder="Walking / New Customer"
                                />
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
                                <select value={formData.paymentType} onChange={e => handlePaymentTypeChange(e.target.value)} >
                                    <option value="Cash">Cash Payment</option>
                                    <option value="Credit">Credit (Balance)</option>
                                </select>
                            </div>
                            <div>
                                <label>Sale Date</label>
                                <input type="date" required value={formData.saleDate} onChange={e => setFormData({ ...formData, saleDate: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                            <h3 style={{ margin: 0, fontWeight: '700' }}>Order Items</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => toast.success('Barcode Scanner Initializing...')} style={{ backgroundColor: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Search size={18} /> <span className="desktop-only">Scan</span>
                                </button>
                                <button type="button" onClick={addItem} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Item</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {formData.items.map((item, index) => (
                                <div key={index} className="invoice-row">
                                    <div className="inv-product">
                                        <label>Product Selection</label>
                                        <SearchableSelect
                                            options={products.filter(p => showOutOfStock || p.stockInPieces > 0 || item.product === p._id)}
                                            value={item.product}
                                            onChange={e => handleItemChange(index, 'product', e.target.value)}
                                            placeholder="-- Choose Product --"
                                            required={index === 0 || item.product}
                                        />
                                    </div>
                                    <div className="inv-qty">
                                        <label>Qty</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required={!!item.product}
                                            value={item.quantity}
                                            onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                            onFocus={e => e.target.select()}
                                        />
                                    </div>
                                    <div className="inv-price">
                                        <label>Price</label>
                                        <input
                                            type="number"
                                            required={!!item.product}
                                            value={item.priceAtSale}
                                            onChange={e => handleItemChange(index, 'priceAtSale', parseFloat(e.target.value))}
                                            onFocus={e => e.target.select()}
                                        />
                                    </div>
                                    <div className="inv-total">
                                        <label>Subtotal</label>
                                        <div className="subtotal-display">{item.totalPrice?.toLocaleString()}</div>
                                    </div>
                                    <div className="inv-remove">
                                        {formData.items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(index)}><Trash2 size={20} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Auto-add hint */}
                        <div className="desktop-only" style={{ textAlign: 'center', padding: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', opacity: 0.7 }}>
                            💡 Next row auto-adds when you select a product in the last row
                        </div>
                    </div>

                    <div style={{ borderTop: '2px solid var(--border)', paddingTop: '32px' }}>
                        <div className="sales-footer-grid">
                            <div style={{ color: 'var(--text-muted)' }} className="desktop-only">
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>• Stock will be automatically adjusted.</p>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>• For credit sales, a ledger entry will be created.</p>
                                <p style={{ margin: '0', fontSize: '0.9rem' }}>• Print option available after saving.</p>
                            </div>
                            <div className="sales-summary-panel">
                                <div className="summary-row">
                                    <span>Previous Balance:</span>
                                    <input
                                        type="number" style={{ width: '120px', fontWeight: '800', textAlign: 'right' }}
                                        value={formData.previousBalance} onChange={e => setFormData({ ...formData, previousBalance: parseFloat(e.target.value) || 0 })}
                                        onFocus={e => e.target.select()}
                                    />
                                </div>
                                <div className="summary-row">
                                    <span>Gross Total:</span>
                                    <span style={{ fontWeight: '700' }}>PKR {totalAmount?.toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Discount:</span>
                                    <input
                                        ref={discountRef}
                                        type="number" style={{ width: '120px', fontWeight: '800', textAlign: 'right', color: 'var(--accent)' }}
                                        value={formData.discount} onChange={e => handleDiscountChange(parseFloat(e.target.value) || 0)}
                                        onFocus={e => e.target.select()}
                                    />
                                </div>
                                <div className="summary-row net-total-box">
                                    <span>Net Total:</span>
                                    <span>PKR {(totalAmount - formData.discount)?.toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Amount Received:</span>
                                    <input
                                        ref={receivedAmountRef}
                                        type="number" style={{ width: '120px', fontWeight: '800', textAlign: 'right' }}
                                        value={formData.receivedAmount} onChange={e => setFormData({ ...formData, receivedAmount: parseFloat(e.target.value) || 0 })}
                                        onFocus={e => e.target.select()}
                                    />
                                </div>
                                <div className="summary-row invoice-due-row">
                                    <span style={{ color: (totalAmount - formData.discount - formData.receivedAmount) > 0 ? 'var(--danger)' : 'var(--success)' }}>Invoice Due:</span>
                                    <span style={{ color: (totalAmount - formData.discount - formData.receivedAmount) > 0 ? 'var(--danger)' : 'var(--success)' }}>PKR {(totalAmount - formData.discount - formData.receivedAmount)?.toLocaleString()}</span>
                                </div>
                                <div className="summary-row outstanding-row">
                                    <span>Total Outstanding:</span>
                                    <span>PKR {(formData.previousBalance + (totalAmount - formData.discount - formData.receivedAmount))?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                                    <button type="submit" className="primary" style={{ flex: 2, padding: '16px', fontSize: '1.1rem', borderRadius: '16px', border: 'none', cursor: 'pointer' }}>
                                        <Save size={22} /> {isEditing ? 'Update Invoice' : 'Create Invoice'}
                                        <span className="desktop-only" style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '8px' }}>(Ctrl+Enter)</span>
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showViewModal && !!selectedSale} onClose={() => setShowViewModal(false)} maxWidth="860px">
                <div className="no-print" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'white',
                    zIndex: 10,
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>A4 Invoice Preview</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => downloadPDF(selectedSale)} style={{ background: '#0f172a', color: '#ffffff', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }} title="Download A4 PDF"><Download size={18} /> Download PDF</button>
                        <button onClick={() => printInvoice(selectedSale)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }} title="Print / PDF"><Printer size={18} /> Print</button>
                        <button onClick={() => downloadPNG(selectedSale)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }} title="Download Image"><Eye size={18} /> Image</button>
                        <button onClick={() => handleShare(selectedSale)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }} title="Share"><Share2 size={18} /> Share</button>
                        <button onClick={() => setShowViewModal(false)} style={{ background: '#fef2f2', color: 'var(--danger)', padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer' }} title="Close"><X size={18} /></button>
                    </div>
                </div>

                <div id="receipt-print-area" className="pos-receipt" data-testid="pos-receipt">
                    <div className="pos-receipt-header">
                        <div className="pos-receipt-company">
                            <h1 className="pos-receipt-title">Suriya Enterprises</h1>
                            <div className="pos-receipt-subtitle">Mobile Accessories & Wholesale Distributors</div>
                            <div className="pos-receipt-contact">
                                Plot No. 792, Block 3, F.B. Area, Karachi <br />
                                <strong>Phone:</strong> 0320-8265765
                            </div>
                        </div>
                        <div className="pos-receipt-meta-box">
                            <div className="pos-receipt-doc-badge">INVOICE</div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '2px' }}>
                                #{selectedSale?._id.slice(-6).toUpperCase()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#374151', fontWeight: '700' }}>
                                Date: {selectedSale && formatDate(selectedSale.saleDate)}
                            </div>
                            <div style={{ marginTop: '4px' }}>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid #000000',
                                    backgroundColor: '#ffffff',
                                    color: '#000000',
                                    fontSize: '0.75rem',
                                    fontWeight: '800'
                                }}>
                                    {selectedSale?.isRetail ? 'Retail Sale' : 'Wholesale Sale'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pos-receipt-info-grid">
                        <div className="pos-billing-card">
                            <div className="pos-billing-title">BILLED TO (CUSTOMER)</div>
                            <div className="pos-receipt-info-item">
                                <span className="pos-receipt-info-label">Customer Name:</span>
                                <span className="pos-receipt-info-value">{selectedSale?.customer?.name || selectedSale?.customerName || 'WALK-IN GUEST'}</span>
                            </div>
                            <div className="pos-receipt-info-item">
                                <span className="pos-receipt-info-label">Phone:</span>
                                <span className="pos-receipt-info-value">{selectedSale?.customer?.phone || selectedSale?.phone || 'N/A'}</span>
                            </div>
                            <div className="pos-receipt-info-item">
                                <span className="pos-receipt-info-label">Address:</span>
                                <span className="pos-receipt-info-value">{selectedSale?.customer?.address || selectedSale?.address || 'Karachi'}</span>
                            </div>
                        </div>

                        <div className="pos-billing-card">
                            <div className="pos-billing-title">INVOICE & PAYMENT DETAILS</div>
                            <div className="pos-receipt-info-item">
                                <span className="pos-receipt-info-label">Invoice Date:</span>
                                <span className="pos-receipt-info-value">{selectedSale && formatDate(selectedSale.saleDate)}</span>
                            </div>
                            <div className="pos-receipt-info-item">
                                <span className="pos-receipt-info-label">Payment Method:</span>
                                <span className="pos-receipt-info-value">{selectedSale?.paymentType}</span>
                            </div>
                            <div className="pos-receipt-info-item">
                                <span className="pos-receipt-info-label">Invoice Status:</span>
                                <span className="pos-receipt-info-value" style={{ color: (selectedSale?.balanceAmount || 0) > 0 ? '#b91c1c' : '#15803d' }}>
                                    {(selectedSale?.balanceAmount || 0) > 0 ? 'BALANCE DUE' : 'PAID IN FULL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <table className="pos-receipt-table">
                        <thead data-testid="receipt-header">
                            <tr>
                                <th style={{ textAlign: 'left', width: '45%' }}>ITEM DESCRIPTION</th>
                                <th style={{ textAlign: 'center', width: '15%' }}>QTY</th>
                                <th style={{ textAlign: 'right', width: '20%' }}>PRICE (PKR)</th>
                                <th style={{ textAlign: 'right', width: '20%' }}>TOTAL (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedSale?.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ textAlign: 'left' }}>
                                        <span className="pos-item-name">{item.product?.name || 'Item'}</span>
                                        {item.product?.customerProductName && item.product.customerProductName !== item.product.name && (
                                            <div style={{ fontSize: '11px', color: '#4b5563' }}>({item.product.customerProductName})</div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: '700' }}>
                                        {item.quantity} Pcs
                                    </td>
                                    <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: '700' }}>
                                        {item.priceAtSale.toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: '800' }}>
                                        {item.totalPrice.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pos-receipt-bottom">
                        <div className="pos-signature-box">
                            <div className="pos-sig-label">Authorized Stamp & Signature:</div>
                            <div style={{ flex: 1 }}></div>
                            <div className="pos-sig-line-area">
                                Suriya Enterprises
                            </div>
                        </div>

                        <div className="pos-total-section">
                            <div className="pos-total-row">
                                <span>Gross Total:</span>
                                <span>PKR {selectedSale?.totalAmount.toLocaleString()}</span>
                            </div>
                            {(selectedSale?.discount || 0) > 0 && (
                                <div className="pos-total-row" style={{ color: '#b91c1c' }}>
                                    <span>Discount:</span>
                                    <span>- PKR {selectedSale?.discount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pos-total-row" style={{ fontWeight: '800', color: '#000000' }}>
                                <span>Net Invoice:</span>
                                <span>PKR {(selectedSale?.totalAmount - (selectedSale?.discount || 0)).toLocaleString()}</span>
                            </div>

                            <div className="pos-total-row" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #9ca3af' }}>
                                <span>Previous Balance:</span>
                                <span>PKR {selectedSale?.previousBalance?.toLocaleString() || 0}</span>
                            </div>

                            <div className="pos-net-total">
                                <span>Grand Total:</span>
                                <span>PKR {((selectedSale?.previousBalance || 0) + (selectedSale?.totalAmount - (selectedSale?.discount || 0))).toLocaleString()}</span>
                            </div>

                            <div className="pos-total-row" style={{ marginTop: '6px' }}>
                                <span>Amount Received:</span>
                                <span>PKR {selectedSale?.receivedAmount.toLocaleString()}</span>
                            </div>

                            <div className="pos-status-badge" style={{
                                backgroundColor: ((selectedSale?.previousBalance || 0) + (selectedSale?.totalAmount - (selectedSale?.discount || 0) - (selectedSale?.receivedAmount || 0))) > 0 ? '#fef2f2' : '#f0fdf4',
                                color: ((selectedSale?.previousBalance || 0) + (selectedSale?.totalAmount - (selectedSale?.discount || 0) - (selectedSale?.receivedAmount || 0))) > 0 ? '#b91c1c' : '#15803d',
                                borderColor: ((selectedSale?.previousBalance || 0) + (selectedSale?.totalAmount - (selectedSale?.discount || 0) - (selectedSale?.receivedAmount || 0))) > 0 ? '#b91c1c' : '#15803d'
                            }}>
                                {((selectedSale?.previousBalance || 0) + (selectedSale?.totalAmount - (selectedSale?.discount || 0) - (selectedSale?.receivedAmount || 0))) > 0
                                    ? `BALANCE DUE: PKR ${((selectedSale?.previousBalance || 0) + (selectedSale?.totalAmount - (selectedSale?.discount || 0) - (selectedSale?.receivedAmount || 0))).toLocaleString()}`
                                    : 'FULLY PAID'}
                            </div>
                        </div>
                    </div>

                    <div className="pos-footer">
                        <div>THANK YOU FOR CHOOSING SURIYA ENTERPRISES!</div>
                        <div style={{ marginTop: '4px', fontSize: '10px', color: '#6b7280' }}>For inquiries or orders: Phone: 0320-8265765 | Computer Generated Sales Invoice</div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showSuccessModal && !!lastCreatedInvoice} onClose={() => setShowSuccessModal(false)} maxWidth="450px">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 style={{ margin: '0 0 8px 0', fontWeight: '900' }}>Invoice Created!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontWeight: '500' }}>Invoice #{lastCreatedInvoice?._id.slice(-6).toUpperCase()} has been saved successfully.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
                        <button onClick={() => { setShowSuccessModal(false); downloadPDF(lastCreatedInvoice); }} style={{ padding: '14px 6px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', fontWeight: '800', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            <Download size={20} /> PDF (A4)
                        </button>
                        <button onClick={() => { setShowSuccessModal(false); printInvoice(lastCreatedInvoice); }} style={{ padding: '14px 6px', borderRadius: '14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: '800', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            <Printer size={20} /> Print
                        </button>
                        <button onClick={() => { setShowSuccessModal(false); downloadPNG(lastCreatedInvoice); }} style={{ padding: '14px 6px', borderRadius: '14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: '800', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            <Eye size={20} /> Image
                        </button>
                        <button onClick={() => { setShowSuccessModal(false); handleShare(lastCreatedInvoice); }} style={{ padding: '14px 6px', borderRadius: '14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: '800', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            <Share2 size={20} /> Share
                        </button>
                    </div>

                    <button onClick={() => setShowSuccessModal(false)} style={{ width: '100%', padding: '18px', borderRadius: '18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>
                        Done & Close
                    </button>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .sales-meta-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                }
                .invoice-row {
                    display: grid; 
                    grid-template-columns: 3fr 1fr 1.5fr 1.5fr 48px; 
                    gap: 16px; 
                    align-items: end; 
                    background-color: white; 
                    padding: 16px; 
                    border-radius: 16px; 
                    border: 1px solid var(--border);
                }
                .invoice-row label {
                    font-size: 0.7rem; 
                    margin-bottom: 4px; 
                    color: var(--text-muted); 
                    font-weight: 800; 
                    text-transform: uppercase;
                }
                .subtotal-display {
                    padding: 12px; 
                    border-radius: 10px; 
                    background-color: #f8fafc; 
                    fontWeight: 800; 
                    text-align: right;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    border: 1px solid var(--border);
                }
                .inv-remove button {
                    padding: 12px; 
                    color: var(--danger); 
                    border: none; 
                    background: #fff1f2; 
                    border-radius: 10px; 
                    cursor: pointer;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .sales-footer-grid {
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                    gap: 32px;
                }
                .sales-summary-panel {
                    display: flex; 
                    flex-direction: column; 
                    gap: 16px;
                }
                .summary-row {
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                }
                .summary-row > span:first-child {
                    fontWeight: 600; 
                    color: var(--text-muted);
                }
                .net-total-box {
                    padding: 16px; 
                    background-color: var(--primary-light); 
                    border-radius: 12px;
                }
                .net-total-box span:first-child {
                    fontWeight: 800; 
                    color: var(--primary-dark); 
                    fontSize: 1.1rem;
                }
                .net-total-box span:last-child {
                    fontWeight: 900; 
                    color: var(--primary); 
                    fontSize: 1.3rem;
                }
                .invoice-due-row span {
                    fontWeight: 900;
                    fontSize: 1.1rem;
                }
                .outstanding-row {
                    padding: 12px; 
                    border-top: 1px solid var(--border); 
                    margin-top: 8px;
                }
                .outstanding-row span:first-child {
                    fontWeight: 800; 
                    color: var(--text);
                }
                .outstanding-row span:last-child {
                    fontWeight: 900; 
                    color: var(--text); 
                    fontSize: 1.2rem;
                }

                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }

                @media print {
                    body * { visibility: hidden !important; }
                    .pos-receipt, .pos-receipt * { visibility: visible !important; }
                    .pos-receipt { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        box-shadow: none !important; 
                        border: none !important; 
                        background: white !important;
                    }
                    .no-print, .modal-overlay, .fab-button, .page-header { display: none !important; }
                    .modal-content { 
                        background: none !important; 
                        padding: 0 !important; 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        box-shadow: none !important;
                        border: none !important;
                    }
                }

              @media (max-width: 768px) {
                .sales-meta-grid { grid-template-columns: 1fr; }
                .invoice-row { 
                    grid-template-columns: 1fr 1fr !important; 
                    gap: 12px !important; 
                    padding: 16px !important; 
                }
                .inv-product { grid-column: span 2; }
                .inv-qty { grid-column: span 1; }
                .inv-price, .inv-total { grid-column: span 1; }
                .inv-total { border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 4px; grid-column: span 2; }
                .inv-remove { grid-column: span 2; }
                .inv-remove button { width: 100%; margin-top: 8px; }
                .sales-summary-panel { gap: 12px; }
                .summary-row { flex-direction: row; justify-content: space-between; }
                .modal-content { padding: 16px !important; }
              }
            `}} />
        </div>
    );
};

export default Sales;
