import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import complaintService from '../services/complaintService';
import ComplaintCard from './ComplaintCard';
import { PlusCircle, Megaphone, Search, SlidersHorizontal, AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [search, setSearch] = useState('');

    const categories = ['PLUMBING', 'ELECTRICAL', 'INTERNET', 'INFRASTRUCTURE', 'MESS', 'CLEANING', 'SECURITY', 'OTHER'];

    const fetchComplaints = async () => {
        setLoadingComplaints(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (search) params.search = search;

            const data = await complaintService.getComplaints(params);
            if (data.success) {
                setComplaints(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        } finally {
            setLoadingComplaints(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [statusFilter, categoryFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchComplaints();
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
            </div>
        </div>
    );
};

export default StudentDashboard;
