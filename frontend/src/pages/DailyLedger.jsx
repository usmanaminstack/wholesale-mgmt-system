import React, { useState, useCallback } from 'react';
import api from '../utils/api';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Banknote,
  CreditCard,
  Receipt,
  ShoppingBag,
  User,
  Store
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────
const fmt = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtShort = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
};

const methodIcon = (m) => {
  if (['Bank', 'Bank Transfer'].includes(m)) return <Building2 size={12} />;
  if (m === 'Cheque') return <CreditCard size={12} />;
  return <Banknote size={12} />;
};

const methodColor = (m) => {
  if (['Bank', 'Bank Transfer', 'Cheque'].includes(m))
    return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
};

const labelIcon = (label) => {
  if (label.includes('Sale')) return <ShoppingBag size={13} />;
  if (label.includes('Customer')) return <User size={13} />;
  if (label.includes('Supplier') || label.includes('Purchase')) return <Store size={13} />;
  if (label.includes('Expense')) return <Receipt size={13} />;
  return <Wallet size={13} />;
};

// ─── DayCard ─────────────────────────────────────────────────
function DayCard({ day, index }) {
  const [expanded, setExpanded] = useState(false);

  const netCash = day.totalCashIn - day.totalCashOut;
  const netBank = day.totalBankIn - day.totalBankOut;
  const totalNetFlow = (day.totalCashIn + day.totalBankIn) - (day.totalCashOut + day.totalBankOut);
  const hasActivity = day.moneyIn.length > 0 || day.moneyOut.length > 0;

  return (
    <div className="dl-day-card" style={{ animationDelay: `${index * 40}ms` }}>
      {/* Header row */}
      <div
        className="dl-day-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Date badge */}
        <div className="dl-date-badge">
          <span className="dl-date-num">{new Date(day.date).getDate()}</span>
          <span className="dl-date-month">
            {new Date(day.date).toLocaleString('en-PK', { month: 'short' })}
          </span>
          <span className="dl-date-day">
            {new Date(day.date).toLocaleString('en-PK', { weekday: 'short' })}
          </span>
        </div>

        {/* Balance pills */}
        <div className="dl-balance-row">
          <div className="dl-bal-group">
            <span className="dl-bal-label"><Wallet size={11} /> Opening Cash</span>
            <span className="dl-bal-val">{fmt(day.openingCash)}</span>
          </div>
          <div className="dl-bal-group">
            <span className="dl-bal-label"><Building2 size={11} /> Opening Bank</span>
            <span className="dl-bal-val">{fmt(day.openingBank)}</span>
          </div>
          <div className="dl-bal-group highlight-green">
            <span className="dl-bal-label"><Wallet size={11} /> Closing Cash</span>
            <span className="dl-bal-val">{fmt(day.closingCash)}</span>
          </div>
          <div className="dl-bal-group highlight-blue">
            <span className="dl-bal-label"><Building2 size={11} /> Closing Bank</span>
            <span className="dl-bal-val">{fmt(day.closingBank)}</span>
          </div>
        </div>

        {/* Net flow chips */}
        <div className="dl-flow-chips">
          <span className={`dl-chip ${day.moneyIn.length > 0 ? 'chip-in' : 'chip-zero'}`}>
            <ArrowDownCircle size={13} />
            +{fmt(day.totalCashIn + day.totalBankIn)}
          </span>
          <span className={`dl-chip ${day.moneyOut.length > 0 ? 'chip-out' : 'chip-zero'}`}>
            <ArrowUpCircle size={13} />
            -{fmt(day.totalCashOut + day.totalBankOut)}
          </span>
          <span className={`dl-chip ${totalNetFlow >= 0 ? 'chip-pos' : 'chip-neg'}`}>
            {totalNetFlow >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {totalNetFlow >= 0 ? '+' : ''}{fmt(totalNetFlow)}
          </span>
        </div>

        {/* Toggle */}
        <button className="dl-toggle-btn" aria-label="toggle details">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="dl-day-detail">
          {!hasActivity && (
            <div className="dl-no-activity">No transactions on this day</div>
          )}

          <div className="dl-txn-columns">
            {/* Money In */}
            {day.moneyIn.length > 0 && (
              <div className="dl-txn-section">
                <div className="dl-section-title in">
                  <ArrowDownCircle size={15} /> Money In ({day.moneyIn.length})
                </div>
                {day.moneyIn.map((t, i) => {
                  const mc = methodColor(t.method);
                  return (
                    <div key={i} className="dl-txn-row">
                      <div className="dl-txn-icon in-icon">{labelIcon(t.label)}</div>
                      <div className="dl-txn-body">
                        <div className="dl-txn-main">
                          <span className="dl-txn-who">{t.from}</span>
                          <span className="dl-txn-amt in-amt">{fmt(t.amount)}</span>
                        </div>
                        <div className="dl-txn-meta">
                          <span className="dl-txn-label">{t.label}</span>
                          <span
                            className="dl-method-badge"
                            style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.border}` }}
                          >
                            {methodIcon(t.method)} {t.method}
                          </span>
                          {t.note && <span className="dl-txn-note">"{t.note}"</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="dl-section-total in-total">
                  <span>Cash: {fmt(day.totalCashIn)}</span>
                  <span>Bank: {fmt(day.totalBankIn)}</span>
                  <strong>Total: {fmt(day.totalCashIn + day.totalBankIn)}</strong>
                </div>
              </div>
            )}

            {/* Money Out */}
            {day.moneyOut.length > 0 && (
              <div className="dl-txn-section">
                <div className="dl-section-title out">
                  <ArrowUpCircle size={15} /> Money Out ({day.moneyOut.length})
                </div>
                {day.moneyOut.map((t, i) => {
                  const mc = methodColor(t.method);
                  return (
                    <div key={i} className="dl-txn-row">
                      <div className="dl-txn-icon out-icon">{labelIcon(t.label)}</div>
                      <div className="dl-txn-body">
                        <div className="dl-txn-main">
                          <span className="dl-txn-who">{t.to}</span>
                          <span className="dl-txn-amt out-amt">{fmt(t.amount)}</span>
                        </div>
                        <div className="dl-txn-meta">
                          <span className="dl-txn-label">{t.label}</span>
                          <span
                            className="dl-method-badge"
                            style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.border}` }}
                          >
                            {methodIcon(t.method)} {t.method}
                          </span>
                          {t.note && <span className="dl-txn-note">"{t.note}"</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="dl-section-total out-total">
                  <span>Cash: {fmt(day.totalCashOut)}</span>
                  <span>Bank: {fmt(day.totalBankOut)}</span>
                  <strong>Total: {fmt(day.totalCashOut + day.totalBankOut)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Closing summary bar */}
          <div className="dl-closing-bar">
            <div className="dl-closing-item cash">
              <Wallet size={16} />
              <div>
                <span className="dl-closing-lbl">Closing Cash in Hand</span>
                <span className="dl-closing-val">{fmt(day.closingCash)}</span>
              </div>
            </div>
            <div className="dl-closing-sep">→</div>
            <div className="dl-closing-item bank">
              <Building2 size={16} />
              <div>
                <span className="dl-closing-lbl">Closing Cash in Bank</span>
                <span className="dl-closing-val">{fmt(day.closingBank)}</span>
              </div>
            </div>
            <div className="dl-closing-sep">→</div>
            <div className="dl-closing-item total">
              <Banknote size={16} />
              <div>
                <span className="dl-closing-lbl">Total Available</span>
                <span className="dl-closing-val">{fmt(day.closingCash + day.closingBank)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DailyLedger() {
  const [fromDate, setFromDate] = useState('2026-06-15');
  const [toDate, setToDate] = useState('2026-06-27');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/daily-ledger', {
        params: { from: fromDate, to: toDate }
      });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  // Summary totals across all days
  const totals = data?.days?.reduce((acc, d) => ({
    cashIn: acc.cashIn + d.totalCashIn,
    bankIn: acc.bankIn + d.totalBankIn,
    cashOut: acc.cashOut + d.totalCashOut,
    bankOut: acc.bankOut + d.totalBankOut,
  }), { cashIn: 0, bankIn: 0, cashOut: 0, bankOut: 0 });

  const lastDay = data?.days?.[data.days.length - 1];

  return (
    <div className="dl-page">
      <style>{`
        .dl-page {
          padding: 24px;
          max-width: 1100px;
          margin: 0 auto;
          font-family: 'Outfit', sans-serif;
        }

        /* ── Header ── */
        .dl-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 28px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .dl-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 70% 50%, rgba(14,165,233,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .dl-hero-title {
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dl-hero-sub {
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 24px;
        }

        /* ── Controls ── */
        .dl-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: flex-end;
        }
        .dl-ctrl-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dl-ctrl-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
          color: #94a3b8;
        }
        .dl-ctrl-input {
          background: rgba(255,255,255,0.08) !important;
          border: 1.5px solid rgba(255,255,255,0.12) !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          font-size: 0.9rem !important;
          min-height: unset !important;
          width: 160px !important;
          backdrop-filter: blur(4px);
          color-scheme: dark;
        }
        .dl-ctrl-input:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.2) !important;
        }
        .dl-load-btn {
          background: linear-gradient(135deg, #0ea5e9, #0369a1) !important;
          color: white;
          border-radius: 12px !important;
          padding: 10px 22px !important;
          font-weight: 700;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          min-height: unset !important;
          white-space: nowrap;
        }
        .dl-load-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,165,233,0.4); }
        .dl-load-btn:disabled { opacity: 0.6; transform: none; }

        /* ── Summary cards ── */
        .dl-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .dl-sum-card {
          background: white;
          border-radius: 18px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dl-sum-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dl-sum-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
        }
        .dl-sum-val {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        /* ── Day cards ── */
        .dl-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .dl-toolbar-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }
        .dl-expand-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: unset !important;
          transition: all 0.2s;
        }
        .dl-expand-btn:hover { background: #e2e8f0; }

        .dl-day-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          margin-bottom: 12px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          animation: fadeInUp 0.4s ease both;
          transition: box-shadow 0.2s;
        }
        .dl-day-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dl-day-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          cursor: pointer;
          user-select: none;
          flex-wrap: wrap;
        }
        .dl-day-header:hover { background: #f8fafc; }

        /* Date badge */
        .dl-date-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, #0f172a, #1e3a5f);
          color: white;
          border-radius: 14px;
          padding: 10px 14px;
          min-width: 52px;
          flex-shrink: 0;
        }
        .dl-date-num   { font-size: 1.4rem; font-weight: 900; line-height: 1; }
        .dl-date-month { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; margin-top: 2px; }
        .dl-date-day   { font-size: 0.6rem; font-weight: 600; opacity: 0.5; margin-top: 1px; }

        /* Balance row */
        .dl-balance-row {
          display: flex;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }
        .dl-bal-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 12px;
          border-radius: 10px;
          background: #f8fafc;
          min-width: 110px;
        }
        .dl-bal-group.highlight-green { background: #f0fdf4; }
        .dl-bal-group.highlight-blue  { background: #eff6ff; }
        .dl-bal-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dl-bal-val {
          font-size: 0.88rem;
          font-weight: 800;
          color: #0f172a;
        }

        /* Chips */
        .dl-flow-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .dl-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .chip-in   { background: #dcfce7; color: #15803d; }
        .chip-out  { background: #fee2e2; color: #b91c1c; }
        .chip-pos  { background: #dbeafe; color: #1d4ed8; }
        .chip-neg  { background: #fef3c7; color: #b45309; }
        .chip-zero { background: #f1f5f9; color: #94a3b8; }

        .dl-toggle-btn {
          background: transparent !important;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          min-height: unset !important;
          flex-shrink: 0;
        }
        .dl-toggle-btn:hover { background: #f1f5f9 !important; color: #0ea5e9; }

        /* Detail */
        .dl-day-detail {
          border-top: 1px solid #f1f5f9;
          padding: 20px;
          background: #fafbfc;
        }
        .dl-no-activity {
          text-align: center;
          color: #94a3b8;
          font-size: 0.85rem;
          padding: 20px;
        }
        .dl-txn-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 680px) {
          .dl-txn-columns { grid-template-columns: 1fr; }
        }

        .dl-txn-section { display: flex; flex-direction: column; gap: 8px; }
        .dl-section-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 6px;
          padding-bottom: 8px;
          border-bottom: 2px solid;
          margin-bottom: 4px;
        }
        .dl-section-title.in  { color: #15803d; border-color: #bbf7d0; }
        .dl-section-title.out { color: #b91c1c; border-color: #fecaca; }

        .dl-txn-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 12px;
          background: white;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .dl-txn-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .in-icon  { background: #dcfce7; color: #15803d; }
        .out-icon { background: #fee2e2; color: #b91c1c; }

        .dl-txn-body { flex: 1; min-width: 0; }
        .dl-txn-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .dl-txn-who {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dl-txn-amt  { font-size: 0.9rem; font-weight: 800; white-space: nowrap; }
        .in-amt      { color: #15803d; }
        .out-amt     { color: #b91c1c; }

        .dl-txn-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .dl-txn-label {
          font-size: 0.68rem;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 7px;
          border-radius: 6px;
        }
        .dl-method-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .dl-txn-note {
          font-size: 0.68rem;
          color: #94a3b8;
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .dl-section-total {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 4px;
        }
        .in-total  { background: #f0fdf4; color: #15803d; }
        .out-total { background: #fff1f2; color: #b91c1c; }
        .dl-section-total strong { font-weight: 800; }

        /* Closing bar */
        .dl-closing-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: linear-gradient(135deg, #0f172a, #1e3a5f);
          border-radius: 14px;
          padding: 16px 20px;
          color: white;
        }
        .dl-closing-sep {
          color: rgba(255,255,255,0.3);
          font-size: 1.1rem;
        }
        .dl-closing-item {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 140px;
        }
        .dl-closing-item svg { opacity: 0.7; flex-shrink: 0; }
        .dl-closing-lbl {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.6;
        }
        .dl-closing-val {
          display: block;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        /* Error / loading */
        .dl-error {
          background: #fff1f2;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 16px 20px;
          color: #b91c1c;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .dl-loading {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
          font-size: 1rem;
          font-weight: 600;
        }
        .dl-spinner {
          width: 40px; height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #0ea5e9;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dl-empty {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }
        .dl-empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .dl-empty-text { font-size: 0.9rem; font-weight: 600; }

        @media (max-width: 640px) {
          .dl-page { padding: 16px; }
          .dl-hero { padding: 20px; }
          .dl-hero-title { font-size: 1.4rem; }
          .dl-day-header { gap: 10px; padding: 14px; }
          .dl-balance-row { gap: 8px; }
          .dl-bal-group { min-width: 90px; padding: 6px 10px; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="dl-hero">
        <h1 className="dl-hero-title">
          <Calendar size={26} /> Daily Cash Ledger
        </h1>
        <p className="dl-hero-sub">
          Har din ka Cash in Hand, Cash in Bank, Payments In &amp; Out
        </p>
        <div className="dl-controls">
          <div className="dl-ctrl-group">
            <span className="dl-ctrl-label">From Date</span>
            <input
              type="date"
              className="dl-ctrl-input"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <div className="dl-ctrl-group">
            <span className="dl-ctrl-label">To Date</span>
            <input
              type="date"
              className="dl-ctrl-input"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
          <button className="dl-load-btn" onClick={load} disabled={loading}>
            {loading
              ? <><RefreshCw size={16} className="spin-icon" style={{ animation: 'spin 0.8s linear infinite' }} /> Loading…</>
              : <><Search size={16} /> Load Ledger</>}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div className="dl-error">⚠️ {error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="dl-loading">
          <div className="dl-spinner" />
          Fetching day-by-day data from MongoDB…
        </div>
      )}

      {/* ── Results ── */}
      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="dl-summary-grid">
            <div className="dl-sum-card">
              <div className="dl-sum-icon" style={{ background: '#dcfce7' }}>
                <Wallet size={18} color="#15803d" />
              </div>
              <span className="dl-sum-label">Final Cash in Hand</span>
              <span className="dl-sum-val" style={{ color: '#15803d' }}>{fmt(lastDay?.closingCash)}</span>
            </div>
            <div className="dl-sum-card">
              <div className="dl-sum-icon" style={{ background: '#dbeafe' }}>
                <Building2 size={18} color="#1d4ed8" />
              </div>
              <span className="dl-sum-label">Final Cash in Bank</span>
              <span className="dl-sum-val" style={{ color: '#1d4ed8' }}>{fmt(lastDay?.closingBank)}</span>
            </div>
            <div className="dl-sum-card">
              <div className="dl-sum-icon" style={{ background: '#dcfce7' }}>
                <ArrowDownCircle size={18} color="#15803d" />
              </div>
              <span className="dl-sum-label">Total Money IN ({data.days.length} days)</span>
              <span className="dl-sum-val" style={{ color: '#15803d' }}>+{fmt((totals?.cashIn || 0) + (totals?.bankIn || 0))}</span>
            </div>
            <div className="dl-sum-card">
              <div className="dl-sum-icon" style={{ background: '#fee2e2' }}>
                <ArrowUpCircle size={18} color="#b91c1c" />
              </div>
              <span className="dl-sum-label">Total Money OUT ({data.days.length} days)</span>
              <span className="dl-sum-val" style={{ color: '#b91c1c' }}>-{fmt((totals?.cashOut || 0) + (totals?.bankOut || 0))}</span>
            </div>
            <div className="dl-sum-card">
              <div className="dl-sum-icon" style={{ background: '#ede9fe' }}>
                <Banknote size={18} color="#7c3aed" />
              </div>
              <span className="dl-sum-label">Total Available Now</span>
              <span className="dl-sum-val" style={{ color: '#7c3aed' }}>{fmt((lastDay?.closingCash || 0) + (lastDay?.closingBank || 0))}</span>
            </div>
          </div>

          {/* Day list */}
          <div className="dl-toolbar">
            <span className="dl-toolbar-title">
              📅 {data.days.length} Days — {fmtShort(data.from)} to {fmtShort(data.to)}
            </span>
            <button className="dl-expand-btn" onClick={() => setExpandAll(p => !p)}>
              {expandAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {data.days.map((day, i) => (
            <DayCard key={day.date} day={day} index={i} expandAll={expandAll} />
          ))}
        </>
      )}

      {/* ── Empty state ── */}
      {!loading && !data && !error && (
        <div className="dl-empty">
          <div className="dl-empty-icon">📒</div>
          <div className="dl-empty-text">
            Select date range and click <strong>Load Ledger</strong>
          </div>
        </div>
      )}
    </div>
  );
}
