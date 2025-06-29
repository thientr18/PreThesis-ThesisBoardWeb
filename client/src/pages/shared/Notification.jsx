import { useLocation, useNavigate } from "react-router-dom";

const Notification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const notification = location.state?.notification;

    if (!notification) {
        return (
            <div>
                <p>No notification data available</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="notification-page">
            <button onClick={() => navigate(-1)}>← Back</button>
            <h1>{notification.title}</h1>
            <p>{notification.message}</p>
            <small>Read: {notification.isRead ? "Yes" : "No"}</small>
        </div>
    );
};

export default Notification;