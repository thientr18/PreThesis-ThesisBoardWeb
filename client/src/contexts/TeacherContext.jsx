import { createContext, useState, useEffect, useContext } from "react";
import api from "@/utils/axios";

const TeacherContext = createContext();

export const TeacherProvider = ({ children }) => {
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeacher = async () => {
            try {
                const response = await api.get("/teacher/profile");
                setTeacher(response.data);
            } catch (error) {
                console.error("Error fetching teacher data:", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeacher();
    }, []);

    const isActiveTeacher = teacher?.status === "active";
    
    return (
        <TeacherContext.Provider value={{ teacher, loading, error, isActiveTeacher }}>
            {children}
        </TeacherContext.Provider>
    );
}

export const useTeacher = () => useContext(TeacherContext);