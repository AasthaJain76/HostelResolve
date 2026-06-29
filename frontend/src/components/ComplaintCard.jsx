import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, Home, AlertCircle } from 'lucide-react';

const ComplaintCard = ({ complaint }) => {
    const { id, title, description, category, priority, status, hostel, room, createdAt, _count } = complaint;

    return (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `4px solid var(--border-${status.toLowerCase()})` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-pending" style={{ textTransform: 'none', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                    {category}
                </span>
                <div>
                    <span className={`badge badge-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>
                    <span className={`prio-badge prio-${priority}`}>{priority}</span>
                </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>
                <Link to={`/complaint/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {title}
                </Link>
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px', lineHeight: '1.4' }}>
                {description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Home size={14} />
                    {hostel} - Room {room}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} />
                    {new Date(createdAt).toLocaleDateString()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={14} />
                    {_count?.comments || 0} comment(s)
                </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <Link to={`/complaint/${id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    View details
                </Link>
            </div>
        </div>
    );
};

export default ComplaintCard;
