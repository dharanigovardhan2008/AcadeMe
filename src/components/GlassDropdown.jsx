import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const GlassDropdown = ({ options, value, onChange, placeholder = "Select...", style = {} }) => {
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
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
                }}
            >
                <span style={{ color: value ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    {value || placeholder}
                </span>
                <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '100%',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: 'rgba(15, 15, 26, 0.85)', // Translucent deep violet-black
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)', // Thin semi-transparent white border
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    zIndex: 100,
                    padding: '8px'
                }}>
                    {options.map((option) => (
                        <div
                            key={option}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                            className="dropdown-item"
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                                marginBottom: '4px',
                                background: value === option ? 'rgba(59, 130, 246, 0.2)' : 'transparent', // Fallback for hover
                                boxShadow: value === option ? 'inset 0 0 10px rgba(59, 130, 246, 0.1)' : 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: value === option ? '600' : '400' }}>{option}</span>
                            {value === option && <Check size={16} color="#60A5FA" />}

                            {/* Hover Effect Injection */}
                            <style>{`
                                .dropdown-item:hover {
                                    background: rgba(59, 130, 246, 0.15) !important;
                                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.1) !important;
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
