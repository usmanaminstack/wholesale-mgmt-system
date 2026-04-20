import React from 'react';
import { Calendar, X } from 'lucide-react';
import { getLocalDateString, getYesterdayDate, getDaysAgoDate } from '../utils/dateUtils';

const DateFilter = ({ startDate, endDate, setStartDate, setEndDate, onClear }) => {

    const setToday = () => {
        const today = getLocalDateString();
        setStartDate(today);
        setEndDate(today);
    };

    const setYesterday = () => {
        const yesterday = getLocalDateString(getYesterdayDate());
        setStartDate(yesterday);
        setEndDate(yesterday);
    };

    const setLast7Days = () => {
        const start = getLocalDateString(getDaysAgoDate(6));
        const end = getLocalDateString();
        setStartDate(start);
        setEndDate(end);
    };

    const setThisMonth = () => {
        const now = new Date();
        const start = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
        const end = getLocalDateString();
        setStartDate(start);
        setEndDate(end);
    };

    return (
        <div className="card" style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', border: '1px solid var(--border)', flexWrap: 'wrap', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button onClick={setToday} style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: startDate === endDate && startDate === getLocalDateString() ? 'var(--primary)' : 'white', color: startDate === endDate && startDate === getLocalDateString() ? 'white' : 'var(--text)', border: '1px solid var(--border)', fontWeight: '600' }}>Today</button>
                <button onClick={setYesterday} style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: '600' }}>Yesterday</button>
                <button onClick={setLast7Days} style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: '600' }}>Last 7D</button>
                <button onClick={setThisMonth} style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: '600' }}>This Month</button>
            </div>
            <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>From</span>
                <Calendar size={14} color="var(--primary)" />
                <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ padding: '4px', border: 'none', backgroundColor: 'transparent', boxShadow: 'none', fontSize: '0.8rem', fontWeight: '600' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>To</span>
                <Calendar size={14} color="var(--primary)" />
                <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ padding: '4px', border: 'none', backgroundColor: 'transparent', boxShadow: 'none', fontSize: '0.8rem', fontWeight: '600' }}
                />
            </div>
            {onClear && (
                <button
                    title="Clear Dates"
                    onClick={onClear}
                    style={{ background: 'none', color: 'var(--danger)', padding: '4px', marginLeft: 'auto' }}
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export default DateFilter;
