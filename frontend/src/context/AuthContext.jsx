import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const loadUser = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const data = await authService.getProfile();
            if (data.success) {
                setUser(data.data);
                await fetchNotifications();
            } else {
                logout();
            }
        } catch (err) {
            console.error('Error restoring session:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    // Polling notifications periodically
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [user]);

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);
            if (data.success) {
                localStorage.setItem('accessToken', data.accessToken);
                setUser(data.user);
                await fetchNotifications();
                return { success: true };
            }
        } catch (err) {
            const errors = err.response?.data?.errors;
            const message = errors 
                ? errors.map(e => `${e.field}: ${e.message}`).join(', ')
                : err.response?.data?.message || 'Login failed. Please check credentials.';
            return {
                success: false,
                message
            };
        }
    };

    const register = async (formData) => {
        try {
            const data = await authService.signup(formData);
            if (data.success) {
                localStorage.setItem('accessToken', data.accessToken);
                setUser(data.user);
                return { success: true };
            }
        } catch (err) {
            const errors = err.response?.data?.errors;
            const message = errors 
                ? errors.map(e => `${e.field}: ${e.message}`).join(', ')
                : err.response?.data?.message || 'Registration failed.';
            return {
                success: false,
                message
            };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error('Logout error on backend:', err);
        } finally {
            localStorage.removeItem('accessToken');
            setUser(null);
            setNotifications([]);
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const data = await authService.updateProfile(profileData);
            if (data.success) {
                setUser(data.user);
                return { success: true };
            }
        } catch (err) {
            const errors = err.response?.data?.errors;
            const message = errors 
                ? errors.map(e => `${e.field}: ${e.message}`).join(', ')
                : err.response?.data?.message || 'Profile update failed.';
            return {
                success: false,
                message
            };
        }
    };

    const markNotificationRead = async (id) => {
        try {
            const data = await notificationService.markAsRead(id);
            if (data.success) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllNotificationsRead = async () => {
        try {
            const data = await notificationService.markAllAsRead();
            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            notifications,
            login,
            register,
            logout,
            updateProfile,
            fetchNotifications,
            markNotificationRead,
            markAllNotificationsRead,
            reloadUser: loadUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
