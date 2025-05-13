import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '@/utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const accessToken = localStorage.getItem("accessToken");

            if (!accessToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('/api/auth/user', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                });

                if (response.status === 200) {
                    setUser(response.data.user);
                    setError(null);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (savedUser) {
            setUser(savedUser);
        }

        fetchUser();
    }, []);

    const login = (userData) => {
        const user = userData.user;
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", userData.accessToken);
        setError(null);
    };

    const logout = () => {
        const fetchLogout = async () => {
            try {
                await axios.post('/api/auth/logout', {}, { withCredentials: true });
            } catch (error) {
                console.error('Error logging out:', error);
            }
        };

        fetchLogout();

        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        setError(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

// Optional helper hook
export const useAuth = () => useContext(AuthContext);
