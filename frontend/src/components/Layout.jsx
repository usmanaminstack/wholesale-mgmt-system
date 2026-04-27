import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Menu, Loader2 } from 'lucide-react';
import { useLoading } from '../context/LoadingContext';
import logo from '../assets/logo.png';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { loading } = useLoading();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
            {loading && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    gap: '16px'
                }}>
                    <div style={{ position: 'relative' }}>
                        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)' }}></div>
                        </div>
                    </div>
                    <p style={{ fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.05em', fontSize: '0.9rem' }}>LOADING...</p>
                </div>
            )}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div style={{
                flex: 1,
                paddingLeft: '0',
                transition: 'padding-left 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 10
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
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                }}
                    className="app-header"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="mobile-only" onClick={() => setIsSidebarOpen(true)} style={{ color: 'var(--text)', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}>
                            <Menu size={24} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                                <img src={logo} alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                            </div>
                            <h2 className="brand-font" style={{ fontSize: '1.25rem', fontWeight: '950', margin: 0, color: 'var(--text)', letterSpacing: '-0.04em' }}>GUDDU <span style={{ color: 'var(--primary)' }}>TRADERS</span></h2>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 4px 4px', borderRadius: '30px', backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.75rem', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.3)' }}>U</div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Admin <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                            </span>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '32px', flex: 1, backgroundColor: 'var(--bg)' }}>
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

