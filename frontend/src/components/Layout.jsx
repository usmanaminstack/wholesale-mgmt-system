import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Menu } from 'lucide-react';
import logo from '../assets/logo.png';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div style={{
                flex: 1,
                paddingLeft: '0',
                transition: 'padding-left 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}
                className="main-content"
            >
                {/* Header Bar */}
                <header style={{
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                    className="app-header"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="mobile-only" onClick={() => setIsSidebarOpen(true)} style={{ color: 'var(--text)', cursor: 'pointer' }}>
                            <Menu size={24} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }} className="mobile-only">
                                <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <h2 className="brand-font" style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, color: 'var(--text)', letterSpacing: '-0.025em' }}>Guddu Traders</h2>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="desktop-only" style={{ background: 'none', color: 'var(--text-muted)' }}><Search size={20} /></button>
                        <button style={{ background: 'none', color: 'var(--text-muted)', padding: '8px' }}><Bell size={22} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-light)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' }}>U</div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', paddingRight: '12px', color: 'var(--primary-dark)' }} className="desktop-only">Admin</span>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '32px', flex: 1 }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <Outlet />
                    </div>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media (min-width: 769px) {
          .main-content { padding-left: 260px !important; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 768px) {
          main { padding: 20px !important; padding-bottom: 100px !important; }
          header { padding: 0 16px !important; height: 64px !important; }
          .brand-font { font-size: 1.2rem !important; }
        }
      `}} />
        </div>
    );
};

export default Layout;

