import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Home, Mail, Save, Edit, Shield, Hash, X } from 'lucide-react';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [hostel, setHostel] = useState(user?.hostel || 'Hostel A');
    const [room, setRoom] = useState(user?.room || '');
    
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await updateProfile({ name, phone, hostel, room });
        setSubmitting(false);

        if (res.success) {
            showToast('Profile updated successfully!');
            setIsEditing(false);
        } else {
            showToast(res.message, 'error');
        }
    };

    const handleCancel = () => {
        // Reset states
        setName(user?.name || '');
        setPhone(user?.phone || '');
        setHostel(user?.hostel || 'Hostel A');
        setRoom(user?.room || '');
        setIsEditing(false);
    };

    return (
        <div className="auth-container" style={{ minHeight: '60vh' }}>
            <div className="glass-panel auth-card" style={{ maxWidth: '540px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '1.3rem' }}>
                    <User size={24} color="var(--primary)" />
                    {isEditing ? 'Edit Profile Details' : 'My Account Profile'}
                </h3>

                {!isEditing ? (
                    /* Read-Only Profile View */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <Mail size={18} color="var(--text-muted)" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</span>
                                <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{user?.email}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <User size={18} color="var(--text-muted)" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</span>
                                <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{user?.name}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <Phone size={18} color="var(--text-muted)" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</span>
                                <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{user?.phone || 'Not provided'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Home size={18} color="var(--text-muted)" />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hostel Block</span>
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{user?.hostel}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Hash size={18} color="var(--text-muted)" />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room Number</span>
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Room {user?.room}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px' }}>
                            <Shield size={18} color="var(--text-muted)" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Role</span>
                                <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>{user?.role}</span>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            style={{ padding: '12px', marginTop: '16px' }}
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit size={18} />
                            Edit Profile
                        </button>
                    </div>
                ) : (
                    /* Edit Profile Form */
                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email (Cannot be modified)</label>
                            <div className="glass-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                                <Mail size={16} color="var(--text-muted)" />
                                <span>{user?.email}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Name</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone Number</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Phone size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                                <input 
                                    type="tel" 
                                    className="glass-input" 
                                    style={{ paddingLeft: '44px', width: '100%' }}
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hostel Block</label>
                                <select 
                                    className="glass-input" 
                                    value={hostel} 
                                    onChange={(e) => setHostel(e.target.value)} 
                                    required 
                                >
                                    <option value="Hostel A">Hostel A</option>
                                    <option value="Hostel B">Hostel B</option>
                                    <option value="Hostel C">Hostel C</option>
                                    <option value="Hostel D">Hostel D</option>
                                    <option value="Girls Hostel 1">Girls Hostel 1</option>
                                    <option value="Girls Hostel 2">Girls Hostel 2</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Room No.</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    value={room} 
                                    onChange={(e) => setRoom(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }} disabled={submitting}>
                                <Save size={18} />
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '12px' }} onClick={handleCancel}>
                                <X size={18} />
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default Profile;
