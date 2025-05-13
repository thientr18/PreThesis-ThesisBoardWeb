import React, { useEffect, useState } from 'react';
import api from '../../utils/axios';

export default function GlobalAnnouncement() {
    const [announcement, setAnnouncement] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchAnnouncement = async () => {
        try {
            const response = await api.get('/admin/announcement');
            setAnnouncement(response.data.announcement);
        } catch (err) {
            setError('Failed to fetch announcement');
        } finally {
            setLoading(false);
        }
        };
    
        fetchAnnouncement();
    }, []);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    
    return (
        <div>
        <h1>Global Announcement</h1>
        <p>{announcement}</p>
        </div>
    );
}