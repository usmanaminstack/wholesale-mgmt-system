import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getLocalDateString } from '../utils/dateUtils';
import { Plus, Trash2, Save, RotateCcw, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import toast from 'react-hot-toast';

const BulkPurchases = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [rows, setRows] = useState([
        {
            id: Date.now(),
            supplier: '',
            product: '',
            unit: 'Carton',
            quantity: 1,
            costAtPurchase: '',
            paymentType: 'Cash',
            paidAmount: '',
            purchaseDate: getLocalDateString(),
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
            const [sData, pData] = await Promise.all([
                api.get('/suppliers'),
                api.get('/products')
            ]);
            setSuppliers(sData.data);
            setProducts(pData.data);
        } catch (err) {
            toast.error('Failed to load suppliers/products');
        }
    };

    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Date.now() + Math.random(),
                supplier: '',
                product: '',
                unit: 'Carton',
                quantity: 1,
                costAtPurchase: '',
                paymentType: 'Cash',
                paidAmount: '',
                purchaseDate: getLocalDateString(),
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

                // Handle product and unit changes to update auto-filled cost
                if (field === 'product' || field === 'unit') {
                    const prod = products.find(p => p._id === (field === 'product' ? value : row.product));
                    if (prod) {
                        const targetUnit = field === 'unit' ? value : row.unit;
                        updated.costAtPurchase = targetUnit === 'Carton' 
                            ? (prod.costPricePerCarton || prod.pricePerCarton) 
                            : (prod.costPricePerPiece || prod.pricePerPiece);
                    }
                }

                // Parse numeric inputs
                if (field === 'quantity') {
                    updated.quantity = parseInt(value) || 0;
                }
                if (field === 'costAtPurchase') {
                    updated.costAtPurchase = parseFloat(value) || 0;
                }
                if (field === 'paidAmount') {
                    updated.paidAmount = parseFloat(value) || 0;
                }

                // Recalculate total cost
                const cost = parseFloat(updated.costAtPurchase) || 0;
                const qty = parseInt(updated.quantity) || 0;
                const totalCost = qty * cost;

                // Sync paid amount for Cash payments
                if (field === 'paymentType' && value === 'Cash') {
                    updated.paidAmount = totalCost;
                } else if (field === 'paymentType' && value === 'Credit') {
                    updated.paidAmount = 0;
                } else if (updated.paymentType === 'Cash' && (field === 'product' || field === 'unit' || field === 'quantity' || field === 'costAtPurchase')) {
                    updated.paidAmount = totalCost;
                }

                return updated;
            }
            return row;
        }));
    };

    const applyGlobalDate = () => {
        setRows(rows.map(row => ({ ...row, purchaseDate: globalDate })));
        toast.success('Applied date to all rows');
    };

    const applyGlobalPaymentType = () => {
        setRows(rows.map(row => {
            const cost = parseFloat(row.costAtPurchase) || 0;
            const qty = parseInt(row.quantity) || 0;
            const totalCost = qty * cost;
            return {
                ...row,
                paymentType: globalPaymentType,
                paidAmount: globalPaymentType === 'Cash' ? totalCost : 0
            };
        }));
        toast.success('Applied payment type to all rows');
    };

    const resetTable = () => {
        if (window.confirm('Are you sure you want to reset the table? All unsaved inputs will be lost.')) {
            setRows([
                {
                    id: Date.now(),
                    supplier: '',
                    product: '',
                    unit: 'Carton',
                    quantity: 1,
                    costAtPurchase: '',
                    paymentType: 'Cash',
                    paidAmount: '',
                    purchaseDate: getLocalDateString(),
                    note: '',
                    status: 'pending',
                    errorMsg: ''
                }
            ]);
        }
    };

    const handleSubmit = async () => {
        const validPurchases = [];
        const updatedRows = [...rows];
        let hasErrors = false;

        updatedRows.forEach((row, index) => {
            if (!row.supplier) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Supplier is required';
                hasErrors = true;
            } else if (!row.product) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Product is required';
                hasErrors = true;
            } else if (!row.quantity || parseInt(row.quantity) <= 0) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Quantity must be greater than 0';
                hasErrors = true;
            } else if (row.costAtPurchase === '' || parseFloat(row.costAtPurchase) < 0) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Cost is invalid';
                hasErrors = true;
            } else {
                const cost = parseFloat(row.costAtPurchase) || 0;
                const qty = parseInt(row.quantity) || 0;
                const totalCost = qty * cost;

                updatedRows[index].status = 'pending';
                updatedRows[index].errorMsg = '';
                validPurchases.push({
                    rowIndex: index,
                    supplier: row.supplier,
                    paymentType: row.paymentType,
                    paidAmount: parseFloat(row.paidAmount) || 0,
                    purchaseDate: row.purchaseDate,
                    items: [
                        {
                            product: row.product,
                            quantity: qty,
                            unit: row.unit,
                            costAtPurchase: cost,
                            totalCost: totalCost
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

        if (validPurchases.length === 0) {
            toast.error('No purchases to submit');
            return;
        }

        setSubmitting(true);
        setRows(rows.map(r => ({ ...r, status: 'submitting' })));

        try {
            const response = await api.post('/purchases/bulk', {
                purchases: validPurchases.map(({ rowIndex, ...p }) => p)
            });

            const results = response.data.results;
            const finalRows = [...rows];
            let successCount = 0;
            let errorCount = 0;

            results.forEach((res, idx) => {
                const originalIndex = validPurchases[idx].rowIndex;
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
                toast.success(`Successfully saved all ${successCount} purchases!`);
            } else {
                toast.error(`Saved ${successCount} purchases, but ${errorCount} failed.`);
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
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Bulk Purchases Entry</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Record multiple purchases entries quickly. One product per row model.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={resetTable} className="secondary" style={{ padding: '14px 24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCcw size={18} /> Reset Table
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="primary" style={{ padding: '14px 28px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> {submitting ? 'Saving Purchases...' : 'Save All Purchases'}
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
                                <th style={{ minWidth: '220px' }}>Supplier</th>
                                <th style={{ minWidth: '220px' }}>Product</th>
                                <th style={{ width: '100px' }}>Unit</th>
                                <th style={{ width: '90px' }}>Qty</th>
                                <th style={{ width: '120px' }}>Cost</th>
                                <th style={{ width: '120px' }}>Total Cost</th>
                                <th style={{ width: '110px' }}>Pay Type</th>
                                <th style={{ width: '120px' }}>Paid Amount</th>
                                <th style={{ width: '140px' }}>Date</th>
                                <th>Note / Ref</th>
                                <th style={{ width: '70px', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '60px', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const cost = parseFloat(row.costAtPurchase) || 0;
                                const qty = parseInt(row.quantity) || 0;
                                const totalCost = qty * cost;

                                return (
                                    <tr key={row.id}>
                                        <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                        <td>
                                            <SearchableSelect
                                                options={suppliers.map(s => ({
                                                    ...s,
                                                    displayName: `${s.name} (Bal: PKR ${s.outstandingPayable?.toLocaleString()})`
                                                }))}
                                                labelField="displayName"
                                                value={row.supplier}
                                                onChange={e => updateRow(row.id, 'supplier', e.target.value)}
                                                placeholder="Search Supplier..."
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
                                                value={row.costAtPurchase}
                                                onChange={e => updateRow(row.id, 'costAtPurchase', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            />
                                        </td>
                                        <td style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text)' }}>
                                            PKR {totalCost.toLocaleString()}
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
                                                value={row.paidAmount}
                                                onChange={e => updateRow(row.id, 'paidAmount', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                value={row.purchaseDate}
                                                onChange={e => updateRow(row.id, 'purchaseDate', e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                placeholder="Purchase ref..."
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
                        <Plus size={18} /> Add Purchase Row
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

export default BulkPurchases;
