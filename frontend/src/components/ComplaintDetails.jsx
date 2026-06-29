import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import complaintService from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { 
    ArrowLeft, Calendar, User, Home, Phone, Star, 
    Send, Trash2, CheckCircle2, ShieldCheck, HelpCircle
} from 'lucide-react';

const ComplaintDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    // Comments State
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Warden Updates State
    const [statusUpdate, setStatusUpdate] = useState('');
    const [resolvedImages, setResolvedImages] = useState([]);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Feedback State
    const [rating, setRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Reopen State
    const [reopenReason, setReopenReason] = useState('');
    const [showReopenForm, setShowReopenForm] = useState(false);
    const [submittingReopen, setSubmittingReopen] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchComplaint = async () => {
        try {
            const data = await complaintService.getComplaintById(id);
            if (data.success) {
                setComplaint(data.data);
                setStatusUpdate(data.data.status);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load complaint details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaint();
    }, [id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmittingComment(true);

        try {
            const data = await complaintService.addComment(id, commentText);
            if (data.success) {
                setCommentText('');
                fetchComplaint();
                showToast('Comment added!');
            }
        } catch (err) {
            showToast('Failed to add comment.', 'error');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            const data = await complaintService.deleteComment(id, commentId);
            if (data.success) {
                fetchComplaint();
                showToast('Comment deleted');
            }
        } catch (err) {
            showToast('Failed to delete comment.', 'error');
        }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setUpdatingStatus(true);

        const formData = new FormData();
        formData.append('status', statusUpdate);
        resolvedImages.forEach((img) => {
            formData.append('resolvedImages', img);
        });

        try {
            const data = await complaintService.updateComplaint(id, formData);
            if (data.success) {
                showToast('Status updated successfully!');
                setResolvedImages([]);
                fetchComplaint();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update status.', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setSubmittingFeedback(true);

        try {
            const data = await complaintService.submitFeedback(id, rating, feedbackComment);
            if (data.success) {
                showToast('Feedback submitted! Thank you.');
                setFeedbackComment('');
                fetchComplaint();
            }
        } catch (err) {
            showToast('Failed to submit feedback.', 'error');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleReopen = async (e) => {
        e.preventDefault();
        setSubmittingReopen(true);

        try {
            const data = await complaintService.reopenComplaint(id, reopenReason);
            if (data.success) {
                showToast('Complaint reopened.');
                setReopenReason('');
                setShowReopenForm(false);
                fetchComplaint();
            }
        } catch (err) {
            showToast('Failed to reopen complaint.', 'error');
        } finally {
            setSubmittingReopen(false);
        }
    };

    const handleDeleteComplaint = async () => {
        if (!window.confirm('Are you absolutely sure you want to delete this complaint from the system?')) return;
        try {
            const data = await complaintService.deleteComplaint(id);
            if (data.success) {
                navigate('/');
            }
        } catch (err) {
            showToast('Failed to delete complaint.', 'error');
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading details...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>;
    if (!complaint) return <div style={{ padding: '40px', textAlign: 'center' }}>Complaint not found.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header / Go back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px 16px' }}>
                    <ArrowLeft size={18} />
                    Back
                </button>
                {user?.role === 'warden' && (
                    <button className="btn btn-danger" onClick={handleDeleteComplaint} style={{ padding: '8px 16px' }}>
                        <Trash2 size={18} />
                        Delete Complaint
                    </button>
                )}
            </div>

            <div className="dashboard-grid">
                {/* Main Details Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                            <span className="badge badge-pending" style={{ textTransform: 'none', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                                {complaint.category}
                            </span>
                            <div>
                                <span className={`badge badge-${complaint.status.toLowerCase()}`}>{complaint.status.replace('_', ' ')}</span>
                                <span className={`prio-badge prio-${complaint.priority}`}>{complaint.priority}</span>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '16px' }}>{complaint.title}</h2>

                        {/* Student metadata info */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'rgba(0, 0, 0, 0.1)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <User size={16} color="var(--primary)" />
                                <span>Reported by: <strong>{complaint.createdBy?.name}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <Home size={16} color="var(--primary)" />
                                <span>{complaint.hostel} - Room {complaint.room}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <Calendar size={16} color="var(--primary)" />
                                <span>Filed: {new Date(complaint.createdAt).toLocaleString()}</span>
                            </div>
                            {complaint.createdBy?.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                    <Phone size={16} color="var(--primary)" />
                                    <span>Phone: {complaint.createdBy.phone}</span>
                                </div>
                            )}
                        </div>

                        <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-main)' }}>Description</h4>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
                            {complaint.description}
                        </p>

                        {/* Complaint Images */}
                        {complaint.images && complaint.images.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-main)' }}>Student Attachments</h4>
                                <div className="image-previews">
                                    {complaint.images.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={`http://localhost:3000/${img}`} 
                                            alt="Complaint attach" 
                                            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                            onClick={() => window.open(`http://localhost:3000/${img}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resolved Images */}
                        {complaint.resolvedImages && complaint.resolvedImages.length > 0 && (
                            <div style={{ marginBottom: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--success)' }}>Warden Resolution Photos</h4>
                                <div className="image-previews">
                                    {complaint.resolvedImages.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={`http://localhost:3000/${img}`} 
                                            alt="Resolution attach" 
                                            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--success)', cursor: 'pointer' }}
                                            onClick={() => window.open(`http://localhost:3000/${img}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline Tracker */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Complaint Timeline</h3>
                        <div className="timeline">
                            <div className="timeline-item">
                                <div className="timeline-dot active"></div>
                                <strong style={{ fontSize: '0.9rem' }}>Filed</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complaint successfully raised by student</p>
                            </div>
                            <div className="timeline-item">
                                <div className={`timeline-dot ${complaint.status !== 'PENDING' ? 'active' : ''}`}></div>
                                <strong style={{ fontSize: '0.9rem' }}>Under Review / In Progress</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Warden reviewing or resolving issue</p>
                            </div>
                            <div className="timeline-item">
                                <div className={`timeline-dot ${['RESOLVED', 'REJECTED'].includes(complaint.status) ? 'active' : ''}`}></div>
                                <strong style={{ fontSize: '0.9rem' }}>Resolved / Rejected</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Final decision made by Warden</p>
                            </div>
                        </div>
                    </div>

                    {/* Comments Thread */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Comments / Updates Thread</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                            {complaint.comments?.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                                    No comments yet. Leave a comment to communicate.
                                </p>
                            ) : (
                                complaint.comments?.map(c => (
                                    <div key={c.id} className="comment-box">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                                {c.user?.name} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--primary)' }}>({c.user?.role})</span>
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(c.createdAt).toLocaleDateString()}
                                                </span>
                                                {(c.userId === user?.id || user?.role === 'warden') && (
                                                    <button 
                                                        onClick={() => handleDeleteComment(c.id)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{c.text}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Leave Comment Form */}
                        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                placeholder="Type a message or update..." 
                                className="glass-input" 
                                style={{ flex: 1 }}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '12px' }} disabled={submittingComment}>
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right side - Action Control Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Warden Action Panel */}
                    {user?.role === 'warden' && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                        <div className="glass-panel" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={20} color="var(--primary)" />
                                Warden Resolve Panel
                            </h3>
                            <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update Status</label>
                                    <select 
                                        className="glass-input" 
                                        value={statusUpdate}
                                        onChange={(e) => setStatusUpdate(e.target.value)}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>

                                {statusUpdate === 'RESOLVED' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '0.85rem' }}>
                                            Attach Resolution Images
                                            <input 
                                                type="file" 
                                                multiple 
                                                accept="image/*" 
                                                onChange={(e) => setResolvedImages(Array.from(e.target.files))} 
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {resolvedImages.length} image(s) selected
                                        </span>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary" disabled={updatingStatus}>
                                    {updatingStatus ? 'Updating...' : 'Apply Status Change'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Student Feedback Panel */}
                    {user?.role === 'student' && complaint.status === 'RESOLVED' && !complaint.feedback && (
                        <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--success-glow)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                                <CheckCircle2 size={20} />
                                Give Rating & Feedback
                            </h3>
                            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rating</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star} 
                                                type="button" 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                onClick={() => setRating(star)}
                                            >
                                                <Star 
                                                    size={24} 
                                                    fill={star <= rating ? 'var(--warning)' : 'none'} 
                                                    color={star <= rating ? 'var(--warning)' : 'var(--text-muted)'} 
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Remarks</label>
                                    <textarea 
                                        placeholder="Are you satisfied with the resolution?" 
                                        className="glass-input" 
                                        rows="3"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={submittingFeedback}>
                                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Show Existing Feedback */}
                    {complaint.feedback && (
                        <div className="glass-panel" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                                <CheckCircle2 size={20} />
                                Student Feedback Received
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                        key={star} 
                                        size={18} 
                                        fill={star <= complaint.feedback.rating ? 'var(--warning)' : 'none'} 
                                        color={star <= complaint.feedback.rating ? 'var(--warning)' : 'var(--text-muted)'} 
                                    />
                                ))}
                                <span style={{ marginLeft: '6px', fontSize: '0.9rem', fontWeight: 600 }}>({complaint.feedback.rating}/5)</span>
                            </div>
                            {complaint.feedback.comment && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    "{complaint.feedback.comment}"
                                </p>
                            )}
                        </div>
                    )}

                    {/* Student Reopen Request Panel */}
                    {user?.role === 'student' && ['RESOLVED', 'REJECTED'].includes(complaint.status) && (
                        <div className="glass-panel" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HelpCircle size={20} color="var(--primary)" />
                                Issue Not Resolved?
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                If you are unsatisfied with the resolution or the problem persists, you can request to reopen this complaint.
                            </p>
                            {!showReopenForm ? (
                                <button className="btn btn-secondary" onClick={() => setShowReopenForm(true)} style={{ width: '100%' }}>
                                    Reopen Complaint
                                </button>
                            ) : (
                                <form onSubmit={handleReopen} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <textarea 
                                        placeholder="State the reason for reopening..." 
                                        className="glass-input" 
                                        rows="3"
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        required
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingReopen}>
                                            {submittingReopen ? 'Submitting...' : 'Reopen'}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowReopenForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default ComplaintDetails;
