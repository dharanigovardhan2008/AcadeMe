import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                width: '100%',
                position: 'relative',
                background: 'linear-gradient(135deg, #FFDCE8 0%, #F5E6FF 40%, #E6F0FF 100%)',
            }}
        >
            {/* Dark Overlay Backdrop - Visible when Sidebar is open on ANY screen size */}
            {isSidebarOpen && (
                <div
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 40,
                        cursor: 'pointer',
                    }}
                />
            )}

            {/* Sidebar Overlay */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                <TopBar toggleSidebar={toggleSidebar} />
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;