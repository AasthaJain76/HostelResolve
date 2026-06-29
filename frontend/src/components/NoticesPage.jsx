import React from 'react';
import { useNavigate } from 'react-router-dom';
import NoticeBoard from './NoticeBoard';
import { ArrowLeft } from 'lucide-react';

const NoticesPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px 16px' }}>
                    <ArrowLeft size={18} />
                    Back
                </button>
                <div>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Notice Board</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Stay updated with the latest hostel news and updates</p>
                </div>
            </div>

            <NoticeBoard />
        </div>
    );
};

export default NoticesPage;
