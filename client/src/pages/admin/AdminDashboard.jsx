import React, { useState, useEffect } from "react";
import api from "@/utils/axios";

const AdminDashboard = () => {
  const [data, setData] = useState({
    semester: '',
    totalStudents: 0,
    totalTeachers: 0,
    totalPreThesis: 0,
    totalThesis: 0,
  });
  const [semesterName, setSemesterName] = useState("");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          console.error("No access token found");
          return;
        }

        const response = await api.get("/admin/home");
        
        if (response.status === 200) {
          const { semester, totalStudents, totalTeachers, totalPreThesis, totalThesis } = response.data;
          setData({
            semester,
            totalStudents,
            totalTeachers,
            totalPreThesis,
            totalThesis,
          });
          setSemesterName(semester?.name || "No semester available");
        } else {
          console.error("Failed to fetch data from the server.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Semester Box */}
      <div className="semester-box">
        <span className="label">Active Semester:</span>
        <span className="value">{semesterName}</span>
      </div>
      {/* Dashboard Cards */}
      <div className="dashboard-grid">
        <div className="dashboard-card blue">
          <img src="/total-students.svg" alt="Student icon" />
          <div className="value">{data.totalStudents}</div>
          <div className="label">Total Students</div>
        </div>

        <div className="dashboard-card white">
          <img src="/total-teachers.svg" alt="Teacher icon" />
          <div className="value">{data.totalTeachers}</div>
          <div className="label">Total Teachers</div>
        </div>

        <div className="dashboard-card blue">
          <img src="/total-prethesis.svg" alt="Pre-thesis icon" />
          <div className="value">{data.totalPreThesis}</div>
          <div className="label">Total Pre-Thesis</div>
        </div>

        <div className="dashboard-card white">
          <img src="/total-thesis.svg" alt="Thesis icon" />
          <div className="value">{data.totalThesis}</div>
          <div className="label">Total Thesis</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;