import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getLocalDateString } from '../utils/dateUtils';
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, XCircle, AlertCircle, ShoppingBag, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import toast from 'react-hot-toast';

const BulkPurchases = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [globalDate, setGlobalDate] = useState(getLocalDateString());
    const [globalPaymentType, setGlobalPaymentType] = useState('Cash');
    const [submitting, setSubmitting] = useState(false);

    const createEmptyBill = () => ({
        id: Date.now() + Math.random(),
        supplier: '',
        purchaseDate: globalDate,
        paymentType: globalPaymentType,
        paidAmount: 0,
        note: '',
        status: 'pending', // 'pending' | 'submitting' | 'success' | 'error'
        errorMsg: '',
        items: [
            {
                id: Date.now() + Math.random() + 1,
                product: '',
                unit: 'Carton',
                quantity: 1,
                costAtPurchase: 0,
                totalCost: 0
            }
        ]
    });

    const [bills, setBills] = useState([createEmptyBill()]);

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
            toast.error('Failed to load suppliers and products');
        }
    };

    // Calculate totals for a specific bill
    const getBillCalculations = (bill) => {
        const grandTotal = bill.items.reduce((sum, item) => sum + (parseFloat(item.totalCost) || 0), 0);
        const paid = parseFloat(bill.paidAmount) || 0;
        const balance = grandTotal - paid;
        return { grandTotal, paid, balance };
    };

    // Add new Bill
    const addBill = () => {
        setBills(prev => [...prev, createEmptyBill()]);
    };

    // Remove Bill
    const removeBill = (billId) => {
        if (bills.length === 1) {
            toast.error('At least one bill is required');
            return;
        }
        setBills(prev => prev.filter(b => b.id !== billId));
    };

    // Update Bill header field
    const updateBillHeader = (billId, field, value) => {
        setBills(prev => prev.map(bill => {
            if (bill.id !== billId) return bill;
            const updated = { ...bill, [field]: value };

            const { grandTotal } = getBillCalculations(updated);

            if (field === 'paymentType') {
                if (value === 'Cash') updated.paidAmount = grandTotal;
                else if (value === 'Credit') updated.paidAmount = 0;
            }

            return updated;
        }));
    };

    // Add Item to a specific Bill
    const addItemToBill = (billId) => {
        setBills(prev => prev.map(bill => {
            if (bill.id !== billId) return bill;
            return {
                ...bill,
                items: [
                    ...bill.items,
                    {
                        id: Date.now() + Math.random(),
                        product: '',
                        unit: 'Carton',
                        quantity: 1,
                        costAtPurchase: 0,
                        totalCost: 0
                    }
                ]
            };
        }));
    };

    // Remove Item from a specific Bill
    const removeItemFromBill = (billId, itemId) => {
        setBills(prev => prev.map(bill => {
            if (bill.id !== billId) return bill;
            if (bill.items.length === 1) {
                toast.error('Each bill must have at least one product');
                return bill;
            }
            const updatedItems = bill.items.filter(i => i.id !== itemId);
            const updated = { ...bill, items: updatedItems };

            if (updated.paymentType === 'Cash') {
                const { grandTotal } = getBillCalculations(updated);
                updated.paidAmount = grandTotal;
            }
            return updated;
        }));
    };

    // Update Item within a Bill
    const updateBillItem = (billId, itemId, field, value) => {
        setBills(prev => prev.map(bill => {
            if (bill.id !== billId) return bill;

            const updatedItems = bill.items.map(item => {
                if (item.id !== itemId) return item;
                const updatedItem = { ...item, [field]: value };

                if (field === 'product' || field === 'unit') {
                    const prodId = field === 'product' ? value : item.product;
                    const prod = products.find(p => p._id === prodId);
                    if (prod) {
                        const targetUnit = field === 'unit' ? value : item.unit;
                        updatedItem.costAtPurchase = targetUnit === 'Carton' 
                            ? (prod.costPricePerCarton || prod.pricePerCarton) 
                            : (prod.costPricePerPiece || prod.pricePerPiece);
                    }
                }

                const qty = field === 'quantity' ? (parseFloat(value) || 0) : (parseFloat(item.quantity) || 0);
                const cost = field === 'costAtPurchase' ? (parseFloat(value) || 0) : (parseFloat(updatedItem.costAtPurchase) || 0);
                updatedItem.totalCost = qty * cost;

                return updatedItem;
            });

            const updated = { ...bill, items: updatedItems };
            if (updated.paymentType === 'Cash') {
                const { grandTotal } = getBillCalculations(updated);
                updated.paidAmount = grandTotal;
            }
            return updated;
        }));
    };

    // Apply global defaults to all bills
    const applyGlobalDate = () => {
        setBills(prev => prev.map(b => ({ ...b, purchaseDate: globalDate })));
        toast.success('Applied date to all bills');
    };

    const applyGlobalPaymentType = () => {
        setBills(prev => prev.map(b => {
            const updated = { ...b, paymentType: globalPaymentType };
            const { grandTotal } = getBillCalculations(updated);
            updated.paidAmount = globalPaymentType === 'Cash' ? grandTotal : 0;
            return updated;
        }));
        toast.success('Applied payment type to all bills');
    };

    const resetAllBills = () => {
        if (window.confirm('Are you sure you want to reset all bills? All entered data will be cleared.')) {
            setBills([createEmptyBill()]);
        }
    };

    // Submit all bills
    const handleSubmitAll = async () => {
        let hasErrors = false;
        const validatedPurchases = [];
        const newBills = [...bills];

        newBills.forEach((bill, bIdx) => {
            if (!bill.supplier) {
                newBills[bIdx].status = 'error';
                newBills[bIdx].errorMsg = 'Supplier must be selected';
                hasErrors = true;
                return;
            }

            const validItems = bill.items.filter(i => i.product && parseFloat(i.quantity) > 0);
            if (validItems.length === 0) {
                newBills[bIdx].status = 'error';
                newBills[bIdx].errorMsg = 'Please add at least one product with quantity > 0';
                hasErrors = true;
                return;
            }

            newBills[bIdx].status = 'pending';
            newBills[bIdx].errorMsg = '';

            const { paid } = getBillCalculations(bill);

            validatedPurchases.push({
                billIndex: bIdx,
                supplier: bill.supplier,
                paymentType: bill.paymentType,
                paidAmount: paid,
                purchaseDate: bill.purchaseDate,
                items: validItems.map(item => ({
                    product: item.product,
                    quantity: parseFloat(item.quantity) || 1,
                    unit: item.unit,
                    costAtPurchase: parseFloat(item.costAtPurchase) || 0,
                    totalCost: parseFloat(item.totalCost) || 0
                }))
            });
        });

        if (hasErrors) {
            setBills(newBills);
            toast.error('Please fix errors in highlighted bills');
            return;
        }

        if (validatedPurchases.length === 0) {
            toast.error('No valid bills to submit');
            return;
        }

        setSubmitting(true);
        setBills(prev => prev.map(b => ({ ...b, status: 'submitting' })));

        try {
            const response = await api.post('/purchases/bulk', {
                purchases: validatedPurchases.map(({ billIndex, ...purchaseData }) => purchaseData)
            });

            const results = response.data.results;
            const updated = [...bills];
            let successCount = 0;
            let errorCount = 0;

            results.forEach((res, idx) => {
                const billIdx = validatedPurchases[idx].billIndex;
                if (res.status === 'success') {
                    updated[billIdx].status = 'success';
                    updated[billIdx].errorMsg = '';
                    successCount++;
                } else {
                    updated[billIdx].status = 'error';
                    updated[billIdx].errorMsg = res.message;
                    errorCount++;
                }
            });

            setBills(updated);
            if (errorCount === 0) {
                toast.success(`All ${successCount} purchase bills saved successfully!`);
            } else {
                toast.error(`${successCount} bills saved, ${errorCount} failed.`);
            }
        } catch (err) {
            toast.error(err.message || 'Error occurred while saving purchase bills');
            setBills(prev => prev.map(b => ({ ...b, status: 'error', errorMsg: err.message })));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-in" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '90px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>
                        Bulk Purchases (Multi-Bill Entry)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
                        Create and record multiple complete vendor purchase bills for any date in one go.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={resetAllBills} className="secondary" style={{ padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCcw size={18} /> Reset All
                    </button>
                    <button onClick={handleSubmitAll} disabled={submitting} className="primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                        <Save size={18} /> {submitting ? 'Saving All Bills...' : `Save All Bills (${bills.length})`}
                    </button>
                </div>
            </div>

            {/* Quick Defaults Panel */}
            <div className="card" style={{ marginBottom: '28px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                Default Date
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="date" 
                                    value={globalDate} 
                                    onChange={e => setGlobalDate(e.target.value)} 
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)' }} 
                                />
                                <button onClick={applyGlobalDate} className="secondary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                    Apply to All
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                Default Payment
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select 
                                    value={globalPaymentType} 
                                    onChange={e => setGlobalPaymentType(e.target.value)} 
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                >
                                    <option value="Cash">Cash Purchase</option>
                                    <option value="Credit">Credit Purchase</option>
                                </select>
                                <button onClick={applyGlobalPaymentType} className="secondary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                    Apply to All
                                </button>
                            </div>
                        </div>
                    </div>

                    <button onClick={addBill} className="primary" style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <Plus size={18} /> Add Another Bill
                    </button>
                </div>
            </div>

            {/* List of Bill Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {bills.map((bill, bIdx) => {
                    const { grandTotal, paid, balance } = getBillCalculations(bill);

                    return (
                        <div 
                            key={bill.id} 
                            className="card" 
                            style={{ 
                                padding: '24px', 
                                border: bill.status === 'error' ? '2px solid var(--danger)' : bill.status === 'success' ? '2px solid var(--success)' : '1.5px solid var(--border)',
                                backgroundColor: bill.status === 'success' ? '#fcfdfd' : 'white'
                            }}
                        >
                            {/* Card Header Bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1.5px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '10px', 
                                        backgroundColor: '#10b981', 
                                        color: 'white', 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontWeight: '900',
                                        fontSize: '0.9rem'
                                    }}>
                                        {bIdx + 1}
                                    </span>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                                        Purchase Bill #{bIdx + 1}
                                    </h3>
                                    {bill.status === 'success' && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: '800', fontSize: '0.85rem' }}>
                                            <CheckCircle2 size={16} /> Saved
                                        </span>
                                    )}
                                    {bill.status === 'error' && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontWeight: '800', fontSize: '0.85rem' }}>
                                            <XCircle size={16} /> {bill.errorMsg}
                                        </span>
                                    )}
                                </div>

                                <button 
                                    type="button" 
                                    onClick={() => removeBill(bill.id)} 
                                    style={{ padding: '8px 12px', color: 'var(--danger)', background: '#fef2f2', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }}
                                >
                                    <Trash2 size={16} /> Remove Bill
                                </button>
                            </div>

                            {/* Bill Header Fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Supplier
                                    </label>
                                    <SearchableSelect
                                        options={suppliers.map(s => ({
                                            ...s,
                                            displayName: `${s.name} (Payable: PKR ${s.outstandingPayable?.toLocaleString()})`
                                        }))}
                                        labelField="displayName"
                                        value={bill.supplier}
                                        onChange={e => updateBillHeader(bill.id, 'supplier', e.target.value)}
                                        placeholder="Select Supplier..."
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Purchase Date
                                    </label>
                                    <input 
                                        type="date" 
                                        value={bill.purchaseDate} 
                                        onChange={e => updateBillHeader(bill.id, 'purchaseDate', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontWeight: '600' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Payment Method
                                    </label>
                                    <select 
                                        value={bill.paymentType} 
                                        onChange={e => updateBillHeader(bill.id, 'paymentType', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                    >
                                        <option value="Cash">Cash Purchase</option>
                                        <option value="Credit">Credit Purchase</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Bill Note / Ref
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Invoice # or ref..."
                                        value={bill.note} 
                                        onChange={e => updateBillHeader(bill.id, 'note', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--border)' }}
                                    />
                                </div>
                            </div>

                            {/* Line Items Sub-table */}
                            <div style={{ border: '1.5px solid var(--border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="modern-table" style={{ width: '100%', margin: 0 }}>
                                        <thead style={{ backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                <th style={{ width: '35%' }}>Product Item</th>
                                                <th style={{ width: '15%' }}>Unit</th>
                                                <th style={{ width: '15%' }}>Qty</th>
                                                <th style={{ width: '15%' }}>Cost (PKR)</th>
                                                <th style={{ width: '15%' }}>Total Cost</th>
                                                <th style={{ width: '5%', textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bill.items.map((item, iIdx) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <SearchableSelect
                                                            options={products}
                                                            labelField="name"
                                                            value={item.product}
                                                            onChange={e => updateBillItem(bill.id, item.id, 'product', e.target.value)}
                                                            placeholder="Search Product..."
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            value={item.unit}
                                                            onChange={e => updateBillItem(bill.id, item.id, 'unit', e.target.value)}
                                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                                        >
                                                            <option value="Carton">Carton</option>
                                                            <option value="Piece">Piece</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            placeholder="1"
                                                            value={item.quantity}
                                                            onChange={e => updateBillItem(bill.id, item.id, 'quantity', e.target.value)}
                                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={item.costAtPurchase}
                                                            onChange={e => updateBillItem(bill.id, item.id, 'costAtPurchase', e.target.value)}
                                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                                        />
                                                    </td>
                                                    <td style={{ fontWeight: '800', color: 'var(--text)' }}>
                                                        PKR {item.totalCost?.toLocaleString()}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItemFromBill(bill.id, item.id)}
                                                            style={{ padding: '6px', color: 'var(--danger)', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                                    <button
                                        type="button"
                                        onClick={() => addItemToBill(bill.id)}
                                        style={{ background: 'white', color: '#10b981', border: '1.5px dashed var(--border)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                    >
                                        <Plus size={16} /> Add Another Product Line
                                    </button>
                                </div>
                            </div>

                            {/* Bill Financial Summary Bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '12px', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grand Total</span>
                                        <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text)' }}>PKR {grandTotal.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paid Amount</span>
                                        <input
                                            type="number"
                                            disabled={bill.paymentType === 'Cash'}
                                            value={bill.paidAmount}
                                            onChange={e => updateBillHeader(bill.id, 'paidAmount', e.target.value)}
                                            style={{ width: '120px', padding: '6px 8px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '800', marginLeft: '6px' }}
                                        />
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance Payable</span>
                                        <div style={{ fontWeight: '900', fontSize: '1.1rem', color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                            PKR {balance.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Add Bill and Submit buttons */}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <button 
                    type="button" 
                    onClick={addBill} 
                    className="secondary" 
                    style={{ padding: '14px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}
                >
                    <Plus size={18} /> Add Another Purchase Bill Card
                </button>

                <button 
                    type="button" 
                    onClick={handleSubmitAll} 
                    disabled={submitting} 
                    className="primary" 
                    style={{ padding: '14px 32px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '1rem' }}
                >
                    <Save size={20} /> {submitting ? 'Saving...' : `Save All Purchase Bills (${bills.length})`}
                </button>
            </div>
        </div>
    );
};

export default BulkPurchases;
