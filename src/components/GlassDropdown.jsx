import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const GlassDropdown = ({ options, value, onChange, placeholder = "Select...", icon: Icon, style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="glass-dropdown-container" style={{ position: 'relative', width: '100%', zIndex: isOpen ? 50 : 1, ...style }}>
            {/* The Trigger Box */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '14px 14px 14px 14px',
                    borderRadius: '14px',
                    background: 'rgba(0,0,0,0.3)', // Matches your Login Input style
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: value ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {Icon && <Icon size={18} style={{ color: 'var(--text-secondary)' }} />}
                    <span>{value || placeholder}</span>
                </div>
                <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', color: 'var(--text-secondary)' }} />
            </div>

            {/* The Glass Dropdown List */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '100%',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: 'rgba(15, 15, 26, 0.95)', // Solid dark base for readability
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    padding: '6px'
                }} className="custom-scrollbar">
                    {options.map((option) => (
                        <div
                            key={option}
                            onClick={() => {
                                onChange(option); // Pass Value Directly
                                setIsOpen(false);
                            }}
                            className="dropdown-item"
                            style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: value === option ? 'var(--primary)' : 'rgba(255,255,255,0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                                marginBottom: '2px',
                                background: value === option ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                fontSize: '0.95rem'
                            }}
                        >
                            <span>{option}</span>
                            {value === option && <Check size={16} color="var(--primary)" />}

                            {/* Hover Effect */}
                            <style>{`
                                .dropdown-item:hover {
                                    background: rgba(255, 255, 255, 0.05) !important;
                                    color: white !important;
                                }
                            `}</style>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlassDropdown;
