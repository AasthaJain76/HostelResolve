import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Save, ArrowLeft } from 'lucide-react';
import authService from '../services/authService';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing password reset token.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await authService.resetPassword(token, newPassword);
            setLoading(false);
            if (res.success) {
                showToast('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2500);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to reset password.');
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card" style={{ maxWidth: '460px', width: '100%' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', textAlign: 'center', color: 'var(--text-main)' }}>
                    Set New Password
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center', lineHeight: '1.5' }}>
                    Please enter your new password below to secure your account.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>New Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                            <input 
                                type="password" 
                                className="glass-input" 
                                style={{ paddingLeft: '44px', width: '100%' }}
                                placeholder="••••••••" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                required 
                                disabled={!token}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Confirm Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                            <input 
                                type="password" 
                                className="glass-input" 
                                style={{ paddingLeft: '44px', width: '100%' }}
                                placeholder="••••••••" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                disabled={!token}
                            />
                        </div>
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '10px' }} disabled={loading || !token}>
                        <Save size={18} />
                        {loading ? 'Resetting...' : 'Save Password'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <button 
                            type="button" 
                            onClick={() => navigate('/login')}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', width: '100%' }}
                        >
                            <ArrowLeft size={16} /> Back to Sign In
                        </button>
                    </div>
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

export default ResetPassword;
