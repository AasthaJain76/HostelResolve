import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Home, LogIn, UserPlus } from 'lucide-react';

const LoginRegister = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('student');
    const [hostel, setHostel] = useState('Hostel A');
    const [room, setRoom] = useState('');
    const [phone, setPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isLogin) {
            const res = await login(email, password);
            setLoading(false);
            if (res.success) {
                showToast('Welcome back!');
                navigate('/');
            } else {
                setError(res.message);
            }
        } else {
            const res = await register({
                name,
                email,
                password,
                role,
                hostel,
                room,
                phone
            });
            setLoading(false);
            if (res.success) {
                showToast('Registration successful!');
                navigate('/');
            } else {
                setError(res.message);
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center', color: 'var(--text-main)' }}>
                    {isLogin ? 'Welcome back to HostelResolve' : 'Create an Account'}
                </h2>

                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {!isLogin && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Name</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <User size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    style={{ paddingLeft: '44px', width: '100%' }}
                                    placeholder="John Doe" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email Address</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                            <input 
                                type="email" 
                                className="glass-input" 
                                style={{ paddingLeft: '44px', width: '100%' }}
                                placeholder="name@domain.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                            <input 
                                type="password" 
                                className="glass-input" 
                                style={{ paddingLeft: '44px', width: '100%' }}
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone Number</label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Phone size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                                        <input 
                                            type="tel" 
                                            className="glass-input" 
                                            style={{ paddingLeft: '44px', width: '100%' }}
                                            placeholder="10-digit number" 
                                            value={phone} 
                                            onChange={(e) => setPhone(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hostel Block</label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Home size={16} style={{ position: 'absolute', left: '16px' }} color="var(--text-muted)" />
                                        <select 
                                            className="glass-input" 
                                            style={{ paddingLeft: '44px', width: '100%' }}
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
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Room Number</label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        placeholder="Room 101" 
                                        value={room} 
                                        onChange={(e) => setRoom(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '10px' }} disabled={loading}>
                        {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                        {loading ? 'Processing...' : (isLogin ? 'Login to Dashboard' : 'Register Account')}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {isLogin ? (
                            <span>
                                Don't have an account?{' '}
                                <button 
                                    type="button" 
                                    onClick={() => { setIsLogin(false); setError(''); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Create one
                                </button>
                            </span>
                        ) : (
                            <span>
                                Already have an account?{' '}
                                <button 
                                    type="button" 
                                    onClick={() => { setIsLogin(true); setError(''); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Sign In
                                </button>
                            </span>
                        )}
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

export default LoginRegister;
