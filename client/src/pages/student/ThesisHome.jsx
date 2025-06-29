import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";
import { formatDateToVietnam, isDeadlinePassed } from "@/utils/dateUtils";

const ThesisHome = () => {
    const { semesterId } = useParams();
    const { student, loading } = useStudent();
    const [thesis, setThesis] = useState({
        id: null,
        title: '',
        description: '',
        status: '',
        report: null,
        project: null,
        presentation: null,
        demo: null,
        finalGrade: null,
        feedback: null,
        gradedAt: null,
        submissionDeadline: null,
        isSubmissionAllowed: true,
        defenseDate: null,
        supervisor: null,
        reviewer: null,
        committee: [],
        grades: []
    });
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('');
    const [demoUrl, setDemoUrl] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    const fetchThesis = async () => {
        try {
            const response = await api.get(`/student/thesis/${semesterId}`);
            const data = response.data.thesis;
            
            // Process grades and attach them to committee members
            const processedData = {
                ...data,
                title: data.title || '',
                description: data.description || '',
                status: data.status || '',
                report: data.report || null,
                project: data.project || null,
                presentation: data.presentation || null,
                demo: data.demo || null,
                finalGrade: data.finalGrade || null,
                submissionDeadline: data.submissionDeadline || null,
                isSubmissionAllowed: data.isSubmissionAllowed !== false,
                defenseDate: data.defenseDate || null,
                committee: data.committee || [],
                grades: data.grades || []
            };

            // Attach grades to respective committee members
            if (data.grades && data.grades.length > 0) {
                data.grades.forEach(gradeInfo => {
                    const teacherId = gradeInfo.teacher.id;
                    const gradeData = {
                        grade: gradeInfo.grade,
                        feedback: gradeInfo.feedback,
                        gradedAt: gradeInfo.createdAt
                    };

                    // Attach to supervisor
                    if (processedData.supervisor && processedData.supervisor.id === teacherId) {
                        processedData.supervisor = { ...processedData.supervisor, ...gradeData };
                    }

                    // Attach to reviewer
                    if (processedData.reviewer && processedData.reviewer.id === teacherId) {
                        processedData.reviewer = { ...processedData.reviewer, ...gradeData };
                    }

                    // Attach to committee members
                    if (processedData.committee) {
                        processedData.committee = processedData.committee.map(member => {
                            if (member.id === teacherId) {
                                return { ...member, ...gradeData };
                            }
                            return member;
                        });
                    }
                });
            }

            setThesis(processedData);
            setDataLoaded(true);
        } catch (error) {
            console.error("Error fetching thesis data:", error);
        }
    };
    useEffect(() => {
        if (semesterId) {
            fetchThesis();
        }
    }, [semesterId]);

    const getGradeDisplay = (grade) => {
        if (grade === null || grade === undefined) {
            return { text: 'Not graded yet', color: '#6c757d', icon: '⏳' };
        }
        
        const numericGrade = parseFloat(grade);
        if (numericGrade >= 85) {
            return { text: `${grade}/100`, color: '#28a745', icon: '🏆' };
        } else if (numericGrade >= 70) {
            return { text: `${grade}/100`, color: '#17a2b8', icon: '👍' };
        } else if (numericGrade >= 60) {
            return { text: `${grade}/100`, color: '#ffc107', icon: '✓' };
        } else if (numericGrade >= 50) {
            return { text: `${grade}/100`, color: '#fd7e14', icon: '📝' };
        } else {
            return { text: `${grade}/100`, color: '#dc3545', icon: '❌' };
        }
    };

    const getFileName = (filePath) => {
        if (!filePath) return null;
        
        const fileName = filePath.split('/').pop();
        
        // Pattern: thesis-{timestamp}-{originalName}.{extension}
        const match = fileName.match(/^thesis-\d+-\d+-(.*\..+)$/);
        
        if (match) {
            return match[1]; // Returns originalName.extension
        }
        return fileName;
    };
    
    const handleDownload = async (filePath, type) => {
        try {
            // Extract just the filename from the full path
            const fileName = filePath.split('/').pop();
            
            const response = await api.get(`/student/thesis/files/download/${fileName}`, {
                responseType: 'blob'
            });
            
            // Get the original filename for download
            const originalFileName = getFileName(filePath) || fileName;
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalFileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Error downloading ${type}:`, error);
            alert(`Failed to download ${type}.`);
        }
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        
        // Handle different YouTube URL formats
        const regexPatterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
            /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/
        ];
        
        for (const pattern of regexPatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&playsinline=1`;
            }
        }
        
        return null;
    };

    const handleReportSubmission = async (e) => {
        e.preventDefault();
        
        if (!thesis.isSubmissionAllowed) {
            alert('Submission deadline has passed');
            return;
        }
        
        if (!thesis.id) {
            alert('Thesis ID not found');
            return;
        }

        const fileInput = document.getElementById('report-file');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select a report file');
            return;
        }

        // Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('Report file size must be less than 10MB');
            return;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.pdf', '.doc', '.docx'].includes(fileExtension)) {
            alert('Invalid report file type. Allowed: .pdf, .doc, .docx');
            return;
        }

        setUploading(true);
        setUploadType('report');

        try {
            const formData = new FormData();
            formData.append('report', file);

            const response = await api.post(
                `/student/thesis/${thesis.id}/submit-report`,
                formData,
            );

            alert('Report file uploaded successfully!');
            await fetchThesis();
            fileInput.value = '';

        } catch (error) {
            console.error('Error uploading report:', error);
            alert(error.response?.data?.message || 'Failed to upload report');
        } finally {
            setUploading(false);
            setUploadType('');
        }
    };

    const handleProjectSubmission = async (e) => {
        e.preventDefault();
        
        if (!thesis.isSubmissionAllowed) {
            alert('Submission deadline has passed');
            return;
        }
        
        if (!thesis.id) {
            alert('Thesis ID not found');
            return;
        }

        const fileInput = document.getElementById('project-file');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select a project file');
            return;
        }

        // Validate file
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert('Project file size must be less than 50MB');
            return;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.zip', '.rar'].includes(fileExtension)) {
            alert('Invalid project file type. Allowed: .zip, .rar');
            return;
        }

        setUploading(true);
        setUploadType('project');

        try {
            const formData = new FormData();
            formData.append('project', file);

            const response = await api.post(
                `/student/thesis/${thesis.id}/submit-project`,
                formData,
            );

            alert('Project file uploaded successfully!');
            await fetchThesis();
            fileInput.value = '';

        } catch (error) {
            console.error('Error uploading project:', error);
            alert(error.response?.data?.message || 'Failed to upload project');
        } finally {
            setUploading(false);
            setUploadType('');
        }
    };

    const handlePresentationSubmission = async (e) => {
        e.preventDefault();
        
        if (!thesis.isSubmissionAllowed) {
            alert('Submission deadline has passed');
            return;
        }
        
        if (!thesis.id) {
            alert('Thesis ID not found');
            return;
        }

        const fileInput = document.getElementById('presentation-file');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select a presentation file');
            return;
        }

        // Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('Presentation file size must be less than 10MB');
            return;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.pdf', '.ppt', '.pptx'].includes(fileExtension)) {
            alert('Invalid presentation file type. Allowed: .pdf, .ppt, .pptx');
            return;
        }

        setUploading(true);
        setUploadType('presentation');

        try {
            const formData = new FormData();
            formData.append('presentation', file);

            const response = await api.post(
                `/student/thesis/${thesis.id}/submit-presentation`,
                formData,
            );

            alert('Presentation file uploaded successfully!');
            await fetchThesis();
            fileInput.value = '';

        } catch (error) {
            console.error('Error uploading presentation:', error);
            alert(error.response?.data?.message || 'Failed to upload presentation');
        } finally {
            setUploading(false);
            setUploadType('');
        }
    };

    const handleDemoSubmission = async (e) => {
        e.preventDefault();
        
        if (!thesis.isSubmissionAllowed) {
            alert('Submission deadline has passed');
            return;
        }
        
        if (!thesis.id) {
            alert('Thesis ID not found');
            return;
        }

        if (!demoUrl.trim()) {
            alert('Please enter a demo URL');
            return;
        }

        // Validate YouTube URL
        const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+$/i;
        if (!youtubePattern.test(demoUrl.trim())) {
            alert('Please enter a valid YouTube URL');
            return;
        }

        setUploading(true);
        setUploadType('demo');

        try {
            const response = await api.post(
                `/student/thesis/${thesis.id}/submit-demo`,
                { demoUrl: demoUrl.trim() },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            alert('Demo URL submitted successfully!');
            setThesis(prev => ({
                ...prev,
                demo: response.data.demoUrl
            }));
            setDemoUrl('');

        } catch (error) {
            console.error('Error submitting demo URL:', error);
            alert(error.response?.data?.message || 'Failed to submit demo URL');
        } finally {
            setUploading(false);
            setUploadType('');
        }
    };

    const formatDateTime = (dateString) => {    
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return <div className="thesis-home">Loading...</div>;
    }

    if (!thesis) {
        return <div className="thesis-home">No thesis data available.</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>General Information</h1>
            <div className="thesis-info-stack">
                {/* Basic Thesis Details */}
                <div className="thesis-detail-card">
                    <h2 className="thesis-card-title">📋 Thesis Details</h2>
                    <table className="thesis-info-table">
                        <tbody>
                            <tr>
                                <td className="table-label">Title:</td>
                                <td className="table-value">{thesis.title}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Description:</td>
                                <td className="table-value">{thesis.description}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Status:</td>
                                <td className="table-value">{thesis.status}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Defense Date:</td>
                                <td className="table-value">
                                    {thesis.defenseDate ? (
                                        <span style={{ color: "#28a745" }}>📅 {formatDateTime(thesis.defenseDate)}</span>
                                    ) : (
                                        <span style={{ color: "#6c757d" }}>⏳ Not scheduled yet</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">Report (Required):</td>
                                <td className="table-value">
                                    {thesis.report ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">Project File (Required):</td>
                                <td className="table-value">
                                    {thesis.project ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">Presentation (Required):</td>
                                <td className="table-value">
                                    {thesis.presentation ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">Demo (Optional):</td>
                                <td className="table-value">
                                    {thesis.demo ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#6c757d" }}>Not submitted</span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Combined Committee & Grades Section */}
            <h1>Committee Members & Evaluation</h1>
            <div className="thesis-grade-card">
                <h2 className="thesis-card-title">🏛️ Thesis Committee & Grades</h2>
                
                {/* Final Grade Display */}
                <div className="final-grade-section">
                    <div className="final-grade-card">
                        <h3>🎯 Final Grade</h3>
                        <div className="final-grade-display">
                            <span 
                                className="final-grade-value" 
                                style={{ color: getGradeDisplay(thesis.finalGrade).color }}
                            >
                                {getGradeDisplay(thesis.finalGrade).icon} {getGradeDisplay(thesis.finalGrade).text}
                            </span>
                            {thesis.gradedAt && (
                                <small className="grade-date">
                                    Last updated: {formatDateTime(thesis.gradedAt)}
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* Committee Members with Grades */}
                {(thesis.supervisor || thesis.reviewer || (thesis.committee && thesis.committee.length > 0)) ? (
                    <div className="committee-grades-section">
                        <h4 className="section-title">👥 Committee Members & Individual Grades</h4>
                        <div className="committee-grades-grid">
                            
                            {/* Supervisor Card */}
                            {thesis.supervisor && (
                                <div className="committee-grade-card supervisor">
                                    <div className="committee-member-header">
                                        <span className="member-role-icon">👨‍🏫</span>
                                        <div className="member-role-info">
                                            <h5 className="member-role-title">Supervisor</h5>
                                            <p className="member-name">{thesis.supervisor.fullName || `${thesis.supervisor.firstName} ${thesis.supervisor.lastName}`}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="member-contact-info">
                                        <div className="contact-item">
                                            <span className="contact-icon">📧</span>
                                            <span className="contact-value">{thesis.supervisor.email}</span>
                                        </div>
                                        {thesis.supervisor.phone && (
                                            <div className="contact-item">
                                                <span className="contact-icon">📞</span>
                                                <span className="contact-value">{thesis.supervisor.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="member-grade-section">
                                        <div className="grade-header">
                                            <h6>📊 Grade</h6>
                                        </div>
                                        <div className="grade-display">
                                            <span 
                                                className="grade-value"
                                                style={{ color: getGradeDisplay(thesis.supervisor.grade).color }}
                                            >
                                                {getGradeDisplay(thesis.supervisor.grade).text}
                                            </span>
                                            {thesis.supervisor.gradedAt && (
                                                <small className="grade-date">
                                                    Graded: {formatDateTime(thesis.supervisor.gradedAt)}
                                                </small>
                                            )}
                                        </div>
                                        
                                        {thesis.supervisor.feedback && (
                                            <div className="feedback-section">
                                                <h6>💬 Feedback</h6>
                                                <div className="feedback-content">
                                                    <p>{thesis.supervisor.feedback}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {!thesis.supervisor.grade && (
                                            <div className="no-grade-notice">
                                                <p>⏳ Evaluation pending</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reviewer Card */}
                            {thesis.reviewer && (
                                <div className="committee-grade-card reviewer">
                                    <div className="committee-member-header">
                                        <span className="member-role-icon">👨‍💼</span>
                                        <div className="member-role-info">
                                            <h5 className="member-role-title">External Reviewer</h5>
                                            <p className="member-name">{thesis.reviewer.fullName || `${thesis.reviewer.firstName} ${thesis.reviewer.lastName}`}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="member-contact-info">
                                        <div className="contact-item">
                                            <span className="contact-icon">📧</span>
                                            <span className="contact-value">{thesis.reviewer.email}</span>
                                        </div>
                                        {thesis.reviewer.phone && (
                                            <div className="contact-item">
                                                <span className="contact-icon">📞</span>
                                                <span className="contact-value">{thesis.reviewer.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="member-grade-section">
                                        <div className="grade-header">
                                            <h6>📊 Grade</h6>
                                        </div>
                                        <div className="grade-display">
                                            <span 
                                                className="grade-value"
                                                style={{ color: getGradeDisplay(thesis.reviewer.grade).color }}
                                            >
                                                {getGradeDisplay(thesis.reviewer.grade).text}
                                            </span>
                                            {thesis.reviewer.gradedAt && (
                                                <small className="grade-date">
                                                    Graded: {formatDateTime(thesis.reviewer.gradedAt)}
                                                </small>
                                            )}
                                        </div>
                                        
                                        {thesis.reviewer.feedback && (
                                            <div className="feedback-section">
                                                <h6>💬 Feedback</h6>
                                                <div className="feedback-content">
                                                    <p>{thesis.reviewer.feedback}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {!thesis.reviewer.grade && (
                                            <div className="no-grade-notice">
                                                <p>⏳ Evaluation pending</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Committee Members Cards */}
                            {thesis.committee && thesis.committee.length > 0 && thesis.committee.map((member, index) => (
                                <div key={`committee-${member.id || index}`} className="committee-grade-card committee">
                                    <div className="committee-member-header">
                                        <span className="member-role-icon">👥</span>
                                        <div className="member-role-info">
                                            <h5 className="member-role-title">Committee Member {index + 1}</h5>
                                            <p className="member-name">{member.fullName || `${member.firstName} ${member.lastName}`}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="member-contact-info">
                                        <div className="contact-item">
                                            <span className="contact-icon">📧</span>
                                            <span className="contact-value">{member.email}</span>
                                        </div>
                                        {member.phone && (
                                            <div className="contact-item">
                                                <span className="contact-icon">📞</span>
                                                <span className="contact-value">{member.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="member-grade-section">
                                        <div className="grade-header">
                                            <h6>📊 Grade</h6>
                                        </div>
                                        <div className="grade-display">
                                            <span 
                                                className="grade-value"
                                                style={{ color: getGradeDisplay(member.grade).color }}
                                            >
                                                {getGradeDisplay(member.grade).text}
                                            </span>
                                            {member.gradedAt && (
                                                <small className="grade-date">
                                                    Graded: {formatDateTime(member.gradedAt)}
                                                </small>
                                            )}
                                        </div>
                                        
                                        {member.feedback && (
                                            <div className="feedback-section">
                                                <h6>💬 Feedback</h6>
                                                <div className="feedback-content">
                                                    <p>{member.feedback}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {!member.grade && (
                                            <div className="no-grade-notice">
                                                <p>⏳ Evaluation pending</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Updated Grade Statistics */}
                        <div className="grade-statistics">
                            <h5>📈 Grade Summary</h5>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Total Evaluators:</span>
                                    <span className="stat-value">
                                        {(thesis.supervisor ? 1 : 0) + (thesis.reviewer ? 1 : 0) + (thesis.committee ? thesis.committee.length : 0)}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Graded:</span>
                                    <span className="stat-value">
                                        {(thesis.supervisor?.grade ? 1 : 0) + (thesis.reviewer?.grade ? 1 : 0) + (thesis.committee?.filter(m => m.grade).length || 0)} / {(thesis.supervisor ? 1 : 0) + (thesis.reviewer ? 1 : 0) + (thesis.committee ? thesis.committee.length : 0)}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Overall Grade:</span>
                                    <span className="stat-value" style={{ color: getGradeDisplay(thesis.finalGrade).color }}>
                                        {thesis.finalGrade || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="no-committee-message">
                        <div className="info-box">
                            <h4>📋 Committee Assignment Status</h4>
                            <p>🏛️ Your thesis committee has not been fully assigned yet.</p>
                            
                            <div className="assignment-info">
                                <h5>📝 Assignment Process:</h5>
                                <ul>
                                    <li><strong>Step 1:</strong> Supervisor assignment {thesis.supervisor ? '✓ Complete' : '⏳ Pending'}</li>
                                    <li><strong>Step 2:</strong> External reviewer assignment {thesis.reviewer ? '✓ Complete' : '⏳ Pending'}</li>
                                    <li><strong>Step 3:</strong> Committee members assignment {thesis.committee?.length > 0 ? '✓ Complete' : '⏳ Pending'}</li>
                                    <li><strong>Step 4:</strong> Defense scheduling {thesis.defenseDate ? '✓ Scheduled' : '⏳ Pending'}</li>
                                </ul>
                            </div>
                            
                            <div className="next-steps">
                                <h5>🔄 What happens next:</h5>
                                <ul>
                                    <li>Your supervisor will coordinate the committee assignment</li>
                                    <li>You'll be notified when committee members are assigned</li>
                                    <li>Grading will begin after all materials are submitted</li>
                                    <li>Defense date will be scheduled once committee is complete</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div><br /><br />
            
            <h1>Submission</h1>
            <div className="thesis-submission-card">
                {/* Deadline Information */}
                {thesis.submissionDeadline && (
                    <div className={`deadline-info ${!thesis.isSubmissionAllowed ? 'deadline-passed' : ''}`}>
                        <h4>📅 Submission Deadline</h4>
                        <p>
                            <strong>Deadline: </strong>
                            {formatDateToVietnam(thesis.submissionDeadline)} (Vietnam Time)
                        </p>
                        {!thesis.isSubmissionAllowed && (
                            <div className="deadline-warning">
                                <p><strong>⚠️ SUBMISSION DEADLINE HAS PASSED</strong></p>
                                <p>You can no longer submit or modify your thesis materials.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Submission Guidelines */}
                <div className="submission-guidelines">
                    <h4>Submission Guidelines:</h4>
                    <ul>
                        <li><strong>MANDATORY:</strong> Report must be submitted in PDF format (max 10MB)</li>
                        <li><strong>MANDATORY:</strong> Project file must be submitted as compressed files (ZIP, RAR) (max 50MB)</li>
                        <li><strong>MANDATORY:</strong> Presentation must be submitted as PDF or PowerPoint files (max 10MB)</li>
                        <li><strong>OPTIONAL:</strong> Demo video must be a YouTube URL only</li>
                        <li><strong style={{color: "#dc3545"}}>⚠️ WARNING: You will receive ZERO marks for thesis if you don't submit all required files before the deadline</strong></li>
                        <li>You can resubmit files multiple times until the deadline</li>
                        <li>Contact your supervisor if you encounter any issues</li>
                    </ul>
                </div>

                {/* Report Submission */}
                <div className="submission-section">
                    <h3 className="submission-type-title">Report Submission</h3>
                    <form onSubmit={handleReportSubmission} className="submission-form">
                        <div className="file-input-row">
                            <div className="file-input-group">
                                <label htmlFor="report-file" className="file-label">
                                    Choose Report File (PDF):
                                </label>
                                <input
                                    type="file"
                                    id="report-file"
                                    name="file"
                                    accept=".pdf"
                                    className="file-input"
                                    disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'report')}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.report ? 'resubmit' : 'initial'}`}
                                disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'report')}
                            >
                                {uploading && uploadType === 'report' ? (
                                    <span>
                                        <span className="spinner"></span>
                                        Uploading...
                                    </span>
                                ) : (
                                    thesis.report ? 'Resubmit Report' : 'Submit Report'
                                )}
                            </button>
                        </div>
                    </form>
                    {thesis.report && (
                        <div className="submission-status">
                            <div className="file-status-container">
                                <span className="status-text">
                                    ✓ Report submitted: <span className="file-name">{getFileName(thesis.report)}</span>
                                </span>
                                <button 
                                    className="download-btn"
                                    onClick={() => handleDownload(thesis.report, 'report')}
                                    title="Download report file"
                                >
                                    📄 Download Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Project File Submission */}
                <div className="submission-section">
                    <h3 className="submission-type-title">Project File Submission</h3>
                    <form onSubmit={handleProjectSubmission} className="submission-form">
                        <div className="file-input-row">
                            <div className="file-input-group">
                                <label htmlFor="project-file" className="file-label">
                                    Choose Project File (ZIP/RAR):
                                </label>
                                <input
                                    type="file"
                                    id="project-file"
                                    name="file"
                                    accept=".zip,.rar"
                                    className="file-input"
                                    disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'project')}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.project ? 'resubmit' : 'initial'}`}
                                disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'project')}
                            >
                                {uploading && uploadType === 'project' ? (
                                    <span>
                                        <span className="spinner"></span>
                                        Uploading...
                                    </span>
                                ) : (
                                    thesis.project ? 'Resubmit Project File' : 'Submit Project File'
                                )}
                            </button>
                        </div>
                    </form>
                    {thesis.project && (
                        <div className="submission-status">
                            <div className="file-status-container">
                                <span className="status-text">
                                    ✓ Project file submitted: <span className="file-name">{getFileName(thesis.project)}</span>
                                </span>
                                <button 
                                    className="download-btn"
                                    onClick={() => handleDownload(thesis.project, 'project')}
                                    title="Download project file"
                                >
                                    📁 Download Project
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Presentation Submission */}
                <div className="submission-section">
                    <h3 className="submission-type-title">Presentation Submission</h3>
                    <form onSubmit={handlePresentationSubmission} className="submission-form">
                        <div className="file-input-row">
                            <div className="file-input-group">
                                <label htmlFor="presentation-file" className="file-label">
                                    Choose Presentation File (PDF/PPT/PPTX):
                                </label>
                                <input
                                    type="file"
                                    id="presentation-file"
                                    name="file"
                                    accept=".pdf,.ppt,.pptx"
                                    className="file-input"
                                    disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'presentation')}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.presentation ? 'resubmit' : 'initial'}`}
                                disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'presentation')}
                            >
                                {uploading && uploadType === 'presentation' ? (
                                    <span>
                                        <span className="spinner"></span>
                                        Uploading...
                                    </span>
                                ) : (
                                    thesis.presentation ? 'Resubmit Presentation' : 'Submit Presentation'
                                )}
                            </button>
                        </div>
                    </form>
                    {thesis.presentation && (
                        <div className="submission-status">
                            <div className="file-status-container">
                                <span className="status-text">
                                    ✓ Presentation submitted: <span className="file-name">{getFileName(thesis.presentation)}</span>
                                </span>
                                <button 
                                    className="download-btn"
                                    onClick={() => handleDownload(thesis.presentation, 'presentation')}
                                    title="Download presentation file"
                                >
                                    📊 Download Presentation
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Demo URL Submission */}
                <div className="submission-section">
                    <h3 className="submission-type-title">Demo Submission</h3>
                    <form onSubmit={handleDemoSubmission} className="submission-form">
                        <div className="file-input-row">
                            <div className="file-input-group">
                                <label htmlFor="demo-url" className="file-label">
                                    Enter YouTube URL - Optional:
                                </label>
                                <input
                                    type="url"
                                    id="demo-url"
                                    name="demoUrl"
                                    value={demoUrl}
                                    onChange={(e) => setDemoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                    className="url-input"
                                    disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'demo')}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.demo ? 'resubmit' : 'initial'}`}
                                disabled={!thesis.isSubmissionAllowed || (uploading && uploadType === 'demo')}
                            >
                                {uploading && uploadType === 'demo' ? (
                                    <span>
                                        <span className="spinner"></span>
                                        Uploading...
                                    </span>
                                ) : (
                                    thesis.demo ? 'Resubmit YouTube URL' : 'Submit YouTube URL'
                                )}
                            </button>
                        </div>
                    </form>
                    {thesis.demo && (
                        <div className="submission-status">
                            <div className="video-submission-container">
                                <span className="status-text">
                                    ✓ Demo submitted:
                                </span>
                                <a 
                                    href={thesis.demo} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="video-link"
                                    title="Open video in new tab"
                                >
                                    🎥 Open in YouTube
                                </a>
                            </div>
                            
                            {/* Enhanced Privacy YouTube Video */}
                            <div className="embedded-video-container">
                                <h4 className="video-title">Demo Video Preview:</h4>
                                <div className="video-wrapper">
                                    <iframe
                                        src={getYouTubeEmbedUrl(thesis.demo)}
                                        title="Thesis Demo Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="youtube-iframe"
                                        loading="lazy"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ThesisHome;