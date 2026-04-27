import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Package, Search, ChevronRight, X, AlertTriangle, Trash2, ArrowUpRight, BarChart3, Filter } from 'lucide-react';
import Modal from '../components/Modal';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({ pieces: 0, reason: '' });
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        piecesPerCarton: '',
        costPricePerCarton: '',
        costPricePerPiece: '',
        pricePerCarton: '',
        pricePerPiece: '',
        customerProductName: '',
        lowStockThreshold: 10
    });

    const handleEdit = (p) => {
        setEditingProduct(p);
        setFormData({
            name: p.name,
            category: p.category,
            piecesPerCarton: p.piecesPerCarton,
            costPricePerCarton: p.costPricePerCarton || (p.pricePerCarton * 0.9),
            costPricePerPiece: p.costPricePerPiece || (p.pricePerPiece * 0.9),
            pricePerCarton: p.pricePerCarton,
            pricePerPiece: p.pricePerPiece,
            customerProductName: p.customerProductName || '',
            lowStockThreshold: p.lowStockThreshold
        });
        setShowModal(true);
    };

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        const { data } = await api.get('/products');
        setProducts(data);
    };

    const handleAdjustment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/products/${editingProduct._id}/adjust`, { adjustment: adjustmentData.pieces });
            setShowAdjustModal(false);
            setAdjustmentData({ pieces: 0, reason: '' });
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    const requestDeleteProduct = (id) => {
        const product = products.find(p => p._id === id);
        if(product) setProductToDelete(product);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await api.delete(`/products/${productToDelete._id}`);
            setProductToDelete(null);
            fetchProducts();
        } catch (err) {
            // Error handled by interceptor
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) await api.put(`/products/${editingProduct._id}`, formData);
            else await api.post('/products', formData);
            setShowModal(false);
            setEditingProduct(null);
            setFormData({ name: '', category: '', piecesPerCarton: '', costPricePerCarton: '', costPricePerPiece: '', pricePerCarton: '', pricePerPiece: '', customerProductName: '', lowStockThreshold: 10 });
            fetchProducts();
        } catch (err) { alert(err.message); }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : p.isActive !== false;
        return matchesSearch && matchesStatus;
    });

    const lowStockCount = products.filter(p => p.stockInPieces <= p.lowStockThreshold).length;


    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }} className="page-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '4px', color: 'var(--text)' }}>Inventory</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Manage products, prices and stock levels.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => { setEditingProduct(null); setFormData({ name: '', category: '', piecesPerCarton: '', costPricePerCarton: '', costPricePerPiece: '', pricePerCarton: '', pricePerPiece: '', lowStockThreshold: 10 }); setShowModal(true); }}
                        className="primary desktop-only"
                        style={{ padding: '14px 28px', borderRadius: '14px' }}
                    >
                        <Plus size={20} /> Add Product
                    </button>
                </div>
            </div>

            <button data-testid="add-product-fab" onClick={() => { setEditingProduct(null); setFormData({ name: '', category: '', piecesPerCarton: '', costPricePerCarton: '', costPricePerPiece: '', pricePerCarton: '', pricePerPiece: '', lowStockThreshold: 10 }); setShowModal(true); }} className="fab-button mobile-only" title="Add Product">
                <Plus size={32} />
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '6px solid var(--primary)' }}>
                    <div style={{ padding: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' }}><Package size={24} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Items</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{products.length}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '6px solid var(--danger)' }}>
                    <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: 'var(--danger)', borderRadius: '12px' }}><AlertTriangle size={24} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--danger)' }}>{lowStockCount}</div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', backgroundColor: '#f8fafc' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by product name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                        <Filter size={18} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                            Show Inactive
                        </label>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Product Details</th>
                                <th className="desktop-only">Cost Info</th>
                                <th>Sale Price</th>
                                <th>Stock Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p._id}>
                                    <td data-label="Product">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Package size={20} color="var(--primary)" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: p.isActive === false ? 'var(--text-muted)' : 'var(--text)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {p.name}
                                                    {p.isActive === false && (
                                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', backgroundColor: '#f1f5f9', color: 'var(--text-muted)', borderRadius: '6px', fontWeight: '900', textTransform: 'uppercase' }}>Inactive</span>
                                                    )}
                                                    {(!p.costPricePerCarton || p.costPricePerCarton <= 0) && (
                                                        <span title="Missing Cost Price" style={{ color: 'var(--danger)', display: 'flex' }}><AlertTriangle size={14} /></span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                    <span style={{ padding: '2px 8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800' }}>{p.category}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>{p.piecesPerCarton} Pcs/Ctn</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Cost" className="desktop-only">
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div style={{ color: 'var(--accent)', fontWeight: '800' }} title="Average Cost">
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>AVG:</span> {p.costPricePerCarton?.toLocaleString()}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600' }}>
                                                LAST: {p.lastPurchasePricePerCarton?.toLocaleString() || '—'}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Price">
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: '800' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>CTN:</span> {p.pricePerCarton?.toLocaleString()}</div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-muted)' }}><span style={{ fontSize: '0.7rem' }}>PCS:</span> {p.pricePerPiece?.toLocaleString()}</div>
                                        </div>
                                    </td>
                                    <td data-label="Stock">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{
                                                fontWeight: '900',
                                                color: p.stockInPieces <= p.lowStockThreshold ? 'var(--danger)' : 'var(--success)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '1rem'
                                            }}>
                                                {p.stockInPieces} {p.stockInPieces <= p.lowStockThreshold && <AlertTriangle size={16} />}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                                                ≈ {p.piecesPerCarton ? (p.stockInPieces / p.piecesPerCarton).toFixed(1) : 0} Cartons
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="action-btn">
                                            <button data-testid="adjust-stock-btn" onClick={() => { setEditingProduct(p); setAdjustmentData({ pieces: 0, reason: '' }); setShowAdjustModal(true); }} style={{ background: '#f0fdf4', color: 'var(--success)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Adjust Stock"><ArrowUpRight size={18} /></button>
                                            <button data-testid="edit-product-btn" onClick={() => handleEdit(p)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Edit"><Edit2 size={18} /></button>
                                            <button data-testid="delete-product-btn" onClick={() => requestDeleteProduct(p._id)} style={{ background: '#fef2f2', color: 'var(--danger)', padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {filteredProducts.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '0 0 20px 20px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                <Package size={32} />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontWeight: '800', color: 'var(--text)' }}>No Products Found</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>We couldn't find any items matching your search criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="550px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h3 data-testid="modal-title" style={{ margin: 0, fontWeight: '900', fontSize: '1.5rem' }}>{editingProduct ? 'Update Product' : 'New Product'}</h3>
                    <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', color: 'var(--text)', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>PRODUCT NAME</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Coca Cola 1.5L" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>CATEGORY</label>
                            <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Soft Drink" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>PCS PER CARTON</label>
                            <input type="number" required value={formData.piecesPerCarton} onChange={(e) => setFormData({ ...formData, piecesPerCarton: e.target.value })} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>CUSTOMER FACING NAME (FOR INVOICE)</label>
                            <input type="text" value={formData.customerProductName} onChange={(e) => setFormData({ ...formData, customerProductName: e.target.value })} placeholder="Optional shop-specific name" />
                        </div>
                        <div style={{ gridColumn: 'span 2', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)' }}>Purchasing & Cost</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>COST (CTN)</label>
                                    <input type="number" placeholder="0" required value={formData.costPricePerCarton} onChange={e => setFormData({ ...formData, costPricePerCarton: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>COST (PC)</label>
                                    <input type="number" placeholder="0" required value={formData.costPricePerPiece} onChange={e => setFormData({ ...formData, costPricePerPiece: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div style={{ gridColumn: 'span 2', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: '800', color: '#166534' }}>Selling Prices</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#166534', marginBottom: '6px', display: 'block' }}>SALE (CTN)</label>
                                    <input type="number" placeholder="0" required value={formData.pricePerCarton} onChange={e => setFormData({ ...formData, pricePerCarton: e.target.value })} style={{ border: '2px solid #bbf7d0' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#166534', marginBottom: '6px', display: 'block' }}>SALE (PC)</label>
                                    <input type="number" placeholder="0" required value={formData.pricePerPiece} onChange={e => setFormData({ ...formData, pricePerPiece: e.target.value })} style={{ border: '2px solid #bbf7d0' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>LOW STOCK ALERT (PIECES)</label>
                            <input type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                        <button type="submit" className="primary" style={{ flex: 2, padding: '16px', borderRadius: '16px' }}>{editingProduct ? 'Save Changes' : 'Create Product'}</button>
                        <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '800' }}>Cancel</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} maxWidth="400px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontWeight: '900' }}>Stock Adjustment</h3>
                    <button onClick={() => setShowAdjustModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>{editingProduct?.name}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', marginTop: '4px' }}>Current: {editingProduct?.stockInPieces} pcs</div>
                </div>
                <form onSubmit={handleAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>ADJUST PIECES</label>
                        <input
                            type="number" required
                            value={adjustmentData.pieces}
                            onChange={e => setAdjustmentData({ ...adjustmentData, pieces: parseInt(e.target.value) })}
                            placeholder="+ To add, - To remove"
                            style={{ fontSize: '1.25rem', fontWeight: '800' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>REASON / NOTE</label>
                        <textarea
                            value={adjustmentData.reason}
                            onChange={e => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                            placeholder="Damage, Correction, etc."
                            style={{ height: '80px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button type="submit" className="primary" style={{ flex: 2, padding: '16px', borderRadius: '16px' }}>Apply Adjustment</button>
                        <button type="button" onClick={() => setShowAdjustModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '16px', fontWeight: '800' }}>Cancel</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} maxWidth="400px">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', color: 'var(--danger)', marginBottom: '16px' }}>
                        <AlertTriangle size={32} />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: '900', fontSize: '1.5rem' }}>{productToDelete?.isActive === false ? 'Permanently Delete?' : 'Delete Product?'}</h3>
                    <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {productToDelete?.isActive === false 
                            ? `Are you sure you want to permanently remove ${productToDelete?.name}? This cannot be undone.`
                            : `Are you sure you want to delete ${productToDelete?.name}? This will mark it as inactive and hide it from sales.`
                        }
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setProductToDelete(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: 'var(--text)', padding: '14px', borderRadius: '12px', fontWeight: '700' }}>Cancel</button>
                        <button onClick={confirmDeleteProduct} style={{ flex: 1, backgroundColor: 'var(--danger)', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700', border: 'none' }}>Yes, Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Inventory;

