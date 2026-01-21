import React from 'react';

const Badge = ({ children, variant = 'primary', className = '' }) => {
    const styles = {
        primary: { color: '#60A5FA' },
        success: { color: '#34D399' },
        warning: { color: '#FBBF24' },
        danger: { color: '#F87171' },
        neutral: { color: '#9CA3AF' },
    };

    const currentStyle = styles[variant] || styles.primary;

    return (
        <span
            className={`inline-flex items-center text-sm font-medium ${className}`}
            style={{
                ...currentStyle,
                // Removed border and background as requested
                padding: '0 4px'
            }}
        >
            {children}
        </span>
    );
};

export default Badge;
