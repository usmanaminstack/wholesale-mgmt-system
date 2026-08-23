import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getLocalDateString } from '../utils/dateUtils';
import { Plus, Trash2, Save, RotateCcw, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import toast from 'react-hot-toast';

const BulkSales = () => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [rows, setRows] = useState([
        {
            id: Date.now(),
            customer: '',
            product: '',
            unit: 'Carton',
            quantity: 1,
            priceAtSale: '',
            discount: 0,
            paymentType: 'Cash',
            receivedAmount: '',
            saleDate: getLocalDateString(),
            note: '',
            status: 'pending',
            errorMsg: ''
        }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [globalDate, setGlobalDate] = useState(getLocalDateString());
    const [globalPaymentType, setGlobalPaymentType] = useState('Cash');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [cData, pData] = await Promise.all([
                api.get('/customers'),
                api.get('/products')
            ]);
            setCustomers(cData.data);
            setProducts(pData.data);
        } catch (err) {
            toast.error('Failed to load customers/products');
        }
    };

    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Date.now() + Math.random(),
                customer: '',
                product: '',
                unit: 'Carton',
                quantity: 1,
                priceAtSale: '',
                discount: 0,
                paymentType: 'Cash',
                receivedAmount: '',
                saleDate: getLocalDateString(),
                note: '',
                status: 'pending',
                errorMsg: ''
            }
        ]);
    };

    const removeRow = (id) => {
        if (rows.length === 1) {
            toast.error('At least one row is required');
            return;
        }
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id, field, value) => {
        setRows(rows.map(row => {
            if (row.id === id) {
                const updated = { ...row, [field]: value };

                // Handle product and unit changes to update auto-filled price
                if (field === 'product' || field === 'unit') {
                    const prod = products.find(p => p._id === (field === 'product' ? value : row.product));
                    if (prod) {
                        const targetUnit = field === 'unit' ? value : row.unit;
                        updated.priceAtSale = targetUnit === 'Carton' ? prod.pricePerCarton : prod.pricePerPiece;
                    }
                }

                // Parse numeric inputs
                if (field === 'quantity') {
                    updated.quantity = parseInt(value) || 0;
                }
                if (field === 'priceAtSale') {
                    updated.priceAtSale = parseFloat(value) || 0;
                }
                if (field === 'discount') {
                    updated.discount = parseFloat(value) || 0;
                }
                if (field === 'receivedAmount') {
                    updated.receivedAmount = parseFloat(value) || 0;
                }

                // Recalculate net total
                const price = parseFloat(updated.priceAtSale) || 0;
                const qty = parseInt(updated.quantity) || 0;
                const disc = parseFloat(updated.discount) || 0;
                const netTotal = (qty * price) - disc;

                // Sync received amount for Cash payments
                if (field === 'paymentType' && value === 'Cash') {
                    updated.receivedAmount = netTotal;
                } else if (field === 'paymentType' && value === 'Credit') {
                    updated.receivedAmount = 0;
                } else if (updated.paymentType === 'Cash' && (field === 'product' || field === 'unit' || field === 'quantity' || field === 'priceAtSale' || field === 'discount')) {
                    updated.receivedAmount = netTotal;
                }

                return updated;
            }
            return row;
        }));
    };

    const applyGlobalDate = () => {
        setRows(rows.map(row => ({ ...row, saleDate: globalDate })));
        toast.success('Applied date to all rows');
    };

    const applyGlobalPaymentType = () => {
        setRows(rows.map(row => {
            const price = parseFloat(row.priceAtSale) || 0;
            const qty = parseInt(row.quantity) || 0;
            const disc = parseFloat(row.discount) || 0;
            const netTotal = (qty * price) - disc;
            return {
                ...row,
                paymentType: globalPaymentType,
                receivedAmount: globalPaymentType === 'Cash' ? netTotal : 0
            };
        }));
        toast.success('Applied payment type to all rows');
    };

    const resetTable = () => {
        if (window.confirm('Are you sure you want to reset the table? All unsaved inputs will be lost.')) {
            setRows([
                {
                    id: Date.now(),
                    customer: '',
                    product: '',
                    unit: 'Carton',
                    quantity: 1,
                    priceAtSale: '',
                    discount: 0,
                    paymentType: 'Cash',
                    receivedAmount: '',
                    saleDate: getLocalDateString(),
                    note: '',
                    status: 'pending',
                    errorMsg: ''
                }
            ]);
        }
    };

    const handleSubmit = async () => {
        const validSales = [];
        const updatedRows = [...rows];
        let hasErrors = false;

        updatedRows.forEach((row, index) => {
            if (!row.product) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Product is required';
                hasErrors = true;
            } else if (row.paymentType === 'Credit' && !row.customer) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Customer is required for Credit payments';
                hasErrors = true;
            } else if (!row.quantity || parseInt(row.quantity) <= 0) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Quantity must be greater than 0';
                hasErrors = true;
            } else if (row.priceAtSale === '' || parseFloat(row.priceAtSale) < 0) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Price is invalid';
                hasErrors = true;
            } else {
                const price = parseFloat(row.priceAtSale) || 0;
                const qty = parseInt(row.quantity) || 0;
                const disc = parseFloat(row.discount) || 0;
                const itemTotal = qty * price;
                const netTotal = itemTotal - disc;

                const custObj = customers.find(c => c._id === row.customer);

                updatedRows[index].status = 'pending';
                updatedRows[index].errorMsg = '';
                validSales.push({
                    rowIndex: index,
                    customer: row.customer || null,
                    customerName: custObj ? custObj.name : 'Walk-in Customer',
                    paymentType: row.paymentType,
                    receivedAmount: parseFloat(row.receivedAmount) || 0,
                    discount: disc,
                    saleDate: row.saleDate,
                    isRetail: !row.customer,
                    items: [
                        {
                            product: row.product,
                            quantity: qty,
                            unit: row.unit,
                            priceAtSale: price,
                            totalPrice: itemTotal
                        }
                    ]
                });
            }
        });

        if (hasErrors) {
            setRows(updatedRows);
            toast.error('Please correct errors before submitting');
            return;
        }

        if (validSales.length === 0) {
            toast.error('No sales to submit');
            return;
        }

        setSubmitting(true);
        setRows(rows.map(r => ({ ...r, status: 'submitting' })));

        try {
            const response = await api.post('/sales/bulk', {
                sales: validSales.map(({ rowIndex, ...sale }) => sale)
            });

            const results = response.data.results;
            const finalRows = [...rows];
            let successCount = 0;
            let errorCount = 0;

            results.forEach((res, idx) => {
                const originalIndex = validSales[idx].rowIndex;
                if (res.status === 'success') {
                    finalRows[originalIndex].status = 'success';
                    finalRows[originalIndex].errorMsg = '';
                    successCount++;
                } else {
                    finalRows[originalIndex].status = 'error';
                    finalRows[originalIndex].errorMsg = res.message;
                    errorCount++;
                }
            });

            setRows(finalRows);
            if (errorCount === 0) {
                toast.success(`Successfully saved all ${successCount} sales!`);
            } else {
                toast.error(`Saved ${successCount} sales, but ${errorCount} failed.`);
            }
        } catch (err) {
            toast.error(err.message || 'Server error occurred during bulk insert');
            setRows(rows.map(r => ({ ...r, status: 'error', errorMsg: err.message })));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-in" style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Bulk Sales Entry</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Record multiple sales entries quickly. One product per row model.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={resetTable} className="secondary" style={{ padding: '14px 24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCcw size={18} /> Reset Table
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="primary" style={{ padding: '14px 28px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> {submitting ? 'Saving Sales...' : 'Save All Sales'}
                    </button>
                </div>
            </div>

            {/* Quick Apply Panel */}
            <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quick Apply (Apply to all rows)</h4>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>Default Date</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" value={globalDate} onChange={e => setGlobalDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)' }} />
                            <button onClick={applyGlobalDate} className="secondary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>Apply</button>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>Default Payment Type</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select value={globalPaymentType} onChange={e => setGlobalPaymentType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '600' }}>
                                <option value="Cash">Cash</option>
                                <option value="Credit">Credit</option>
                            </select>
                            <button onClick={applyGlobalPaymentType} className="secondary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>Apply</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table" style={{ width: '100%', minWidth: '1350px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                                <th style={{ minWidth: '220px' }}>Customer</th>
                                <th style={{ minWidth: '220px' }}>Product</th>
                                <th style={{ width: '100px' }}>Unit</th>
                                <th style={{ width: '90px' }}>Qty</th>
                                <th style={{ width: '120px' }}>Price</th>
                                <th style={{ width: '90px' }}>Disc</th>
                                <th style={{ width: '120px' }}>Net Total</th>
                                <th style={{ width: '110px' }}>Pay Type</th>
                                <th style={{ width: '120px' }}>Received</th>
                                <th style={{ width: '140px' }}>Date</th>
                                <th>Note</th>
                                <th style={{ width: '70px', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '60px', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const price = parseFloat(row.priceAtSale) || 0;
                                const qty = parseInt(row.quantity) || 0;
                                const disc = parseFloat(row.discount) || 0;
                                const netTotal = (qty * price) - disc;

                                return (
                                    <tr key={row.id}>
                                        <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                        <td>
                                            <SearchableSelect
                                                options={customers.map(c => ({
                                                    ...c,
                                                    displayName: `${c.name} (Bal: PKR ${c.outstandingReceivable?.toLocaleString()})`
                                                }))}
                                                labelField="displayName"
                                                value={row.customer}
                                                onChange={e => updateRow(row.id, 'customer', e.target.value)}
                                                placeholder="Walk-in Customer"
                                            />
                                        </td>
                                        <td>
                                            <SearchableSelect
                                                options={products}
                                                labelField="name"
                                                value={row.product}
                                                onChange={e => updateRow(row.id, 'product', e.target.value)}
                                                placeholder="Search Product..."
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={row.unit}
                                                onChange={e => updateRow(row.id, 'unit', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            >
                                                <option value="Carton">Carton</option>
                                                <option value="Piece">Piece</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={row.quantity}
                                                onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={row.priceAtSale}
                                                onChange={e => updateRow(row.id, 'priceAtSale', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={row.discount}
                                                onChange={e => updateRow(row.id, 'discount', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            />
                                        </td>
                                        <td style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text)' }}>
                                            PKR {netTotal.toLocaleString()}
                                        </td>
                                        <td>
                                            <select
                                                value={row.paymentType}
                                                onChange={e => updateRow(row.id, 'paymentType', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="Credit">Credit</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                disabled={row.paymentType === 'Cash'}
                                                value={row.receivedAmount}
                                                onChange={e => updateRow(row.id, 'receivedAmount', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                value={row.saleDate}
                                                onChange={e => updateRow(row.id, 'saleDate', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                placeholder="Sale ref..."
                                                value={row.note}
                                                onChange={e => updateRow(row.id, 'note', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {row.status === 'success' && <CheckCircle2 color="var(--success)" size={20} />}
                                            {row.status === 'error' && (
                                                <div title={row.errorMsg} style={{ cursor: 'help', color: 'var(--danger)', display: 'inline-flex' }}>
                                                    <XCircle size={20} />
                                                </div>
                                            )}
                                            {row.status === 'submitting' && <div className="spinner-small" />}
                                            {row.status === 'pending' && <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px dashed var(--border)' }} />}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => removeRow(row.id)}
                                                style={{ padding: '8px', color: 'var(--danger)', background: '#fef2f2', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Add Row */}
                <div style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                    <button
                        onClick={addRow}
                        className="secondary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '2px dashed var(--border)',
                            backgroundColor: 'white',
                            color: 'var(--primary)',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} /> Add Sale Row
                    </button>
                </div>
            </div>

            {/* Error panel */}
            {rows.some(r => r.status === 'error') && (
                <div style={{ marginTop: '24px', padding: '16px', borderRadius: '14px', backgroundColor: '#fff1f2', border: '1.5px solid #fecdd3', color: '#9f1239' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', marginBottom: '8px' }}>
                        <AlertCircle size={18} /> Row Submission Failures
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                        {rows.map((row, idx) => row.status === 'error' && (
                            <li key={row.id}>Row {idx + 1}: {row.errorMsg}</li>
                        ))}
                    </ul>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--border);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default BulkSales;
