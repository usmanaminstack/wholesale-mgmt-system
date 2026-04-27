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
        <div className="card date-filter-container" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid var(--border)', flexWrap: 'wrap', backgroundColor: '#fcfcfc', borderRadius: '14px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} className="date-presets">
                <button onClick={setToday} style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', backgroundColor: startDate === endDate && startDate === getLocalDateString() ? 'var(--primary)' : 'white', color: startDate === endDate && startDate === getLocalDateString() ? 'white' : 'var(--text)', border: '1px solid var(--border)', fontWeight: '700' }}>Today</button>
                <button onClick={setYesterday} style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: '700' }}>Yesterday</button>
                <button onClick={setLast7Days} style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: '700' }}>7 Days</button>
                <button onClick={setThisMonth} style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: '700' }}>Month</button>
            </div>
            
            <div className="date-inputs-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Calendar size={16} color="var(--primary)" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        style={{ padding: '4px', border: 'none', backgroundColor: 'transparent', boxShadow: 'none', fontSize: '0.85rem', fontWeight: '700', width: 'auto' }}
                    />
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>to</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        style={{ padding: '4px', border: 'none', backgroundColor: 'transparent', boxShadow: 'none', fontSize: '0.85rem', fontWeight: '700', width: 'auto' }}
                    />
                </div>
                {onClear && (
                    <button
                        title="Clear Dates"
                        onClick={onClear}
                        style={{ background: 'none', color: 'var(--danger)', padding: '4px', marginLeft: '4px' }}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 768px) {
                    .date-filter-container { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
                    .date-presets { justify-content: space-between !important; }
                    .date-presets button { flex: 1; text-align: center; }
                    .date-inputs-wrapper { justify-content: space-around !important; border-top: 1px solid var(--border); padding-top: 12px; }
                    .date-inputs-wrapper input { width: 120px !important; }
                }
            `}} />
        </div>
    );
};

export default DateFilter;

