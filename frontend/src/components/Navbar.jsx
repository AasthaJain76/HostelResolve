import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Sun, Moon, User, LayoutDashboard, Calendar } from 'lucide-react';

const Navbar = () => {
    const { user, logout, notifications, markNotificationRead, markAllNotificationsRead } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [theme, setTheme] = useState('dark');
    const navigate = useNavigate();
    const notificationRef = useRef(null);

    const handleThemeToggle = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
    };

    const handleNotificationClick = (n) => {
        markNotificationRead(n.id);
        setShowNotifications(false);
        if (n.type === 'new_notice') {
            navigate('/notices');
        } else if (n.complaintId) {
            navigate(`/complaint/${n.complaintId}`);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <nav className="navbar">
            <div className="nav-brand" onClick={() => navigate('/')}>
                <span>HostelResolve</span>
            </div>

            <div className="nav-actions">
                <button className="notification-bell" onClick={handleThemeToggle} title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {user && (
                    <>
                        <Link to="/" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/leaves" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                            <Calendar size={18} />
                            <span>Leaves</span>
                        </Link>
                        <Link to="/profile" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                            <User size={18} />
                            <span>Profile</span>
                        </Link>

                        <div style={{ position: 'relative' }} ref={notificationRef}>
                            <button className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            </button>

                            {showNotifications && (
                                <div className="notification-panel glass-panel">
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={markAllNotificationsRead} 
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                                                    onClick={() => handleNotificationClick(n)}
                                                >
                                                    <p>{n.message}</p>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {new Date(n.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="nav-user">
                            <span>Welcome, <strong>{user.name}</strong> <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>({user.role})</span></span>
                        </div>

                        <button className="btn btn-danger" onClick={() => { logout(); navigate('/login'); }} style={{ padding: '8px 16px' }}>
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
