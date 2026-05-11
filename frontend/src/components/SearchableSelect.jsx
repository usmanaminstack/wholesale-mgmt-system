import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, labelField = 'name', valueField = '_id', required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    const selectedOption = options.find(opt => opt[valueField] === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => {
        const label = opt[labelField]?.toLowerCase() || '';
        const secondary = opt.customerProductName?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return label.includes(search) || secondary.includes(search);
    });

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '10px 12px',
                    backgroundColor: 'white',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '44px',
                    fontSize: '0.9rem',
                    fontWeight: '700'
                }}
            >
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOption ? (
                        <span>
                            {selectedOption[labelField]} {selectedOption.customerProductName ? `(${selectedOption.customerProductName})` : ''}
                        </span>
                    ) : (
                        <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={18} style={{ color: 'var(--text-muted)', marginLeft: '8px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: 'white',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    marginTop: '4px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc' }}>
                        <Search size={16} color="var(--text-muted)" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '4px', width: '100%', outline: 'none', fontWeight: '600' }}
                        />
                        {searchTerm && (
                            <X size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
                        )}
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt[valueField]}
                                    onClick={() => {
                                        onChange({ target: { value: opt[valueField] } });
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        backgroundColor: value === opt[valueField] ? 'var(--primary-light)' : 'transparent',
                                        color: value === opt[valueField] ? 'var(--primary)' : 'var(--text)',
                                        fontWeight: value === opt[valueField] ? '800' : '600',
                                        fontSize: '0.85rem',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}
                                    className="dropdown-item"
                                >
                                    {opt[labelField]} {opt.customerProductName ? `(${opt.customerProductName})` : ''}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matches found</div>
                        )}
                    </div>
                </div>
            )}
            {required && !value && <input tabIndex={-1} autoComplete="off" style={{ opacity: 0, height: 0, position: 'absolute' }} required />}
        </div>
    );
};

export default SearchableSelect;
