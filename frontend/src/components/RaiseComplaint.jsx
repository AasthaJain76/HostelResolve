import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import complaintService from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Image as ImageIcon, PlusCircle } from 'lucide-react';

const RaiseComplaint = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('PLUMBING');
    const [priority, setPriority] = useState('MEDIUM');
    const [images, setImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const categories = ['PLUMBING', 'ELECTRICAL', 'INTERNET', 'INFRASTRUCTURE', 'MESS', 'CLEANING', 'SECURITY', 'OTHER'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFileChange = (e) => {
        setImages(Array.from(e.target.files));
    };

    const handleCreateComplaint = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('priority', priority);
        formData.append('hostel', user.hostel);
        formData.append('room', user.room);
        images.forEach((img) => {
            formData.append('images', img);
        });

        try {
            const data = await complaintService.createComplaint(formData);
            if (data.success) {
                showToast('Complaint submitted successfully!');
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            }
        } catch (err) {
            const errors = err.response?.data?.errors;
            const message = errors 
                ? errors.map(e => `${e.field}: ${e.message}`).join(', ')
                : err.response?.data?.message || 'Failed to submit complaint.';
            showToast(message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px 16px' }}>
                    <ArrowLeft size={18} />
                    Back
                </button>
                <h2 style={{ fontSize: '1.4rem' }}>Raise a Complaint</h2>
            </div>

            <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '1.2rem' }}>
                    <PlusCircle size={22} color="var(--primary)" />
                    Filing Form
                </h3>
                <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category</label>
                            <select 
                                className="glass-input" 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Priority</label>
                            <select 
                                className="glass-input" 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Title</label>
                        <input 
                            type="text" 
                            placeholder="E.g., Leakage in washroom tap" 
                            className="glass-input" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Description</label>
                        <textarea 
                            placeholder="Explain the issue in detail..." 
                            className="glass-input" 
                            rows="5"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hostel block</label>
                            <div className="glass-input" style={{ opacity: 0.8 }}>{user?.hostel}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Room No.</label>
                            <div className="glass-input" style={{ opacity: 0.8 }}>{user?.room}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px' }}>
                            <ImageIcon size={18} />
                            Upload Photos
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                style={{ display: 'none' }}
                            />
                        </label>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {images.length} image(s) selected
                        </span>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '10px' }} disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                </form>
            </div>

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default RaiseComplaint;
