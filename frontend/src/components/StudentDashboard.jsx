import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import complaintService from '../services/complaintService';
import ComplaintCard from './ComplaintCard';
import { PlusCircle, Megaphone, Search, SlidersHorizontal, AlertCircle, Clock, CheckCircle2, Calendar, FileText } from 'lucide-react';

const StudentDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(true);
    const [stats, setStats] = useState({
        totalComplaints: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        totalLeaves: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [search, setSearch] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const categories = ['PLUMBING', 'ELECTRICAL', 'INTERNET', 'INFRASTRUCTURE', 'MESS', 'CLEANING', 'SECURITY', 'OTHER'];

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const data = await complaintService.getStats();
            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchComplaints = async (resetPage = false) => {
        const currentPage = resetPage ? 1 : page;
        if (resetPage) setPage(1);
        setLoadingComplaints(true);
        try {
            const params = { page: currentPage, limit: 5 }; // Show 5 complaints per page
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (search) params.search = search;

            const data = await complaintService.getComplaints(params);
            if (data.success) {
                setComplaints(data.data);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        } finally {
            setLoadingComplaints(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchComplaints(true);
    }, [statusFilter, categoryFilter]);

    useEffect(() => {
        fetchComplaints(false);
    }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchComplaints(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '4px' }}>Student Dashboard</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quickly file complaints or check news updates</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link to="/raise-complaint" className="btn btn-primary">
                        <PlusCircle size={18} />
                        File a New Complaint
                    </Link>
                    <Link to="/notices" className="btn btn-secondary">
                        <Megaphone size={18} />
                        View Notice Board
                    </Link>
                </div>
            </div>

            {/* Student Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px' }}>
                        <FileText size={22} color="var(--primary)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>My Complaints</span>
                        <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginTop: '4px' }}>{stats.totalComplaints}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '3px solid var(--warning)' }}>
                    <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
                        <Clock size={22} color="var(--warning)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending</span>
                        <h3 style={{ fontSize: '1.3rem', color: 'var(--warning)', marginTop: '4px' }}>{stats.pendingComplaints}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '3px solid var(--success)' }}>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                        <CheckCircle2 size={22} color="var(--success)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved</span>
                        <h3 style={{ fontSize: '1.3rem', color: 'var(--success)', marginTop: '4px' }}>{stats.resolvedComplaints}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '3px solid var(--info)' }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                        <Calendar size={22} color="var(--info)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Leaves</span>
                        <h3 style={{ fontSize: '1.3rem', color: 'var(--info)', marginTop: '4px' }}>{stats.totalLeaves}</h3>
                    </div>
                </div>
            </div>

            {/* Complaint History Filters */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem' }}>My Complaint History</h3>
                    
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                        <input 
                            type="text" 
                            placeholder="Search complaints..." 
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
                        Filter:
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
                </div>

                {/* History List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loadingComplaints ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>Loading complaints...</p>
                    ) : complaints.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={28} />
                            <p>No complaints found.</p>
                        </div>
                    ) : (
                        complaints.map(c => (
                            <ComplaintCard key={c.id} complaint={c} />
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                        </span>
                        <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
