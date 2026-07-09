import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Shield, Users, UserCheck, AlertOctagon, FileText, CheckCircle2, BarChart3 } from 'lucide-react';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('escalated');
    const [stats, setStats] = useState({ totalStudents: 0, totalWardens: 0, totalComplaints: 0, totalEscalated: 0 });
    const [escalated, setEscalated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Register Warden Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hostel, setHostel] = useState('');
    const [phone, setPhone] = useState('');
    const [room, setRoom] = useState('');
    const [registering, setRegistering] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const statsRes = await api.get('/admin/stats');
            if (statsRes.data.success) setStats(statsRes.data.data);

            const escalatedRes = await api.get('/admin/escalated');
            if (escalatedRes.data.success) setEscalated(escalatedRes.data.data);
        } catch (err) {
            showToast('Failed to load system metrics.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    // Create Warden Account
    const handleCreateWarden = async (e) => {
        e.preventDefault();
        setRegistering(true);
        try {
            const res = await api.post('/admin/wardens', { name, email, password, hostel, phone, room });
            if (res.data.success) {
                showToast('Warden account created successfully!');
                setName('');
                setEmail('');
                setPassword('');
                setHostel('');
                setPhone('');
                setRoom('');
                fetchAdminData();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create account.', 'error');
        } finally {
            setRegistering(false);
        }
    };

    // Directly Resolve Escalated Complaint
    const handleDirectResolve = async (complaintId) => {
        if (!window.confirm("Are you sure you want to resolve this complaint directly?")) return;
        try {
            const res = await api.put(`/admin/complaints/${complaintId}/resolve`);
            if (res.data.success) {
                showToast('Complaint resolved successfully!');
                fetchAdminData();
            }
        } catch (err) {
            showToast('Failed to resolve complaint.', 'error');
        }
    };

    if (loading && escalated.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Admin Portal...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={24} color="var(--primary)" />
                    System Admin Panel
                </h2>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px' }}>
                        <Users size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</span>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '4px' }}>{stats.totalStudents}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px' }}>
                        <UserCheck size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Wardens</span>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '4px' }}>{stats.totalWardens}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px' }}>
                        <FileText size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Complaints</span>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '4px' }}>{stats.totalComplaints}</h3>
                    </div>
                </div>

                <div className={`glass-panel ${stats.totalEscalated > 0 ? 'escalated-glowing-card' : ''}`} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: stats.totalEscalated > 0 ? '3px solid var(--danger)' : 'none' }}>
                    <div style={{ padding: '12px', background: stats.totalEscalated > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)', borderRadius: '12px' }}>
                        <AlertOctagon size={24} color={stats.totalEscalated > 0 ? 'var(--danger)' : 'var(--primary)'} />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: stats.totalEscalated > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Escalations</span>
                        <h3 style={{ fontSize: '1.4rem', color: stats.totalEscalated > 0 ? 'var(--danger)' : 'var(--text-main)', marginTop: '4px' }}>{stats.totalEscalated}</h3>
                    </div>
                </div>
            </div>

            {/* Hostel-wise Complaint Distribution */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="var(--primary)" />
                    Hostel Block Complaint Distribution
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!stats.hostelStats || stats.hostelStats.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px 0' }}>No complaints recorded in any hostel block yet.</p>
                    ) : (
                        stats.hostelStats.map(h => {
                            const count = h._count.id;
                            const maxCount = Math.max(...stats.hostelStats.map(item => item._count.id), 1);
                            const pct = (count / maxCount) * 100;

                            return (
                                <div key={h.hostel} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{h.hostel}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{count} {count === 1 ? 'complaint' : 'complaints'}</span>
                                    </div>
                                    <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                        <div 
                                            style={{ 
                                                height: '100%', 
                                                width: `${pct}%`, 
                                                background: 'var(--primary)',
                                                borderRadius: '5px',
                                                transition: 'width 0.5s ease-in-out',
                                                boxShadow: '0 0 8px var(--primary-glow)'
                                            }} 
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button 
                    className={`btn ${activeTab === 'escalated' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('escalated')}
                >
                    Escalated Queue ({escalated.length})
                </button>
                <button 
                    className={`btn ${activeTab === 'warden' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('warden')}
                >
                    Register Warden
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'escalated' ? (
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Active Escalation Queue</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {escalated.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No escalated complaints at this time. Good job!</p>
                        ) : (
                            escalated.map(c => (
                                <div key={c.id} className="comment-box" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', borderLeft: '3px solid var(--danger)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <h4 style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{c.title}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                By: <b>{c.createdBy?.name}</b> (Room {c.createdBy?.room}) | Hostel: <b>{c.hostel}</b>
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <span className="badge badge-pending" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>ESCALATED</span>
                                            <button 
                                                className="btn btn-primary"
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success)', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}
                                                onClick={() => handleDirectResolve(c.id)}
                                            >
                                                <CheckCircle2 size={14} /> Resolve Directly
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{c.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '24px', maxWidth: '500px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Onboard New Hostel Warden</h3>
                    <form onSubmit={handleCreateWarden} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="Enter warden name"
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Address</label>
                            <input 
                                type="email" 
                                className="glass-input" 
                                placeholder="warden@university.com"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Initial Password</label>
                            <input 
                                type="password" 
                                className="glass-input" 
                                placeholder="Min 8 characters"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Hostel Block</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="e.g. Aryabhata Block"
                                value={hostel} 
                                onChange={(e) => setHostel(e.target.value)} 
                                required 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Warden Office Room / Location</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="e.g. Ground Floor Office"
                                value={room} 
                                onChange={(e) => setRoom(e.target.value)} 
                                required 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="10-digit number"
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={registering} style={{ marginTop: '8px' }}>
                            {registering ? 'Creating Account...' : 'Register Warden'}
                        </button>
                    </form>
                </div>
            )}

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
