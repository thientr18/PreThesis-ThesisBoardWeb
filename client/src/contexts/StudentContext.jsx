import { createContext, useState, useEffect, useContext, use } from "react";
import api from "@/utils/axios";

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
    const [student, setStudent] = useState(null);
    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await api.get("/student/profile");
                setStudent(response.data.student);
                setSemesters(response.data.semesters)
            } catch (error) {
                console.error("Error fetching student data:", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, []);
    return (
        <StudentContext.Provider value={{ student, semesters, loading, error }}>
            {children}
        </StudentContext.Provider>
    );
}

export const useStudent = () => useContext(StudentContext);