import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, User } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div style={{
                flex: 1,
                paddingLeft: '0',
                transition: 'padding-left 0.3s ease'
            }}
                className="main-content"
            >
                {/* Header Bar */}
                <header style={{
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 32px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="mobile-only"
                            style={{ background: 'none', padding: 0, color: 'var(--text)' }}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Management System</h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button style={{ background: 'none', color: 'var(--text-muted)' }}><Bell size={20} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: '50px', backgroundColor: '#f1f5f9' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>U</div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }} className="desktop-only">Admin User</span>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '32px' }}>
                    <Outlet />
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media (min-width: 769px) {
          .main-content { padding-left: 260px !important; }
        }
        @media (max-width: 768px) {
          main { padding: 16px !important; }
          header { padding: 0 16px !important; }
        }
      `}} />
        </div>
    );
};

export default Layout;
