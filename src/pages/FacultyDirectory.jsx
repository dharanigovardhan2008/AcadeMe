import React, { useState } from 'react';
import { Search, Mail, Phone, MapPin, User, X, Filter } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

const FacultyDirectory = () => {
    const { faculty } = useData();
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('All');
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    const departments = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'AIDS', 'BT', 'BME'];

    const filtered = faculty.filter(f => {
        const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.specialization.toLowerCase().includes(search.toLowerCase());
        const matchDept = dept === 'All' || f.department === dept;
        return matchSearch && matchDept;
    });

    return (
        <DashboardLayout>
            <GlassCard className="mb-6">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Faculty Directory</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Connect with your professors</p>
                    </div>
                    <Badge variant="neutral">{filtered.length} Members</Badge>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <GlassInput
                            icon={Search}
                            placeholder="Search by name, specialization..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '5px', maxWidth: '100%' }}>
                        {departments.map(d => (
                            <button
                                key={d}
                                onClick={() => setDept(d)}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                                    borderColor: dept === d ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    background: dept === d ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: dept === d ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer', whiteSpace: 'nowrap'
                                }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(f => (
                    <GlassCard
                        key={f.id}
                        className="hover:bg-white/5 cursor-pointer"
                        onClick={() => setSelectedFaculty(f)}
                        style={{ cursor: 'pointer', textAlign: 'center' }}
                    >
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '3px solid rgba(255,255,255,0.2)'
                        }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                                {f.name.split(' ')[1]?.[0] || f.name[0]}
                            </span>
                        </div>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>{f.name}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{f.designation}</p>
                        <Badge variant="primary">{f.department}</Badge>
                    </GlassCard>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedFaculty && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 60,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', p: '1rem'
                }} onClick={() => setSelectedFaculty(null)}>
                    <GlassCard
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: '500px', margin: '20px', position: 'relative' }}
                    >
                        <button
                            onClick={() => setSelectedFaculty(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1rem',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '4px solid rgba(255,255,255,0.2)'
                            }}>
                                <User size={40} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedFaculty.name}</h2>
                            <p style={{ color: 'var(--primary)' }}>{selectedFaculty.designation}</p>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Badge variant="primary">{selectedFaculty.department}</Badge>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <Mail size={20} color="var(--accent)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</p>
                                    <p>{selectedFaculty.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <Phone size={20} color="var(--success)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone</p>
                                    <p>{selectedFaculty.phone}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <MapPin size={20} color="var(--warning)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cabin</p>
                                    <p>{selectedFaculty.cabin}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <GlassButton variant="gradient" style={{ flex: 1, justifyContent: 'center' }}>Call Now</GlassButton>
                            <GlassButton style={{ flex: 1, justifyContent: 'center' }}>Send Email</GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDirectory;
