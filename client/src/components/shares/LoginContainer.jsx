import React, { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logoBanner from "../../assets/logo-banner.svg";
import axios from "@/utils/axios";

const LoginContainer = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("/api/auth/login", formData, {
        withCredentials: true,
      });
      
      const userData = response.data;

      login(userData);

      userData.user.role === "student" ? navigate("/") : navigate(`/${userData.user.role}`);
    } catch (err) {
      setError(err.message);
    }
  }
  
  return (
    <div className="login">
      <div className="div">
        <img className="login-banner" alt="Login Banner" src={logoBanner} />

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="rightside">
            <div className="text-wrapper-welcome">Welcome!</div>

            <div className="username">
              <input className="input" placeholder="Username" type="text" name="username" value={formData.username} onChange={handleChange} required />
            </div>

            <div className="password">
              <input className="input" placeholder="Password" type="password" name="password" value={formData.password} onChange={handleChange} required/>
            </div>

            <div className="div-wrapper">
              <input className="submit pointer" type="submit" value="Login" />
            </div>

            {error && <div className="error-message">Invalid Username or Password</div>}

            <div className="forget">
              <input className="text-wrapper pointer" type="button" value="Forget Password?" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginContainer;