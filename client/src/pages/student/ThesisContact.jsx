import React, { useState, useEffect } from "react";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";

const ThesisContact = () => {
    const { student, loading } = useStudent();
    const [thesisContacts, setThesisContacts] = useState([]);
    const [error, setError] = useState(null);
    const [loadingThesisContact, setLoadingThesisContact] = useState(true);
    const activeStudent = student?.status === 'active';
    // activeStudent === false => Unauthorized
    
    useEffect(() => {
        const fetchThesisContact = async () => {
            try {
                const response = await api.get('/student/thesis/contact-supervisor');
                setThesisContacts(response.data.teacher);
            } catch (err) {
                setThesisContacts([]);
                setError(err.response?.data?.message || "An error occurred while fetching thesis contact.");
                console.error("Error fetching thesis contact:", err);
            } finally {
                setLoadingThesisContact(false);
            }
        };

        fetchThesisContact();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }
    return (
        <div>
            {loadingThesisContact && <p>Loading Thesis Contact...</p>}
            {error && <p>{error}</p>}
            {thesisContacts.length === 0 && !loadingThesisContact && (
                <div>No Teacher to Contact</div>
            )}
            {thesisContacts.length > 0 && (
                <div className="contact-supervisor">
                    <h1>Thesis Supervisor Contact</h1>
                    <p>Student contacts to your Supervisor for your Thesis!</p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Available Slots</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thesisContacts.map((contact, index) => (
                                <tr key={contact.id || index}>
                                    <td>{index + 1}</td>
                                    <td>{contact.teacher.fullName}</td>
                                    <td>{contact.teacher.email}</td>
                                    <td>{contact.teacher.phone}</td>
                                    <td>{contact.remainingThesisSlots > 0 ? contact.remainingThesisSlots : "Closed"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ThesisContact;