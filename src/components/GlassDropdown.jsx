import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const GlassDropdown = ({ options, value, onChange, placeholder = "Select...", icon: Icon, style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
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

    // ✅ Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = useCallback((option) => {
        onChange(option);
        setIsOpen(false);
        setHoveredOption(null);
    }, [onChange]);

    return (
        // ✅ Bug #14 Fix — z-index set to 999 when open so it never hides behind other elements
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 999 : 1, ...style }}>

            {/* Trigger Box */}
            <div
                onClick={() => setIsOpen(prev => !prev)}
                style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${isOpen ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: value ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'border 0.2s, box-shadow 0.2s',
                    boxShadow: isOpen ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {Icon && <Icon size={18} style={{ color: 'var(--text-secondary)' }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {value || placeholder}
                    </span>
                </div>
                <ChevronDown
                    size={18}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s',
                        color: 'var(--text-secondary)',
                        flexShrink: 0
                    }}
                />
            </div>

            {/* Dropdown List */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '100%',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: 'rgba(15,15,26,0.97)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    zIndex: 999,
                    padding: '6px'
                }}>
                    {options.length === 0 ? (
                        <div style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', textAlign: 'center' }}>
                            No options
                        </div>
                    ) : options.map((option) => {
                        const isSelected = value === option;
                        const isHovered = hoveredOption === option;
                        return (
                            <div
                                key={option}
                                onClick={() => handleSelect(option)}
                                // ✅ Bug #14 Fix — hover handled via state, no <style> injection inside loop
                                onMouseEnter={() => setHoveredOption(option)}
                                onMouseLeave={() => setHoveredOption(null)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '2px',
                                    fontSize: '0.95rem',
                                    background: isSelected
                                        ? 'rgba(59,130,246,0.15)'
                                        : isHovered
                                            ? 'rgba(255,255,255,0.07)'
                                            : 'transparent',
                                    transition: 'background 0.15s'
                                }}
                            >
                                <span>{option}</span>
                                {isSelected && <Check size={16} color="var(--primary)" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GlassDropdown;
