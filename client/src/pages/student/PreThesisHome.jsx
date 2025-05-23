import React, { useState, useEffect } from "react";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";

const PreThesisHome = () => {
    const { student, loading } = useStudent();
    const [error, setError] = useState(null);
    const [teacher, setTeacher] = useState([]);
    const [loadingTeacher, setLoadingTeacher] = useState(true);
    const [preThesis, setPreThesis] = useState('');

    useEffect(() => {
        const fetchPreThesis = async () => {
            try {
                const response = await api.get(`/student/pre-thesis:${student?.student.id}`);
                setPreThesis(response.data.preThesis);
            } catch (err) {
                setError(err.response?.data?.message || "An error occurred while fetching pre-thesis.");
                console.error("Error fetching pre-thesis:", err);
            } finally {
                setLoadingTeacher(false);
            }
        };

        fetchPreThesis();
    }, []);

    
}

export default PreThesisHome;