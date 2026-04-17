import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Truck,
  CreditCard,
  Receipt,
  BarChart3,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', name: 'Inventory', icon: Package },
  { path: '/purchases', name: 'Purchases', icon: TrendingUp },
  { path: '/sales', name: 'Sales', icon: ShoppingCart },
  { path: '/customers', name: 'Customers', icon: Users },
  { path: '/suppliers', name: 'Suppliers', icon: Truck },
  { path: '/payments', name: 'Payments', icon: CreditCard },
  { path: '/expenses', name: 'Expenses', icon: Receipt },
  { path: '/reports', name: 'Reports', icon: BarChart3 },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            backdropFilter: 'blur(4px)'
          }}
          className="mobile-only"
        />
      )}

      <div style={{
        width: '260px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        padding: '24px 0',
        zIndex: 50,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}
        className="sidebar-nav"
      >
        <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Guddu Traders" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.025em', color: 'var(--sidebar-hover)', margin: 0, lineHeight: 1 }}>GUDDU</h1>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', opacity: 0.8 }}>TRADERS</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="mobile-only" style={{ background: 'none', color: 'white', padding: 0, marginTop: '-36px', alignSelf: 'flex-end' }}>
            <X size={24} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 768) toggleSidebar(); }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 0',
                color: isActive ? 'white' : 'var(--sidebar-text)',
                backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                borderRadius: '12px',
                gap: '12px',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s'
              })}
              className="nav-link"
            >
              <item.icon size={20} color={({ isActive }) => isActive ? 'var(--sidebar-hover)' : 'var(--sidebar-text)'} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid #1e293b' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--sidebar-text)' }}>v1.0.0 Business Edition</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (min-width: 769px) {
          .sidebar-nav { transform: translateX(0) !important; }
        }
        .nav-link:hover {
          color: white !important;
          background-color: var(--sidebar-active) !important;
        }
        .nav-link:hover svg {
          color: var(--sidebar-hover) !important;
        }
      `}} />
    </>
  );
};

export default Sidebar;
