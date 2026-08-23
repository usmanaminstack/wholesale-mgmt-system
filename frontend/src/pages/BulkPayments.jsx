import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getLocalDateString } from '../utils/dateUtils';
import { Plus, Trash2, Save, RotateCcw, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, AlertCircle, Calendar, Wallet } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import toast from 'react-hot-toast';

const BulkPayments = () => {
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [rows, setRows] = useState([
        {
            id: Date.now(),
            entityType: 'Customer',
            entityId: '',
            amount: '',
            paymentMethod: 'Cash',
            paymentDate: getLocalDateString(),
            note: '',
            status: 'pending', // 'pending' | 'submitting' | 'success' | 'error'
            errorMsg: ''
        }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [globalDate, setGlobalDate] = useState(getLocalDateString());
    const [globalMethod, setGlobalMethod] = useState('Cash');

    useEffect(() => {
        fetchEntities();
    }, []);

    const fetchEntities = async () => {
        try {
            const [cData, sData] = await Promise.all([
                api.get('/customers'),
                api.get('/suppliers')
            ]);
            setCustomers(cData.data);
            setSuppliers(sData.data);
        } catch (err) {
            toast.error('Failed to load accounts');
        }
    };

    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Date.now() + Math.random(),
                entityType: 'Customer',
                entityId: '',
                amount: '',
                paymentMethod: 'Cash',
                paymentDate: getLocalDateString(),
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
                // Reset entityId if entityType changes
                if (field === 'entityType') {
                    updated.entityId = '';
                }
                return updated;
            }
            return row;
        }));
    };

    const applyGlobalDate = () => {
        setRows(rows.map(row => ({ ...row, paymentDate: globalDate })));
        toast.success('Applied date to all rows');
    };

    const applyGlobalMethod = () => {
        setRows(rows.map(row => ({ ...row, paymentMethod: globalMethod })));
        toast.success('Applied payment method to all rows');
    };

    const resetTable = () => {
        if (window.confirm('Are you sure you want to reset the table? All unsaved inputs will be lost.')) {
            setRows([
                {
                    id: Date.now(),
                    entityType: 'Customer',
                    entityId: '',
                    amount: '',
                    paymentMethod: 'Cash',
                    paymentDate: getLocalDateString(),
                    note: '',
                    status: 'pending',
                    errorMsg: ''
                }
            ]);
        }
    };

    const handleSubmit = async () => {
        // Validate rows
        const validPayments = [];
        const updatedRows = [...rows];
        let hasErrors = false;

        updatedRows.forEach((row, index) => {
            if (!row.entityId) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Account selection is required';
                hasErrors = true;
            } else if (!row.amount || parseFloat(row.amount) <= 0) {
                updatedRows[index].status = 'error';
                updatedRows[index].errorMsg = 'Amount must be greater than 0';
                hasErrors = true;
            } else {
                updatedRows[index].status = 'pending';
                updatedRows[index].errorMsg = '';
                validPayments.push({
                    rowIndex: index,
                    entityType: row.entityType,
                    entityId: row.entityId,
                    amount: parseFloat(row.amount),
                    paymentDate: row.paymentDate,
                    paymentMethod: row.paymentMethod,
                    note: row.note
                });
            }
        });

        if (hasErrors) {
            setRows(updatedRows);
            toast.error('Please correct errors before submitting');
            return;
        }

        if (validPayments.length === 0) {
            toast.error('No payments to submit');
            return;
        }

        setSubmitting(true);
        // Mark all as submitting
        setRows(rows.map(r => ({ ...r, status: 'submitting' })));

        try {
            const response = await api.post('/payments/bulk', {
                payments: validPayments.map(({ rowIndex, ...payment }) => payment)
            });

            const results = response.data.results;
            const finalRows = [...rows];
            let successCount = 0;
            let errorCount = 0;

            results.forEach((res, idx) => {
                const originalIndex = validPayments[idx].rowIndex;
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
                toast.success(`Successfully saved all ${successCount} payments!`);
            } else {
                toast.error(`Saved ${successCount} payments, but ${errorCount} failed.`);
            }
        } catch (err) {
            toast.error(err.message || 'Server error occurred during bulk insert');
            setRows(rows.map(r => ({ ...r, status: 'error', errorMsg: err.message })));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-in" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Bulk Payment Entry</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Record multiple customer collections or supplier settlements in one go.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={resetTable} className="secondary" style={{ padding: '14px 24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCcw size={18} /> Reset Table
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="primary" style={{ padding: '14px 28px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Save size={18} /> {submitting ? 'Saving Entries...' : 'Save All Entries'}
                    </button>
                </div>
            </div>

            {/* Quick Helper Panel */}
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
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>Default Payment Method</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select value={globalMethod} onChange={e => setGlobalMethod(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontWeight: '600' }}>
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                            <button onClick={applyGlobalMethod} className="secondary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>Apply</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spreadsheet Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table" style={{ width: '100%', minWidth: '1100px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                                <th style={{ width: '150px' }}>Flow Type</th>
                                <th style={{ minWidth: '280px' }}>Party Account</th>
                                <th style={{ width: '160px' }}>Amount (PKR)</th>
                                <th style={{ width: '150px' }}>Method</th>
                                <th style={{ width: '160px' }}>Date</th>
                                <th>Note / Ref</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '60px', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const activeEntities = row.entityType === 'Customer' ? customers : suppliers;
                                return (
                                    <tr key={row.id}>
                                        <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => updateRow(row.id, 'entityType', 'Customer')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '800',
                                                        cursor: 'pointer',
                                                        backgroundColor: row.entityType === 'Customer' ? 'var(--primary-light)' : 'transparent',
                                                        border: `1.5px solid ${row.entityType === 'Customer' ? 'var(--primary)' : 'var(--border)'}`,
                                                        color: row.entityType === 'Customer' ? 'var(--primary)' : 'var(--text-muted)'
                                                    }}
                                                >
                                                    In
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateRow(row.id, 'entityType', 'Supplier')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '800',
                                                        cursor: 'pointer',
                                                        backgroundColor: row.entityType === 'Supplier' ? '#fef2f2' : 'transparent',
                                                        border: `1.5px solid ${row.entityType === 'Supplier' ? 'var(--danger)' : 'var(--border)'}`,
                                                        color: row.entityType === 'Supplier' ? 'var(--danger)' : 'var(--text-muted)'
                                                    }}
                                                >
                                                    Out
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <SearchableSelect
                                                options={activeEntities.map(e => ({
                                                    ...e,
                                                    displayName: `${e.name} (Bal: ${(row.entityType === 'Customer' ? e.outstandingReceivable : e.outstandingPayable)?.toLocaleString()})`
                                                }))}
                                                labelField="displayName"
                                                value={row.entityId}
                                                onChange={e => updateRow(row.id, 'entityId', e.target.value)}
                                                placeholder="Search Account..."
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={row.amount}
                                                onChange={e => updateRow(row.id, 'amount', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    fontWeight: '700',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--border)'
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={row.paymentMethod}
                                                onChange={e => updateRow(row.id, 'paymentMethod', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    fontWeight: '700',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--border)'
                                                }}
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Cheque">Cheque</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                value={row.paymentDate}
                                                onChange={e => updateRow(row.id, 'paymentDate', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--border)'
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                placeholder="Reference info..."
                                                value={row.note}
                                                onChange={e => updateRow(row.id, 'note', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--border)'
                                                }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {row.status === 'success' && <CheckCircle2 color="var(--success)" size={20} title="Saved Successfully" />}
                                            {row.status === 'error' && (
                                                <div title={row.errorMsg} style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center', color: 'var(--danger)' }}>
                                                    <XCircle size={20} />
                                                    <span style={{ display: 'none' }}>{row.errorMsg}</span>
                                                </div>
                                            )}
                                            {row.status === 'submitting' && <div className="spinner-small" />}
                                            {row.status === 'pending' && <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px dashed var(--border)' }} />}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => removeRow(row.id)}
                                                style={{
                                                    padding: '8px',
                                                    color: 'var(--danger)',
                                                    background: '#fef2f2',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
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

                {/* Add Row Button at bottom of table */}
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
                        <Plus size={18} /> Add Payment Row
                    </button>
                </div>
            </div>

            {/* Error Message Explainer */}
            {rows.some(r => r.status === 'error') && (
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    color: '#9f1239',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
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

export default BulkPayments;
