import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Package, Search, ChevronRight, X, AlertTriangle, Trash2 } from 'lucide-react';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        piecesPerCarton: '',
        costPricePerCarton: '',
        costPricePerPiece: '',
        pricePerCarton: '',
        pricePerPiece: '',
        lowStockThreshold: 10
    });

    const handleEdit = (p) => {
        setEditingProduct(p);
        setFormData({
            name: p.name,
            category: p.category,
            piecesPerCarton: p.piecesPerCarton,
            costPricePerCarton: p.costPricePerCarton || (p.pricePerCarton * 0.9), // Fallback for old data
            costPricePerPiece: p.costPricePerPiece || (p.pricePerPiece * 0.9),
            pricePerCarton: p.pricePerCarton,
            pricePerPiece: p.pricePerPiece,
            lowStockThreshold: p.lowStockThreshold
        });
        setShowModal(true);
    };

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        const { data } = await api.get('/products');
        setProducts(data);
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product? This may affect historical reports.')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) await api.put(`/products/${editingProduct._id}`, formData);
            else await api.post('/products', formData);
            setShowModal(false);
            setEditingProduct(null);
            setFormData({ name: '', category: '', piecesPerCarton: '', costPricePerCarton: '', costPricePerPiece: '', pricePerCarton: '', pricePerPiece: '', lowStockThreshold: 10 });
            fetchProducts();
        } catch (err) { alert(err.message); }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : p.isActive !== false;
        return matchesSearch && matchesStatus;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '4px' }}>Inventory</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage your products and monitor stock levels.</p>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setFormData({ name: '', category: '', piecesPerCarton: '', costPricePerCarton: '', costPricePerPiece: '', pricePerCarton: '', pricePerPiece: '', lowStockThreshold: 10 }); setShowModal(true); }}
                    className="primary"
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} /> Add New Product
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search by product name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ border: 'none', padding: '4px', maxWidth: '400px', boxShadow: 'none' }}
                    />
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <input type="checkbox" id="showInactive" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                        <label htmlFor="showInactive" style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Include Inactive Items</label>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th className="desktop-only">Carton Size</th>
                                <th className="desktop-only">Cost (C/P)</th>
                                <th>Price (C/P)</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><Package size={16} color="var(--primary)" /></div>
                                            <span style={{ fontWeight: '600' }}>{p.name}</span>
                                        </div>
                                    </td>
                                    <td><span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '50px', fontSize: '0.75rem', color: 'var(--secondary)' }}>{p.category}</span></td>
                                    <td className="desktop-only">{p.piecesPerCarton} <span style={{ color: 'var(--text-muted)' }}>pcs</span></td>
                                    <td className="desktop-only">
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>
                                            <div><span style={{ color: 'var(--text-muted)' }}>C:</span> {p.costPricePerCarton}</div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>P:</span> {p.costPricePerPiece}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div><span style={{ color: 'var(--text-muted)' }}>C:</span> {p.pricePerCarton}</div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>P:</span> {p.pricePerPiece}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{
                                                fontWeight: '700',
                                                color: p.stockInPieces <= p.lowStockThreshold ? 'var(--danger)' : 'var(--success)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {p.stockInPieces} {p.stockInPieces <= p.lowStockThreshold && <AlertTriangle size={12} />}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                ≈ {(p.stockInPieces / p.piecesPerCarton).toFixed(1)} Cartons
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(p)} style={{ background: 'none', color: 'var(--primary)', padding: '6px' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteProduct(p._id)} style={{ background: 'none', color: 'var(--danger)', padding: '6px' }}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Product Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Coca Cola 1.5L" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Category</label>
                                    <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Soft Drink" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Pieces/Carton</label>
                                    <input type="number" required value={formData.piecesPerCarton} onChange={(e) => setFormData({ ...formData, piecesPerCarton: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', gridColumn: 'span 2' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Cost Price (Carton)</label>
                                        <input type="number" placeholder="Cost per Carton" required value={formData.costPricePerCarton} onChange={e => setFormData({ ...formData, costPricePerCarton: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Cost Price (Piece)</label>
                                        <input type="number" placeholder="Cost per Piece" required value={formData.costPricePerPiece} onChange={e => setFormData({ ...formData, costPricePerPiece: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', gridColumn: 'span 2' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Sale Price (Carton)</label>
                                        <input type="number" placeholder="Sale Price per Carton" required value={formData.pricePerCarton} onChange={e => setFormData({ ...formData, pricePerCarton: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Sale Price (Piece)</label>
                                        <input type="number" placeholder="Sale Price per Piece" required value={formData.pricePerPiece} onChange={e => setFormData({ ...formData, pricePerPiece: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>Low Stock Alert Level (Pieces)</label>
                                    <input type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="primary" style={{ flex: 1 }}>{editingProduct ? 'Update Product' : 'Create Product'}</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
              @keyframes slideUp { 
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}} />
        </div>
    );
};

export default Inventory;
