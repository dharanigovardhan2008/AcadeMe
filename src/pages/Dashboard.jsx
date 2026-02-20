{/* --- Faculty Reviews Card --- */}
<GlassCard 
    className="dashboard-card" 
    onClick={() => navigate('/reviews')} // Make sure to import useNavigate
    style={{ 
        cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: '180px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
    }}
>
    {/* Decorative Background Blob */}
    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)', borderRadius: '50%' }}></div>
    
    <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ 
                width: '50px', height: '50px', 
                background: 'linear-gradient(135deg, #EC4899, #BE185D)', 
                borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 15px rgba(236, 72, 153, 0.3)'
            }}>
                <MessageSquare size={26} color="white" />
            </div>
            <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'white' }}>Faculty Reviews</h3>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Check ratings, internal marks difficulty, and feedback from seniors.
        </p>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', color: '#EC4899', fontSize: '0.9rem', fontWeight: 'bold' }}>
        View Ratings <ArrowRight size={16} style={{ marginLeft: '5px' }} />
    </div>
</GlassCard>
