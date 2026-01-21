import React from 'react';

const GlassInput = ({ icon: Icon, label, style = {}, className = '', ...props }) => {
    return (
        <div className={className} style={{ marginBottom: '1rem', width: '100%', ...style }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {Icon && (
                    <div style={{
                        position: 'absolute',
                        left: '12px',
                        color: 'rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Icon size={18} />
                    </div>
                )}
                <input
                    className="glass-input"
                    style={{
                        width: '100%',
                        paddingLeft: Icon ? '40px' : '16px'
                    }}
                    {...props}
                />
            </div>
        </div>
    );
};

export default GlassInput;
