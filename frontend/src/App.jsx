import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginRegister from './components/LoginRegister';
import StudentDashboard from './components/StudentDashboard';
import WardenDashboard from './components/WardenDashboard';
import ComplaintDetails from './components/ComplaintDetails';
import Profile from './components/Profile';
import RaiseComplaint from './components/RaiseComplaint';
import NoticesPage from './components/NoticesPage';
import './App.css';

// Route guards
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading session...</div>;
    return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading session...</div>;
    return !user ? children : <Navigate to="/" replace />;
};

const DashboardSelector = () => {
    const { user } = useAuth();
    return user.role === 'warden' ? <WardenDashboard /> : <StudentDashboard />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <Navbar />
                    <main className="main-content">
                        <Routes>
                            {/* Public Route */}
                            <Route 
                                path="/login" 
                                element={
                                    <PublicRoute>
                                        <LoginRegister />
                                    </PublicRoute>
                                } 
                            />

                            {/* Private Routes */}
                            <Route 
                                path="/" 
                                element={
                                    <PrivateRoute>
                                        <DashboardSelector />
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/complaint/:id" 
                                element={
                                    <PrivateRoute>
                                        <ComplaintDetails />
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/profile" 
                                element={
                                    <PrivateRoute>
                                        <Profile />
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/raise-complaint" 
                                element={
                                    <PrivateRoute>
                                        <RaiseComplaint />
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/notices" 
                                element={
                                    <PrivateRoute>
                                        <NoticesPage />
                                    </PrivateRoute>
                                } 
                            />

                            {/* Catch-all */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
