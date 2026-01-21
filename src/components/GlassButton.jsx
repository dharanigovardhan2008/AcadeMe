import React from 'react';

const GlassButton = ({ children, onClick, type = 'button', variant = 'glass', className = '', style = {}, ...props }) => {
    // variants: 'glass', 'gradient', 'danger'

    let baseClass = 'glass-button';
    if (variant === 'gradient') baseClass += ' btn-gradient';

    return (
        <button
            type={type}
            className={`${baseClass} ${className}`}
            onClick={onClick}
            style={{
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                ...style
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export default GlassButton;
