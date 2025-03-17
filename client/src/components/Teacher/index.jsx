import style from './style.css';
import axios from "axios";

const Main = () => {
    const handleLogout = async () => {
        await axios.post("http://localhost:8080/api/auth/logout", {}, { withCredentials: true })
        .then(() => {
            localStorage.clear();
            window.location.reload();
        });
        
		localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		window.location.reload();
	};

    return (
        <div className="main_container">
            <nav className="nav_bar">
                <h1>Teacher Dashboard</h1>
                <button className="loggout" onClick={handleLogout}>Logout</button>
            </nav>
        </div>
    )
}

export default Main;