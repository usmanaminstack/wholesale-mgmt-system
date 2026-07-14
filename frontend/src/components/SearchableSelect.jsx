import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, labelField = 'name', valueField = '_id', required = false, autoFocus = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const triggerRef = useRef(null);

    const selectedOption = options.find(opt => opt[valueField] === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
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

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-option-index]');
            if (items[highlightedIndex]) {
                items[highlightedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    const selectOption = useCallback((opt) => {
        onChange({ target: { value: opt[valueField] } });
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        // Return focus to trigger so Tab works naturally
        setTimeout(() => triggerRef.current?.focus(), 0);
    }, [onChange, valueField]);

    const openDropdown = useCallback(() => {
        setIsOpen(true);
        setHighlightedIndex(-1);
        setSearchTerm('');
        setTimeout(() => inputRef.current?.focus(), 10);
    }, []);

    const handleTriggerKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            openDropdown();
        }
        // Allow typing to start search immediately
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setSearchTerm(e.key);
            setIsOpen(true);
            setHighlightedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    };

    const handleSearchKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    selectOption(filteredOptions[highlightedIndex]);
                } else if (filteredOptions.length === 1) {
                    selectOption(filteredOptions[0]);
                }
                break;
            case 'Tab':
                // Select highlighted or first match, then let Tab propagate
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    selectOption(filteredOptions[highlightedIndex]);
                } else if (filteredOptions.length === 1) {
                    selectOption(filteredOptions[0]);
                } else {
                    setIsOpen(false);
                    setSearchTerm('');
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                triggerRef.current?.focus();
                break;
            default:
                // Reset highlight to top when typing
                if (e.key.length === 1) {
                    setHighlightedIndex(0);
                }
                break;
        }
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange({ target: { value: '' } });
        openDropdown();
    };

    // Format stock display for products
    const getStockLabel = (opt) => {
        if (opt.stockInPieces !== undefined) {
            const cartons = opt.piecesPerCarton ? Math.floor(opt.stockInPieces / opt.piecesPerCarton) : 0;
            const loosePcs = opt.piecesPerCarton ? opt.stockInPieces % opt.piecesPerCarton : opt.stockInPieces;
            if (cartons > 0 && loosePcs > 0) return `${cartons}ctn + ${loosePcs}pcs`;
            if (cartons > 0) return `${cartons} ctn`;
            return `${opt.stockInPieces} pcs`;
        }
        if (opt.outstandingReceivable !== undefined) {
            return opt.outstandingReceivable > 0 ? `Due: ${opt.outstandingReceivable.toLocaleString()}` : '';
        }
        return '';
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }} className="searchable-select-wrapper">
            <div
                ref={triggerRef}
                tabIndex={0}
                role="combobox"
                aria-expanded={isOpen}
                onClick={openDropdown}
                onKeyDown={handleTriggerKeyDown}
                className="ss-trigger"
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
                    fontWeight: '700',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                    {value && (
                        <X size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }} onClick={clearSelection} />
                    )}
                    <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
            </div>

            {isOpen && (
                <div className="ss-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: 'white',
                    border: '1.5px solid var(--primary)',
                    borderRadius: '12px',
                    marginTop: '4px',
                    boxShadow: '0 10px 40px -5px rgba(14, 165, 233, 0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'ssDropIn 0.15s ease-out'
                }}>
                    <div style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#f8fafc'
                    }}>
                        <Search size={16} color="var(--primary)" />
                        <input
                            ref={inputRef}
                            type="text"
                            autoFocus
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                padding: '4px',
                                width: '100%',
                                outline: 'none',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                fontFamily: 'inherit'
                            }}
                        />
                        {searchTerm && (
                            <X size={16} color="var(--text-muted)" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setSearchTerm(''); inputRef.current?.focus(); }} />
                        )}
                        <kbd className="ss-kbd">↑↓ navigate</kbd>
                        <kbd className="ss-kbd">⏎ select</kbd>
                    </div>
                    <div ref={listRef} style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => {
                                const isHighlighted = idx === highlightedIndex;
                                const isSelected = value === opt[valueField];
                                const stockLabel = getStockLabel(opt);
                                const isOutOfStock = opt.stockInPieces !== undefined && opt.stockInPieces <= 0;
                                return (
                                    <div
                                        key={opt[valueField]}
                                        data-option-index={idx}
                                        onClick={() => selectOption(opt)}
                                        onMouseEnter={() => setHighlightedIndex(idx)}
                                        className="ss-option"
                                        style={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: isHighlighted ? 'var(--primary-light)' : isSelected ? '#f0fdf4' : 'transparent',
                                            borderLeft: isHighlighted ? '3px solid var(--primary)' : '3px solid transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'background-color 0.1s',
                                            borderBottom: '1px solid #f8fafc'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            {isSelected && <Check size={14} color="var(--success)" style={{ flexShrink: 0 }} />}
                                            <span style={{
                                                fontWeight: isSelected ? '800' : isHighlighted ? '700' : '600',
                                                color: isSelected ? 'var(--success)' : isOutOfStock ? 'var(--text-muted)' : 'var(--text)',
                                                fontSize: '0.85rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {opt[labelField]} {opt.customerProductName ? `(${opt.customerProductName})` : ''}
                                            </span>
                                        </div>
                                        {stockLabel && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '700',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                backgroundColor: isOutOfStock ? '#fef2f2' : '#f0fdf4',
                                                color: isOutOfStock ? 'var(--danger)' : '#166534',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0
                                            }}>
                                                {stockLabel}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
            {required && !value && <input tabIndex={-1} autoComplete="off" style={{ opacity: 0, height: 0, position: 'absolute' }} required />}

            <style dangerouslySetInnerHTML={{ __html: `
                .ss-trigger:focus-visible {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15) !important;
                }
                .ss-kbd {
                    font-size: 0.6rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    background: white;
                    border: 1px solid var(--border);
                    padding: 2px 6px;
                    border-radius: 4px;
                    white-space: nowrap;
                    flex-shrink: 0;
                    font-family: inherit;
                    display: none;
                }
                @media (min-width: 769px) {
                    .ss-kbd { display: inline-block; }
                }
                .ss-option:hover {
                    background-color: var(--primary-light) !important;
                }
                @keyframes ssDropIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default SearchableSelect;
