import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';
import { Calendar, ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';

const LeaveManagement = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    // Student Form State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Warden Action Remarks State
    const [remarksMap, setRemarksMap] = useState({});
    const [processingId, setProcessingId] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const data = await leaveService.getLeaves();
            if (data.success) {
                setLeaves(data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load leave requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    // Student Apply Leave
    const handleApplyLeave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const data = await leaveService.applyLeave({ startDate, endDate, reason });
            if (data.success) {
                showToast('Leave request submitted successfully!');
                setStartDate('');
                setEndDate('');
                setReason('');
                fetchLeaves();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply for leave.');
        } finally {
            setSubmitting(false);
        }
    };

    // Warden Approve / Reject
    const handleWardenAction = async (id, status) => {
        const remarks = remarksMap[id] || '';
        setProcessingId(id);
        try {
            const data = await leaveService.updateLeaveStatus(id, status, remarks);
            if (data.success) {
                showToast(`Leave request ${status.toLowerCase()} successfully!`);
                fetchLeaves();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update request.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRemarksChange = (id, val) => {
        setRemarksMap(prev => ({ ...prev, [id]: val }));
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'APPROVED': return 'badge-resolved'; // Green badge
            case 'REJECTED': return 'badge-rejected'; // Red badge
            default: return 'badge-pending';
        }
    };

    if (loading && leaves.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leave module...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Leave Management</h2>

            {user?.role === 'student' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {/* Student Apply Form */}
                    <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} color="var(--primary)" />
                            Apply for Leave Outpass
                        </h3>
                        <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start Date</label>
                                <input 
                                    type="date" 
                                    className="glass-input" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>End Date</label>
                                <input 
                                    type="date" 
                                    className="glass-input" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reason for Leave</label>
                                <textarea 
                                    placeholder="Explain where you are going and why..." 
                                    className="glass-input" 
                                    rows="4" 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)} 
                                    required 
                                />
                            </div>

                            {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}

                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>

                    {/* Student Leave Request History */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClipboardList size={18} color="var(--primary)" />
                            Leave History & Status
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto' }}>
                            {leaves.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No leave requests found.</p>
                            ) : (
                                leaves.map(l => (
                                    <div key={l.id} className="comment-box" style={{ borderLeft: '3px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                                            </span>
                                            <span className={`badge ${getStatusBadgeClass(l.status)}`}>{l.status}</span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}><b>Reason:</b> {l.reason}</p>
                                        {l.remarks && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                                                <b>Warden Remarks:</b> {l.remarks}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Warden Approval Dashboard */
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} color="var(--primary)" />
                        Pending Leave Requests ({leaves.filter(l => l.status === 'PENDING').length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {leaves.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No leave requests submitted for your hostel block.</p>
                        ) : (
                            leaves.map(l => (
                                <div key={l.id} className="comment-box" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', background: 'rgba(255, 255, 255, 0.01)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <strong style={{ color: 'var(--text-main)' }}>{l.student?.name}</strong>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>Room {l.student?.room} ({l.student?.hostel})</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <b>Duration:</b> {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                                            </span>
                                            <span className={`badge ${getStatusBadgeClass(l.status)}`} style={{ marginLeft: '12px' }}>{l.status}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><b>Reason:</b> {l.reason}</p>

                                    {l.status === 'PENDING' ? (
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decision Remarks (Optional)</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Add approval or rejection remarks..." 
                                                    className="glass-input"
                                                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                    value={remarksMap[l.id] || ''}
                                                    onChange={(e) => handleRemarksChange(l.id, e.target.value)}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="btn btn-primary" 
                                                    style={{ padding: '8px 16px', background: 'var(--success)', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}
                                                    onClick={() => handleWardenAction(l.id, 'APPROVED')}
                                                    disabled={processingId === l.id}
                                                >
                                                    <CheckCircle2 size={16} /> Approve
                                                </button>
                                                <button 
                                                    className="btn btn-secondary" 
                                                    style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger-glow)' }}
                                                    onClick={() => handleWardenAction(l.id, 'REJECTED')}
                                                    disabled={processingId === l.id}
                                                >
                                                    <XCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        l.remarks && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                                                <b>Decision Remarks:</b> {l.remarks}
                                            </p>
                                        )
                                    )}
                                </div>
                            ))
                        )}
                    </div>
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

export default LeaveManagement;
