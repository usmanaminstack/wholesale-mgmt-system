import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Truck, Search, Phone, MapPin, DollarSign, Briefcase, Trash2, History, X, CheckCircle, ArrowRight, Download } from 'lucide-react';
import Modal from '../components/Modal';
import { getLocalDateString, formatDate } from '../utils/dateUtils';
import { jsPDF } from 'jspdf';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', openingBalance: '' });
    const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', note: '', paymentDate: getLocalDateString() });
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingLedger, setLoadingLedger] = useState(false);

    useEffect(() => { fetchSuppliers(); }, []);

    const fetchSuppliers = async () => {
        const { data } = await api.get('/suppliers');
        setSuppliers(data);
    };

    const handleDeleteSupplier = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier? All ledger history will be removed.')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchSuppliers();
            } catch (err) {
                alert(err.response?.data?.message || err.message);
            }
        }
    };

    const fetchLedger = async (supplierId) => {
        setLoadingLedger(true);
        try {
            const { data } = await api.get(`/suppliers/${supplierId}/ledger`);
            setLedger(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLedger(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            const paymentBody = {
                entityType: 'Supplier',
                entityId: selectedSupplier._id,
                amount: parseFloat(paymentData.amount),
                paymentMethod: paymentData.method,
                note: paymentData.note || `Manual payment to Supplier - ${new Date().toLocaleDateString()}`,
                paymentDate: paymentData.paymentDate
            };
            await api.post('/payments', paymentBody);
            setPaymentData({ amount: '', method: 'Cash', note: '', paymentDate: getLocalDateString() });
            fetchLedger(selectedSupplier._id);
            fetchSuppliers();
        } catch (err) {}
    };

    const handleDeletePayment = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment? Supplier balance will be adjusted.')) {
            try {
                await api.delete(`/payments/${id}`);
                fetchSuppliers();
                fetchLedger(selectedSupplier._id);
            } catch (err) {}
        }
    };

    const handleDeletePurchase = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase? Stock and balances will be reversed.')) {
            try {
                await api.delete(`/purchases/${id}`);
                fetchSuppliers();
                fetchLedger(selectedSupplier._id);
            } catch (err) {}
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/suppliers', formData);
            setShowModal(false);
            setFormData({ name: '', phone: '', address: '', openingBalance: '' });
            fetchSuppliers();
        } catch (err) {
            alert(err.message);
        }
    };

    const downloadFrontendPDF = () => {
        if (!selectedSupplier) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Colors
        const primary = [30, 58, 95];
        const textDark = [15, 23, 42];
        const textMuted = [100, 116, 139];
        const borderCol = [226, 232, 240];

        const startX = 15;
        const pageW = 210;
        const usableW = pageW - (startX * 2);

        // Header Banner
        doc.setFillColor(...primary);
        doc.rect(0, 0, pageW, 42, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('GUDDU TRADERS', pageW / 2, 16, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('SUPPLIER ACCOUNT STATEMENT', pageW / 2, 24, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(147, 197, 253);
        doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, pageW / 2, 34, { align: 'center' });

        // Supplier Info Card
        let currentY = 50;
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, currentY, usableW, 25, 'F');
        doc.setDrawColor(...borderCol);
        doc.rect(startX, currentY, usableW, 25, 'S');

        doc.setTextColor(...textDark);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(selectedSupplier.name, startX + 5, currentY + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...textMuted);
        doc.text(`Phone: ${selectedSupplier.phone || '—'}`, startX + 5, currentY + 13);
        doc.text(`Address: ${selectedSupplier.address || '—'}`, startX + 5, currentY + 19);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(`Outstanding Payable: PKR ${selectedSupplier.outstandingPayable.toLocaleString()}`, startX + usableW - 5, currentY + 10, { align: 'right' });

        // Column positions
        const colPos = {
            no:   startX + 2,
            date: startX + 8,
            type: startX + 32,
            desc: startX + 52,
            bill: startX + 124,
            pay:  startX + 154,
            bal:  startX + usableW - 2
        };

        const drawTableHeader = (y) => {
            doc.setFillColor(...primary);
            doc.rect(startX, y, usableW, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('#',            colPos.no,   y + 5.5);
            doc.text('DATE',         colPos.date,  y + 5.5);
            doc.text('TYPE',         colPos.type,  y + 5.5);
            doc.text('DESCRIPTION',  colPos.desc,  y + 5.5);
            doc.text('PURCHASE (CR)', colPos.bill, y + 5.5, { align: 'right' });
            doc.text('PAID (DR)',     colPos.pay,  y + 5.5, { align: 'right' });
            doc.text('BALANCE',      colPos.bal,  y + 5.5, { align: 'right' });
        };

        currentY = 82;
        drawTableHeader(currentY);
        currentY += 8;

        let rowNo = 0;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        // Sort ascending for chronological PDF
        const sortedLedger = [...ledger].sort((a, b) => {
            const dateDiff = new Date(a.date) - new Date(b.date);
            if (dateDiff !== 0) return dateDiff;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        // Back-calculate the starting balance
        const totalDebits  = sortedLedger.reduce((sum, e) => sum + (e.debit  || 0), 0);
        const totalCredits = sortedLedger.reduce((sum, e) => sum + (e.credit || 0), 0);
        // For supplier: credit = purchase (increases payable), debit = payment (decreases payable)
        let runningBal = (selectedSupplier?.outstandingPayable || 0) + totalDebits - totalCredits;

        const computedLedger = sortedLedger.map(entry => {
            runningBal = runningBal - (entry.debit || 0) + (entry.credit || 0);
            return { ...entry, balance: runningBal };
        });

        computedLedger.forEach(entry => {
            rowNo++;

            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
                drawTableHeader(currentY);
                currentY += 8;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
            }

            if (rowNo % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(startX, currentY, usableW, 8, 'F');
            }

            doc.setTextColor(...textDark);
            doc.text(String(rowNo), colPos.no, currentY + 5.5);
            doc.text(formatDate(entry.date), colPos.date, currentY + 5.5);
            doc.text(entry.transactionType.toUpperCase(), colPos.type, currentY + 5.5);

            const desc = (entry.description || '—').substring(0, 48);
            doc.text(desc, colPos.desc, currentY + 5.5);

            // For supplier: credit = purchase amount, debit = payment
            if (entry.credit > 0) {
                doc.text(entry.credit.toLocaleString(), colPos.bill, currentY + 5.5, { align: 'right' });
            } else {
                doc.text('—', colPos.bill - 2, currentY + 5.5, { align: 'right' });
            }

            if (entry.debit > 0) {
                doc.text(entry.debit.toLocaleString(), colPos.pay, currentY + 5.5, { align: 'right' });
            } else {
                doc.text('—', colPos.pay - 2, currentY + 5.5, { align: 'right' });
            }

            doc.setFont('helvetica', 'bold');
            doc.text(entry.balance.toLocaleString(), colPos.bal, currentY + 5.5, { align: 'right' });
            doc.setFont('helvetica', 'normal');

            doc.setDrawColor(241, 245, 249);
            doc.line(startX, currentY + 8, startX + usableW, currentY + 8);

            currentY += 8;
        });

        // Summary footer
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        currentY += 5;
        doc.setFillColor(...primary);
        doc.rect(startX, currentY, usableW, 20, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('FINAL ACCOUNT BALANCE SUMMARY', startX + 5, currentY + 7);

        doc.setFontSize(11);
        doc.setTextColor(234, 179, 8);
        doc.text(`PKR ${selectedSupplier.outstandingPayable.toLocaleString()}`, startX + usableW - 5, currentY + 12, { align: 'right' });

        doc.save(`${selectedSupplier.name.replace(/\s+/g, '_')}_Supplier_Statement.pdf`);
    };

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));


    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Suppliers</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Manage warehouse accounts and payables.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="primary desktop-only" style={{ padding: '14px 28px', borderRadius: '14px' }}>
                    <Plus size={20} /> Add Provider
                </button>
            </div>

            <button onClick={() => setShowModal(true)} className="fab-button mobile-only" title="Add Supplier">
                <Plus size={32} />
            </button>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Search by company name..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            style={{ padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem' }} 
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Company / Warehouse</th>
                                <th>Contact Information</th>
                                <th>Total Payable</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s._id}>
                                    <td data-label="Supplier">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Supplier Account</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Contact">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text)', fontWeight: '600' }}>
                                                <Phone size={14} color="#f59e0b" /> {s.phone}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <MapPin size={14} /> {s.address}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Payable">
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', backgroundColor: s.outstandingPayable > 0 ? '#fee2e2' : '#dcfce7', color: s.outstandingPayable > 0 ? '#991b1b' : '#166534', fontWeight: '900', fontSize: '1rem' }}>
                                            PKR {s.outstandingPayable.toLocaleString()}
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="action-btn">
                                            <button onClick={() => { setSelectedSupplier(s); setShowLedgerModal(true); fetchLedger(s._id); }} style={{ padding: '10px 16px', backgroundColor: '#fff7ed', color: '#f59e0b', fontWeight: '800', fontSize: '0.8rem', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <History size={16} /> History
                                            </button>
                                            <button onClick={() => handleDeleteSupplier(s._id)} style={{ padding: '10px', color: 'var(--danger)', backgroundColor: '#fef2f2', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="450px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.5rem' }}>New Supplier</h3>
                    <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>COMPANY NAME</label>
                        <input type="text" placeholder="e.g. ABC Beverages Warehouse" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>PHONE NUMBER</label>
                        <input type="text" placeholder="03xx-xxxxxxx" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>OPENING BALANCE (PAYABLE)</label>
                        <input type="number" placeholder="Enter previous debt if any" value={formData.openingBalance} onChange={e => setFormData({ ...formData, openingBalance: e.target.value })} style={{ border: '2px solid #ffedd5' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>WAREHOUSE ADDRESS</label>
                        <textarea placeholder="Location..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ height: '100px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                        <button type="submit" className="primary" style={{ flex: 2, padding: '16px', borderRadius: '16px' }}>Save Profile</button>
                        <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '700' }}>Cancel</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showLedgerModal && !!selectedSupplier} onClose={() => setShowLedgerModal(false)} maxWidth="1000px" padding="0">
                <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #fff7ed, #ffffff)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.025em' }}>{selectedSupplier?.name}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                Payable: <span style={{ color: 'var(--danger)', fontWeight: '800' }}>PKR {selectedSupplier?.outstandingPayable.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={downloadFrontendPDF}
                            style={{ padding: '10px 16px', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: '800', fontSize: '0.85rem', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Download size={16} /> PDF Statement
                        </button>
                        <button onClick={() => setShowLedgerModal(false)} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><X size={24} /></button>
                    </div>
                </div>

                <div className="ledger-container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, overflow: 'hidden' }}>
                    <div style={{ overflowY: 'auto', padding: '32px', borderRight: '1px solid var(--border)' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History size={20} color="#f59e0b" /> Payment History
                        </h4>
                        {loadingLedger ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '600' }}>Fetching ledger...</div>
                        ) : (
                            <table className="modern-table" style={{ border: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Dr (-)</th>
                                        <th>Cr (+)</th>
                                        <th style={{ textAlign: 'right' }}>Balance</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Sort descending (newest first)
                                        const sorted = [...ledger].sort((a, b) => {
                                            const dateDiff = new Date(b.date) - new Date(a.date);
                                            if (dateDiff !== 0) return dateDiff;
                                            return new Date(b.createdAt) - new Date(a.createdAt);
                                        });

                                        // Back-calculate running balances from current outstanding payable
                                        // For supplier: credit=purchase (increases payable), debit=payment (decreases payable)
                                        let currentBal = selectedSupplier?.outstandingPayable || 0;
                                        const computed = sorted.map((entry, idx) => {
                                            if (idx > 0) {
                                                const prev = sorted[idx - 1];
                                                // Undo the previous entry's effect to get the balance before it
                                                currentBal = currentBal + (prev.debit || 0) - (prev.credit || 0);
                                            }
                                            return { ...entry, balance: currentBal };
                                        });

                                        return computed.map((entry, idx) => (
                                            <tr key={idx}>
                                                <td data-label="Date">
                                                    <div style={{ fontWeight: '700' }}>{formatDate(entry.date)}</div>
                                                </td>
                                                <td data-label="Type">
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '800',
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: entry.transactionType === 'Purchase' ? '#fee2e2' : '#dcfce7',
                                                        color: entry.transactionType === 'Purchase' ? '#991b1b' : '#166534'
                                                    }}>
                                                        {entry.transactionType.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td data-label="Dr" style={{ color: 'var(--success)', fontWeight: '700' }}>{entry.debit > 0 ? `-${entry.debit.toLocaleString()}` : '—'}</td>
                                                <td data-label="Cr" style={{ color: 'var(--danger)', fontWeight: '700' }}>{entry.credit > 0 ? `+${entry.credit.toLocaleString()}` : '—'}</td>
                                                <td data-label="Bal" style={{ textAlign: 'right', fontWeight: '900' }}>{entry.balance.toLocaleString()}</td>
                                                <td data-label="Action" style={{ textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => entry.transactionType === 'Purchase' ? handleDeletePurchase(entry.referenceId) : handleDeletePayment(entry.referenceId)}
                                                        style={{ background: '#fef2f2', color: 'var(--danger)', padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                    {ledger.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No record found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div style={{ padding: '32px', backgroundColor: '#fcfcfc', overflowY: 'auto' }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={18} /></div>
                                Pay Supplier
                            </h4>
                            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Amount Paid</label>
                                    <input
                                        type="number" required
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        placeholder="PKR 0.00"
                                        style={{ fontSize: '1.25rem', fontWeight: '800' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Method</label>
                                    <select
                                        value={paymentData.method}
                                        onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                                    >
                                        <option value="Cash">Cash Payment</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Payment Date</label>
                                    <input
                                        type="date" required
                                        value={paymentData.paymentDate}
                                        onChange={e => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Note</label>
                                    <textarea
                                        value={paymentData.note}
                                        onChange={e => setPaymentData({ ...paymentData, note: e.target.value })}
                                        placeholder="Payment details..."
                                        style={{ height: '80px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <button type="submit" className="primary" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer' }}>
                                    Record Payment <ArrowRight size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </Modal>
            <style dangerouslySetInnerHTML={{
                __html: `
              @media (max-width: 900px) {
                .ledger-container { grid-template-columns: 1fr !important; overflow-y: auto !important; }
                .ledger-container > div:first-child { border-right: none !important; border-bottom: 1px solid var(--border); }
              }
            `}} />
        </div>
    );
};

export default Suppliers;

