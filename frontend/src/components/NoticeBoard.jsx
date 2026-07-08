import React, { useState, useEffect } from 'react';
import announcementService from '../services/announcementService';
import { useAuth } from '../context/AuthContext';
import { Megaphone, Plus, Trash2, Image as ImageIcon, Pin, PinOff, Edit2 } from 'lucide-react';

const NoticeBoard = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Notice');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Edit Notice state
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editCategory, setEditCategory] = useState('Notice');

    const handleTogglePin = async (id) => {
        try {
            const data = await announcementService.togglePin(id);
            if (data.success) {
                fetchAnnouncements();
            }
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const handleEditClick = (notice) => {
        setEditingId(notice.id);
        setEditTitle(notice.title);
        setEditContent(notice.content);
        setEditCategory(notice.category);
    };

    const handleUpdate = async (e, id) => {
        e.preventDefault();
        try {
            const data = await announcementService.updateAnnouncement(id, {
                title: editTitle,
                content: editContent,
                category: editCategory
            });
            if (data.success) {
                setEditingId(null);
                fetchAnnouncements();
            }
        } catch (err) {
            console.error('Failed to update notice:', err);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const data = await announcementService.getAnnouncements();
            setAnnouncements(data.data);
        } catch (err) {
            console.error('Failed to load notices:', err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleFileChange = (e) => {
        setImages(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        images.forEach((img) => {
            formData.append('images', img);
        });

        try {
            const data = await announcementService.createAnnouncement(formData);
            if (data.success) {
                setTitle('');
                setContent('');
                setCategory('Notice');
                setImages([]);
                setShowForm(false);
                fetchAnnouncements();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post notice.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            const data = await announcementService.deleteAnnouncement(id);
            if (data.success) {
                fetchAnnouncements();
            }
        } catch (err) {
            console.error('Failed to delete notice:', err);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Megaphone size={20} color="var(--primary)" />
                    Notice Board
                </h3>
                {user?.role === 'warden' && (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setShowForm(!showForm)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                        <Plus size={16} />
                        {showForm ? 'Cancel' : 'Add Notice'}
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                    <input 
                        type="text" 
                        placeholder="Notice Title" 
                        className="glass-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <select 
                        className="glass-input" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="Notice">Notice</option>
                        <option value="Event">Event</option>
                        <option value="Mess">Mess Update</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Urgent">Urgent Notice</option>
                    </select>
                    <textarea 
                        placeholder="Write announcement details..." 
                        className="glass-input" 
                        rows="4"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '0.85rem' }}>
                            <ImageIcon size={16} />
                            Attach Images
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                style={{ display: 'none' }}
                            />
                        </label>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {images.length} file(s) selected
                        </span>
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Posting...' : 'Post Notice'}
                    </button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '480px', overflowY: 'auto' }}>
                {announcements.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0' }}>
                        No notices posted yet.
                    </p>
                ) : (
                    announcements.map((a) => (
                        <div key={a.id} className="announcement-card">
                            <div className="announcement-meta">
                                <span className="badge badge-pending" style={{ textTransform: 'none', background: 'var(--primary-glow)', color: 'var(--primary-hover)', border: 'none' }}>
                                    {a.category}
                                </span>
                                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                            </div>
                            {editingId === a.id ? (
                                <form onSubmit={(e) => handleUpdate(e, a.id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '8px 0' }}>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        value={editTitle} 
                                        onChange={(e) => setEditTitle(e.target.value)} 
                                        required 
                                    />
                                    <select 
                                        className="glass-input" 
                                        value={editCategory} 
                                        onChange={(e) => setEditCategory(e.target.value)}
                                    >
                                        <option value="Notice">Notice</option>
                                        <option value="Event">Event</option>
                                        <option value="Mess">Mess Update</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Urgent">Urgent Notice</option>
                                    </select>
                                    <textarea 
                                        className="glass-input" 
                                        rows="3" 
                                        value={editContent} 
                                        onChange={(e) => setEditContent(e.target.value)} 
                                        required 
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Save</button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {a.title}
                                        {a.isPinned && <Pin size={16} color="var(--primary)" fill="var(--primary)" style={{ flexShrink: 0 }} />}
                                    </h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{a.content}</p>
                                  </>
                            )}
                            
                            {a.images && a.images.length > 0 && (
                                <div className="image-previews" style={{ marginTop: '10px' }}>
                                    {a.images.map((img, idx) => (
                                        <img 
                                            key={idx}
                                            src={`http://localhost:3000/${img}`} 
                                            alt="Notice media" 
                                            className="image-thumb"
                                            onClick={() => window.open(`http://localhost:3000/${img}`)}
                                        />
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    By: {a.createdBy?.name || 'Warden'} ({a.createdBy?.hostel || 'Hostel'})
                                </span>
                                {user?.role === 'warden' && (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button 
                                            onClick={() => handleTogglePin(a.id)}
                                            style={{ background: 'none', border: 'none', color: a.isPinned ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}
                                            title={a.isPinned ? "Unpin notice" : "Pin notice"}
                                        >
                                            {a.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(a)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            title="Edit notice"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(a.id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                            title="Delete notice"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NoticeBoard;
