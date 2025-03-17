import { useState } from "react";
import axios from "axios";
import "./style.css";

function Login() {
    const [data, setData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = ({ currentTarget: input }) => {
        setData({ ...data, [input.name]: input.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = "http://localhost:8080/api/auth/login";
			const res = await axios.post(url, data, { withCredentials: true });
            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.setItem("refreshToken", res.data.refreshToken);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            window.location = `/${res.data.user.role}`;
        } catch (error) {
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                setError(error.response.data.message);
            }
        }
    };

    return (
        <>
            <div className="login_container">
                <div className="login_form_container">
                    <form className="form_container" onSubmit={handleSubmit}>
                        <h1 className="">Login</h1>
                        <input
                            type="text"
                            name="username"
                            value={data.username}
                            onChange={handleChange}
                            placeholder="Username"
                            required
                            className="input"
                        />
                        <input
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={handleChange}
                            placeholder="Password"
                            required
                            className="input"
                        />
                        {error && <div className="style.error_msg">{error}</div>}
                        <button type="submit" className="login_btn">
                            Log In
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Login;