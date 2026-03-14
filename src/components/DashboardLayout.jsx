import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

            {/* 
                SIDEBAR z-index: 200 — always on top of everything including topbar
                OVERLAY z-index: 199 — just below sidebar, above content
                TOPBAR  z-index: 100 — above page content, below sidebar+overlay
            */}
            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setSidebarOpen(false)}
            />

            {/* Overlay — sits above topbar but below sidebar */}
            {isSidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 199,
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                    }}
                />
            )}

            <main
                className="main-content"
                style={{ flex: 1, marginLeft: 0, transition: 'margin 0.3s ease' }}
            >
                <div style={{ padding: '1rem', paddingTop: 0 }}>
                    <TopBar toggleSidebar={() => setSidebarOpen(s => !s)} />
                    {children}
                </div>
            </main>

            <style>{`
                @media (min-width: 768px) {
                    .main-content { margin-left: 285px !important; }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;
