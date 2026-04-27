import React from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

const DateFilter = ({ startDate, endDate, setStartDate, setEndDate, onClear }) => {
    const setToday = () => {
        const d = getLocalDateString();
        setStartDate(d);
        setEndDate(d);
    };

    const setYesterday = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const ds = getLocalDateString(d);
        setStartDate(ds);
        setEndDate(ds);
    };

    const setLast7Days = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        setStartDate(getLocalDateString(start));
        setEndDate(getLocalDateString(end));
    };

    const setThisMonth = () => {
        const now = new Date();
        const start = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
        const end = getLocalDateString();
        setStartDate(start);
        setEndDate(end);
    };

    const isToday = startDate === endDate && startDate === getLocalDateString();

    return (
        <div className="date-filter-root">
            <div className="card filter-card">
                {/* Horizontal Scrollable Presets */}
                <div className="presets-container hide-scrollbar">
                    <button onClick={setToday} className={`preset-btn ${isToday ? 'active' : ''}`}>Today</button>
                    <button onClick={setYesterday} className="preset-btn">Yesterday</button>
                    <button onClick={setLast7Days} className="preset-btn">7 Days</button>
                    <button onClick={setThisMonth} className="preset-btn">Month</button>
                </div>
                
                {/* Date Inputs Area */}
                <div className="inputs-container">
                    <div className="input-group">
                        <Calendar size={14} color="var(--primary)" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="date-input"
                        />
                    </div>
                    <span className="separator">To</span>
                    <div className="input-group justify-end">
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="date-input text-right"
                        />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .date-filter-root { width: 100%; }
                .filter-card {
                    padding: 12px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 12px !important;
                    background-color: white !important;
                    border-radius: 16px !important;
                }
                .presets-container {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                    -webkit-overflow-scrolling: touch;
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .preset-btn {
                    padding: 8px 16px;
                    font-size: 0.75rem;
                    border-radius: 10px;
                    background-color: #f1f5f9;
                    color: var(--text-muted);
                    border: 1px solid transparent;
                    font-weight: 700;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .preset-btn.active {
                    background-color: var(--primary-light);
                    color: var(--primary);
                    border-color: var(--primary);
                }
                .inputs-container {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background-color: #f8fafc;
                    borderRadius: 12px;
                    border: 1px solid #f1f5f9;
                }
                .input-group { display: flex; gap: 8px; alignItems: center; flex: 1; }
                .justify-end { justify-content: flex-end; }
                .date-input {
                    padding: 4px 0;
                    border: none;
                    background-color: transparent;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: var(--text);
                    width: 100%;
                    min-width: 80px;
                }
                .text-right { text-align: right; }
                .separator { font-size: 0.7rem; color: var(--text-muted); font-weight: 900; text-transform: uppercase; }

                @media (min-width: 769px) {
                    .date-filter-root { width: auto; min-width: 450px; }
                    .filter-card { flex-direction: row !important; align-items: center !important; }
                }
            `}} />
        </div>
    );
};

export default DateFilter;
