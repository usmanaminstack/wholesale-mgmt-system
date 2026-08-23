import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { getLocalDateString } from '../utils/dateUtils';
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, XCircle, AlertCircle, ShoppingBag, Calendar, CreditCard, Download, Upload } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const BulkSales = () => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [globalDate, setGlobalDate] = useState(getLocalDateString());
    const [globalPaymentType, setGlobalPaymentType] = useState('Cash');
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const createEmptyBill = () => ({
        id: Date.now() + Math.random(),
        customer: '',
        saleDate: globalDate,
        paymentType: globalPaymentType,
        discount: 0,
        receivedAmount: 0,
        note: '',
        status: 'pending',
        errorMsg: '',
        items: [
            {
                id: Date.now() + Math.random() + 1,
                product: '',
                unit: 'Carton',
                quantity: 1,
                priceAtSale: 0,
                totalPrice: 0
            }
        ]
    });

    const [bills, setBills] = useState([createEmptyBill()]);

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
            toast.error('Failed to load customers and products');
        }
    };

    // Calculate totals for a specific bill
    const getBillCalculations = (bill) => {
        const subtotal = bill.items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
        const discount = parseFloat(bill.discount) || 0;
        const netTotal = Math.max(0, subtotal - discount);
        const received = parseFloat(bill.receivedAmount) || 0;
        const balance = netTotal - received;
        return { subtotal, discount, netTotal, received, balance };
    };

    // Download Sample Excel Template
    const handleDownloadTemplate = () => {
        const sampleCustomer = customers[0]?.name || "Sample Customer";
        const sampleProd1 = products[0]?.name || "Cold Drink 1.5L";
        const sampleProd2 = products[1]?.name || "Cold Drink 500ml";

        const templateData = [
            {
                "Bill No / Invoice No": "BILL-101",
                "Customer Name": sampleCustomer,
                "Sale Date (YYYY-MM-DD)": getLocalDateString(),
                "Product Name": sampleProd1,
                "Unit (Carton/Piece)": "Carton",
                "Quantity": 10,
                "Price Per Unit": 1250,
                "Discount": 0,
                "Payment Type (Cash/Credit)": "Cash",
                "Received Amount": 12500,
                "Note": "Order Morning"
            },
            {
                "Bill No / Invoice No": "BILL-101",
                "Customer Name": sampleCustomer,
                "Sale Date (YYYY-MM-DD)": getLocalDateString(),
                "Product Name": sampleProd2,
                "Unit (Carton/Piece)": "Carton",
                "Quantity": 5,
                "Price Per Unit": 1500,
                "Discount": 0,
                "Payment Type (Cash/Credit)": "Cash",
                "Received Amount": 7500,
                "Note": "Order Morning"
            },
            {
                "Bill No / Invoice No": "BILL-102",
                "Customer Name": "Walk-in Customer",
                "Sale Date (YYYY-MM-DD)": getLocalDateString(),
                "Product Name": sampleProd1,
                "Unit (Carton/Piece)": "Piece",
                "Quantity": 12,
                "Price Per Unit": 110,
                "Discount": 20,
                "Payment Type (Cash/Credit)": "Cash",
                "Received Amount": 1300,
                "Note": "Evening Separate Bill"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales_Template");
        XLSX.writeFile(wb, `Bulk_Sales_Template_${getLocalDateString()}.xlsx`);
        toast.success("Excel template downloaded!");
    };

    // Upload and Parse Excel File
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    toast.error("The uploaded file contains no rows");
                    return;
                }

                // Explicit grouping by Bill No / Invoice No
                // If Bill No is empty, each row is preserved as its own distinct separate bill!
                const groupedBillsMap = new Map();

                data.forEach((row, index) => {
                    const billNoRaw = String(row["Bill No / Invoice No"] || row["Bill No"] || row["Invoice No"] || row["Invoice #"] || row["Bill #"] || "").trim();
                    const custNameRaw = row["Customer Name"] || row["Customer"] || row["CustomerName"] || "";
                    const dateRaw = row["Sale Date (YYYY-MM-DD)"] || row["Sale Date"] || row["Date"] || globalDate;
                    const payTypeRaw = row["Payment Type (Cash/Credit)"] || row["Payment Type"] || row["PaymentType"] || "Cash";
                    const noteRaw = row["Note"] || row["Reference"] || (billNoRaw ? `Bill #${billNoRaw}` : "");

                    // Normalize date
                    let saleDate = globalDate;
                    if (dateRaw) {
                        if (typeof dateRaw === 'number') {
                            const parsed = new Date((dateRaw - (25567 + 2)) * 86400 * 1000);
                            saleDate = getLocalDateString(parsed);
                        } else {
                            saleDate = String(dateRaw).trim().slice(0, 10);
                        }
                    }

                    const paymentType = String(payTypeRaw).toLowerCase().includes('credit') ? 'Credit' : 'Cash';

                    // Match customer
                    const matchedCustomer = customers.find(c => 
                        c.name.toLowerCase().trim() === String(custNameRaw).toLowerCase().trim() ||
                        (c.phone && String(c.phone).trim() === String(custNameRaw).trim())
                    );
                    const customerId = matchedCustomer ? matchedCustomer._id : '';

                    // Group Key: If Bill No is provided, group same Bill No together.
                    // If Bill No is blank, do NOT merge; keep as separate individual sale bill!
                    const groupKey = billNoRaw ? `${customerId}_${saleDate}_${paymentType}_${billNoRaw}` : `distinct_bill_${index}`;

                    // Product matching
                    const prodNameRaw = row["Product Name"] || row["Product"] || row["ProductName"] || "";
                    const matchedProduct = products.find(p => 
                        p.name.toLowerCase().trim() === String(prodNameRaw).toLowerCase().trim() ||
                        (p.customerProductName && p.customerProductName.toLowerCase().trim() === String(prodNameRaw).toLowerCase().trim())
                    );

                    const unitRaw = String(row["Unit (Carton/Piece)"] || row["Unit"] || "Carton").toLowerCase().includes('piece') ? 'Piece' : 'Carton';
                    const qtyRaw = parseFloat(row["Quantity"] || row["Qty"] || 1) || 1;

                    let priceRaw = parseFloat(row["Price Per Unit"] || row["Price"] || row["Rate"]);
                    if (isNaN(priceRaw) && matchedProduct) {
                        priceRaw = unitRaw === 'Carton' ? matchedProduct.pricePerCarton : matchedProduct.pricePerPiece;
                    }
                    if (isNaN(priceRaw)) priceRaw = 0;

                    const discRaw = parseFloat(row["Discount"] || 0) || 0;
                    const itemTotal = qtyRaw * priceRaw;

                    const itemObj = {
                        id: Date.now() + Math.random() + index,
                        product: matchedProduct ? matchedProduct._id : '',
                        unit: unitRaw,
                        quantity: qtyRaw,
                        priceAtSale: priceRaw,
                        totalPrice: itemTotal
                    };

                    if (!groupedBillsMap.has(groupKey)) {
                        const recRaw = parseFloat(row["Received Amount"] || row["Received"] || row["ReceivedAmount"]);
                        groupedBillsMap.set(groupKey, {
                            id: Date.now() + Math.random() + index * 100,
                            customer: customerId,
                            saleDate: saleDate,
                            paymentType: paymentType,
                            discount: discRaw,
                            receivedAmount: isNaN(recRaw) ? (paymentType === 'Cash' ? Math.max(0, itemTotal - discRaw) : 0) : recRaw,
                            note: noteRaw,
                            status: 'pending',
                            errorMsg: '',
                            items: [itemObj]
                        });
                    } else {
                        const existingBill = groupedBillsMap.get(groupKey);
                        existingBill.items.push(itemObj);
                        existingBill.discount += discRaw;

                        if (existingBill.paymentType === 'Cash') {
                            const subtotal = existingBill.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
                            existingBill.receivedAmount = Math.max(0, subtotal - existingBill.discount);
                        }
                    }
                });

                const parsedBills = Array.from(groupedBillsMap.values());
                if (parsedBills.length > 0) {
                    setBills(parsedBills);
                    toast.success(`Successfully loaded ${parsedBills.length} sales bills from file!`);
                }
            } catch (err) {
                console.error("Excel parse error:", err);
                toast.error("Failed to read Excel file. Please use the template format.");
            } finally {
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
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

            const { subtotal } = getBillCalculations(updated);
            const disc = field === 'discount' ? (parseFloat(value) || 0) : (parseFloat(updated.discount) || 0);
            const net = Math.max(0, subtotal - disc);

            if (field === 'paymentType') {
                if (value === 'Cash') updated.receivedAmount = net;
                else if (value === 'Credit') updated.receivedAmount = 0;
            } else if (updated.paymentType === 'Cash' && field === 'discount') {
                updated.receivedAmount = net;
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
                        priceAtSale: 0,
                        totalPrice: 0
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
                const { netTotal } = getBillCalculations(updated);
                updated.receivedAmount = netTotal;
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
                        updatedItem.priceAtSale = targetUnit === 'Carton' ? prod.pricePerCarton : prod.pricePerPiece;
                    }
                }

                const qty = field === 'quantity' ? (parseFloat(value) || 0) : (parseFloat(item.quantity) || 0);
                const price = field === 'priceAtSale' ? (parseFloat(value) || 0) : (parseFloat(updatedItem.priceAtSale) || 0);
                updatedItem.totalPrice = qty * price;

                return updatedItem;
            });

            const updated = { ...bill, items: updatedItems };
            if (updated.paymentType === 'Cash') {
                const { netTotal } = getBillCalculations(updated);
                updated.receivedAmount = netTotal;
            }
            return updated;
        }));
    };

    // Apply global defaults to all bills
    const applyGlobalDate = () => {
        setBills(prev => prev.map(b => ({ ...b, saleDate: globalDate })));
        toast.success('Applied date to all bills');
    };

    const applyGlobalPaymentType = () => {
        setBills(prev => prev.map(b => {
            const updated = { ...b, paymentType: globalPaymentType };
            const { netTotal } = getBillCalculations(updated);
            updated.receivedAmount = globalPaymentType === 'Cash' ? netTotal : 0;
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
        const validatedSales = [];
        const newBills = [...bills];

        newBills.forEach((bill, bIdx) => {
            const validItems = bill.items.filter(i => i.product && parseFloat(i.quantity) > 0);
            
            if (validItems.length === 0) {
                newBills[bIdx].status = 'error';
                newBills[bIdx].errorMsg = 'Please add at least one product with quantity > 0';
                hasErrors = true;
                return;
            }

            if (bill.paymentType === 'Credit' && !bill.customer) {
                newBills[bIdx].status = 'error';
                newBills[bIdx].errorMsg = 'Customer must be selected for Credit sales';
                hasErrors = true;
                return;
            }

            newBills[bIdx].status = 'pending';
            newBills[bIdx].errorMsg = '';

            const { discount, received } = getBillCalculations(bill);
            const custObj = customers.find(c => c._id === bill.customer);

            validatedSales.push({
                billIndex: bIdx,
                customer: bill.customer || null,
                customerName: custObj ? custObj.name : 'Walk-in Customer',
                paymentType: bill.paymentType,
                receivedAmount: received,
                discount: discount,
                saleDate: bill.saleDate,
                note: bill.note || '',
                isRetail: !bill.customer,
                items: validItems.map(item => ({
                    product: item.product,
                    quantity: parseFloat(item.quantity) || 1,
                    unit: item.unit,
                    priceAtSale: parseFloat(item.priceAtSale) || 0,
                    totalPrice: parseFloat(item.totalPrice) || 0
                }))
            });
        });

        if (hasErrors) {
            setBills(newBills);
            toast.error('Please fix errors in highlighted bills');
            return;
        }

        if (validatedSales.length === 0) {
            toast.error('No valid bills to submit');
            return;
        }

        setSubmitting(true);
        setBills(prev => prev.map(b => ({ ...b, status: 'submitting' })));

        try {
            const response = await api.post('/sales/bulk', {
                sales: validatedSales.map(({ billIndex, ...saleData }) => saleData)
            });

            const results = response.data.results;
            const updated = [...bills];
            let successCount = 0;
            let errorCount = 0;

            results.forEach((res, idx) => {
                const billIdx = validatedSales[idx].billIndex;
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
                toast.success(`All ${successCount} bills saved successfully!`);
            } else {
                toast.error(`${successCount} bills saved, ${errorCount} failed.`);
            }
        } catch (err) {
            toast.error(err.message || 'Error occurred while saving bills');
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
                        Bulk Sales (Multi-Bill Entry)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
                        Create and record multiple complete customer invoices or upload from Excel (grouped by Bill/Invoice No).
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".xlsx, .xls, .csv" 
                        style={{ display: 'none' }} 
                    />
                    <button onClick={handleDownloadTemplate} className="secondary" style={{ padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                        <Download size={18} /> Download Template
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="secondary" style={{ padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', backgroundColor: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0' }}>
                        <Upload size={18} /> Upload Excel / CSV
                    </button>
                    <button onClick={resetAllBills} className="secondary" style={{ padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCcw size={18} /> Reset
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
                                    <option value="Cash">Cash</option>
                                    <option value="Credit">Credit</option>
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
                    const { subtotal, discount, netTotal, received, balance } = getBillCalculations(bill);

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
                                        backgroundColor: 'var(--primary)', 
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
                                        Sale Bill #{bIdx + 1} {bill.note ? `(${bill.note})` : ''}
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
                                        Customer
                                    </label>
                                    <SearchableSelect
                                        options={customers.map(c => ({
                                            ...c,
                                            displayName: `${c.name} (Bal: PKR ${c.outstandingReceivable?.toLocaleString()})`
                                        }))}
                                        labelField="displayName"
                                        value={bill.customer}
                                        onChange={e => updateBillHeader(bill.id, 'customer', e.target.value)}
                                        placeholder="Select Customer (or Walk-in)..."
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Sale Date
                                    </label>
                                    <input 
                                        type="date" 
                                        value={bill.saleDate} 
                                        onChange={e => updateBillHeader(bill.id, 'saleDate', e.target.value)}
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
                                        <option value="Cash">Cash Sale</option>
                                        <option value="Credit">Credit Sale</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Bill No / Invoice Ref
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. BILL-101 or Ref Info"
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
                                                <th style={{ width: '15%' }}>Price (PKR)</th>
                                                <th style={{ width: '15%' }}>Total</th>
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
                                                            value={item.priceAtSale}
                                                            onChange={e => updateBillItem(bill.id, item.id, 'priceAtSale', e.target.value)}
                                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700' }}
                                                        />
                                                    </td>
                                                    <td style={{ fontWeight: '800', color: 'var(--text)' }}>
                                                        PKR {item.totalPrice?.toLocaleString()}
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
                                        style={{ background: 'white', color: 'var(--primary)', border: '1.5px dashed var(--border)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                    >
                                        <Plus size={16} /> Add Another Product Line
                                    </button>
                                </div>
                            </div>

                            {/* Bill Financial Summary Bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '12px', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtotal</span>
                                        <div style={{ fontWeight: '800', fontSize: '1rem' }}>PKR {subtotal.toLocaleString()}</div>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discount (PKR)</span>
                                        <input
                                            type="number"
                                            value={bill.discount}
                                            onChange={e => updateBillHeader(bill.id, 'discount', e.target.value)}
                                            style={{ width: '90px', padding: '6px 8px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '700', marginLeft: '6px' }}
                                        />
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Total</span>
                                        <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--primary)' }}>PKR {netTotal.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Received Amount</span>
                                        <input
                                            type="number"
                                            disabled={bill.paymentType === 'Cash'}
                                            value={bill.receivedAmount}
                                            onChange={e => updateBillHeader(bill.id, 'receivedAmount', e.target.value)}
                                            style={{ width: '120px', padding: '6px 8px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '800', marginLeft: '6px' }}
                                        />
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance Due</span>
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
                    <Plus size={18} /> Add Another Bill Card
                </button>

                <button 
                    type="button" 
                    onClick={handleSubmitAll} 
                    disabled={submitting} 
                    className="primary" 
                    style={{ padding: '14px 32px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '1rem' }}
                >
                    <Save size={20} /> {submitting ? 'Saving...' : `Save All Bills (${bills.length})`}
                </button>
            </div>
        </div>
    );
};

export default BulkSales;
