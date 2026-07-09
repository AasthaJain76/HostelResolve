import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import complaintService from '../services/complaintService';
import ComplaintCard from './ComplaintCard';
import { Search, SlidersHorizontal, BarChart3, AlertCircle, RefreshCw, Megaphone } from 'lucide-react';

const WardenDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [search, setSearch] = useState('');

    const categories = ['PLUMBING', 'ELECTRICAL', 'INTERNET', 'INFRASTRUCTURE', 'MESS', 'CLEANING', 'SECURITY', 'OTHER'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const data = await complaintService.getStats();
            setStats(data.data);
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (priorityFilter) params.priority = priorityFilter;
            if (search) params.search = search;

            const data = await complaintService.getComplaints(params);
            if (data.success) {
                setComplaints(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchComplaints();
    }, [statusFilter, categoryFilter, priorityFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchComplaints();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '4px' }}>Warden Dashboard</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage student complaints and notices for your hostel</p>
                </div>
                <div>
                    <Link to="/notices" className="btn btn-primary">
                        <Megaphone size={18} />
                        Manage Notice Board
                    </Link>
                </div>
            </div>

            {/* Statistics Banner */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={22} color="var(--primary)" />
                        Hostel Analytics
                    </h2>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => { fetchStats(); fetchComplaints(); }}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                </div>

                <div className="stats-row">
                    <div className="glass-panel stats-card">
                        <h4>Total Complaints</h4>
                        <div className="stats-num">{stats.total}</div>
                    </div>
                    <div className="glass-panel stats-card" style={{ borderBottom: '3px solid var(--warning)' }}>
                        <h4>Pending</h4>
                        <div className="stats-num" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
                    </div>
                    <div className="glass-panel stats-card" style={{ borderBottom: '3px solid var(--info)' }}>
                        <h4>In Progress</h4>
                        <div className="stats-num" style={{ color: 'var(--info)' }}>{stats.inProgress}</div>
                    </div>
                    <div className="glass-panel stats-card" style={{ borderBottom: '3px solid var(--success)' }}>
                        <h4>Resolved</h4>
                        <div className="stats-num" style={{ color: 'var(--success)' }}>{stats.resolved}</div>
                    </div>
                    <div className="glass-panel stats-card" style={{ borderBottom: '3px solid var(--danger)' }}>
                        <h4>Rejected</h4>
                        <div className="stats-num" style={{ color: 'var(--danger)' }}>{stats.rejected}</div>
                    </div>
                </div>
            </div>

            {/* Category Workload Chart */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="var(--primary)" />
                    Workload Category Distribution
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {categories.map(c => {
                        const count = stats.categories?.[c] || 0;
                        const maxCount = Math.max(...categories.map(cat => stats.categories?.[cat] || 0), 1);
                        const pct = (count / maxCount) * 100;

                        return (
                            <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{count} {count === 1 ? 'complaint' : 'complaints'}</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div 
                                        style={{ 
                                            height: '100%', 
                                            width: `${pct}%`, 
                                            background: count > 0 ? 'var(--primary)' : 'transparent',
                                            borderRadius: '4px',
                                            transition: 'width 0.5s ease-in-out',
                                            boxShadow: count > 0 ? '0 0 8px var(--primary-glow)' : 'none'
                                        }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Complaints list */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>Student Complaints</h3>
                    
                    <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                        <input 
                            type="text" 
                            placeholder="Search by student or title..." 
                            className="glass-input"
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px' }}>
                            <Search size={16} />
                        </button>
                    </form>
                </div>

                <div className="filters-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <SlidersHorizontal size={16} />
                        Filters:
                    </span>
                    <select 
                        className="glass-input" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <select 
                        className="glass-input" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                        className="glass-input" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>Loading complaints...</p>
                    ) : complaints.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={28} />
                            <p>No complaints found for this hostel.</p>
                        </div>
                    ) : (
                        complaints.map(c => (
                            <ComplaintCard key={c.id} complaint={c} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WardenDashboard;
