import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MapPin, User, X, Filter, GraduationCap } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import Badge from '../components/Badge';
import DashboardLayout from '../components/DashboardLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ============ CACHING LOGIC ============
const CACHE_KEY = 'faculty_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours (Faculty data rarely changes)

const getFromCache = () => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const timestamp = sessionStorage.getItem(`${CACHE_KEY}_time`);
    if (!cached || !timestamp) return null;
    if (Date.now() - parseInt(timestamp) > CACHE_DURATION) return null;
    return JSON.parse(cached);
};

const saveToCache = (data) => {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
};
// =======================================

const FacultyDirectory = () => {
    const [faculty, setFaculty] = useState([]);
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('All');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [loading, setLoading] = useState(true);

    const departments = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'AIDS', 'BT', 'BME'];

    // FETCH DATA WITH CACHING
    useEffect(() => {
        const fetchData = async () => {
            // 1. Try Cache
            const cachedData = getFromCache();
            if (cachedData) {
                setFaculty(cachedData);
                setLoading(false);
                return;
            }

            try {
                // 2. Fetch Firebase (Only if no cache)
                const querySnapshot = await getDocs(collection(db, "faculty"));
                const list = [];
                querySnapshot.forEach((doc) => {
                    list.push({ id: doc.id, ...doc.data() });
                });
                setFaculty(list);
                saveToCache(list);
            } catch (error) {
                console.error("Error fetching faculty:", error);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    // Filter Logic (Local - 0 Reads)
    const filtered = faculty.filter(f => {
        const matchSearch = f.name?.toLowerCase().includes(search.toLowerCase()) ||
            f.designation?.toLowerCase().includes(search.toLowerCase()) ||
            f.specialization?.toLowerCase().includes(search.toLowerCase());
        const matchDept = dept === 'All' || f.department === dept || f.branch === dept;
        return matchSearch && matchDept;
    });

    return (
        <DashboardLayout>
            <GlassCard className="mb-6 reveal-scale" style={{ zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', color: '#F472B6' }}>
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Faculty Directory</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Connect with your professors</p>
                        </div>
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
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '5px', maxWidth: '100%' }} className="custom-scrollbar">
                        {departments.map(d => (
                            <button
                                key={d}
                                onClick={() => setDept(d)}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                                    borderColor: dept === d ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    background: dept === d ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: dept === d ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {loading ? (
                // Skeleton Loader
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-pulse" style={{ height: '200px', borderRadius: '16px' }}></div>)}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filtered.map((f, idx) => (
                        <GlassCard
                            key={f.id}
                            className={`card-3d reveal-up stagger-${idx % 5}`} // Animations applied here
                            onClick={() => setSelectedFaculty(f)}
                            style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                        >
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '3px solid rgba(255,255,255,0.2)',
                                fontSize: '1.5rem', fontWeight: 'bold', color: 'white'
                            }}>
                                {f.name.split(' ')[1]?.[0] || f.name[0]}
                            </div>
                            <h3 style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>{f.name}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{f.designation}</p>
                            <Badge variant="primary">{f.department || f.branch}</Badge>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Detail Modal (Preserved UI) */}
            {selectedFaculty && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 60,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    animation: 'fadeIn 0.3s ease-out'
                }} onClick={() => setSelectedFaculty(null)}>
                    <GlassCard
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: '500px', position: 'relative', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
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
                                <Badge variant="primary">{selectedFaculty.department || selectedFaculty.branch}</Badge>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <Mail size={20} color="var(--accent)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</p>
                                    <p>{selectedFaculty.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <Phone size={20} color="var(--success)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone</p>
                                    <p>{selectedFaculty.phone || selectedFaculty.mobile || 'N/A'}</p>
                                </div>
                            </div>
                            {selectedFaculty.cabin && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <MapPin size={20} color="var(--warning)" />
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cabin</p>
                                        <p>{selectedFaculty.cabin}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <a href={`tel:${selectedFaculty.mobile}`} style={{ flex: 1, textDecoration: 'none' }}>
                                <GlassButton variant="gradient" style={{ width: '100%', justifyContent: 'center' }}>Call Now</GlassButton>
                            </a>
                            <a href={`mailto:${selectedFaculty.email}`} style={{ flex: 1, textDecoration: 'none' }}>
                                <GlassButton style={{ width: '100%', justifyContent: 'center' }}>Send Email</GlassButton>
                            </a>
                        </div>
                    </GlassCard>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDirectory;
