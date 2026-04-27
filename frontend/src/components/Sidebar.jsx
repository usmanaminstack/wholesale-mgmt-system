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
  X,
  Menu,
  Droplets
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';

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
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 40,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          className="mobile-only"
        />
      )}

      <div style={{
        width: '280px',
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
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: isOpen ? '20px 0 50px rgba(0,0,0,0.3)' : 'none'
      }}
        className="sidebar-nav"
      >
        <div style={{ padding: '0 24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '14px', 
              background: 'white',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              <img src={logo} alt="Guddu Trader Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 className="brand-font" style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.025em', color: 'white', margin: 0, lineHeight: 1 }}>GUDDU</h1>
              <span className="brand-font" style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.15em', marginTop: '2px' }}>TRADERS</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="mobile-only" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '10px' }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
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
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '12px',
                gap: '12px',
                fontSize: '0.95rem',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s'
              })}
              className="nav-link"
            >
              <item.icon size={20} style={{ color: 'inherit', opacity: 0.8 }} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.6 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Cloud Sync Active</span>
          </div>
        </div>
      </div>

      <div className="bottom-nav mobile-only">
        <NavLink to="/" className={({ isActive }) => isActive ? "bottom-nav-item active" : "bottom-nav-item"}>
          <LayoutDashboard size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/sales" className={({ isActive }) => isActive ? "bottom-nav-item active" : "bottom-nav-item"}>
          <ShoppingCart size={22} />
          <span>Sales</span>
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => isActive ? "bottom-nav-item active" : "bottom-nav-item"}>
          <Package size={22} />
          <span>Items</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? "bottom-nav-item active" : "bottom-nav-item"}>
          <BarChart3 size={22} />
          <span>Profit</span>
        </NavLink>
        <button className="bottom-nav-item" onClick={(e) => { e.preventDefault(); toggleSidebar(); }}>
          <Menu size={22} />
          <span>Menu</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (min-width: 769px) {
          .sidebar-nav { transform: translateX(0) !important; }
        }
        .nav-link:hover {
          color: white !important;
          background-color: rgba(255,255,255,0.05) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </>
  );
};

export default Sidebar;

