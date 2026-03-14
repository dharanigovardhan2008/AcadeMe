import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                    onClick={() => setSidebarOpen(false)}
                    className="mobile-only"
                ></div>
            )}

            <main style={{ flex: 1, marginLeft: '0', transition: 'margin 0.3s ease' }} className="main-content">
                <div className="container-custom" style={{ padding: '1rem', paddingTop: '0' }}>
                    <TopBar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                    {children}
                </div>
            </main>

            <style>{`
            @media (min-width: 768px) {
               .main-content { margin-left: 280px !important; }
            }
        `}</style>
        </div>
    );
};

export default DashboardLayout;
