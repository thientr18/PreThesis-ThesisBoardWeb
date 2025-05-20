import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axios";

export default function AnnouncementDropdown() {
    const [announcements, setAnnouncements] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await api.get('/student/announcements');
                const data = Array.isArray(response.data.announcements)
                    ? response.data.announcements
                    : [];
                setAnnouncements(data);
            } catch (error) {
                console.error('Error fetching announcements:', error);
                setAnnouncements([]);
            }
        };
        fetchAnnouncements();
    }, []);

    const handleClick = (id) => {
        navigate(`/student/announcements/${id}`);
    };

    return (
        <div className="announcement-dropdown">
            {announcements.length === 0 ? (
                <div className="empty-message">No announcements</div>
            ) : (
                announcements.map((announcement) => (
                    <div
                        key={announcement.id}
                        className="announcement-item"
                        onClick={() => handleClick(announcement.id)}
                    >
                        <div className="announcement-title">
                        {announcement.Announcement?.title || "No Title"}
                        </div>
                        <div className="announcement-snippet">
                        {announcement.Announcement?.content
                            ? (announcement.Announcement.content.length > 60
                                ? announcement.Announcement.content.slice(0, 60) + "..."
                                : announcement.Announcement.content)
                            : "No Content"}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}