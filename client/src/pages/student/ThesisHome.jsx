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
        supervisor: {
            fullName: '',
            email: '',
            phone: ''
        },
        grades: [] // Add grades array to store multiple grades
    });
    const [teacher, setTeacher] = useState({
        fullName: '',
        email: '',
        phone: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('');
    const [demoUrl, setDemoUrl] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    const fetchThesis = async () => {
        try {
            const response = await api.get(`/student/thesis/${semesterId}`);
            const data = response.data.thesis;
            setThesis({
                ...data,
                title: data.title || '',
                description: data.description || '',
                status: data.status || '',
                report: data.report || null,
                project: data.project || null,
                presentation: data.presentation || null,
                demo: data.demo || null,
                finalGrade: data.finalGrade || null,
                feedback: data.feedback || null,
                gradedAt: data.gradedAt || null,
                submissionDeadline: data.submissionDeadline || null,
                isSubmissionAllowed: data.isSubmissionAllowed !== false,
                grades: data.grades || [] // Include all grades
            });

            const supervisor = data.supervisor;
            setTeacher({
                fullName: supervisor?.fullName || '',
                email: supervisor?.email || '',
                phone: supervisor?.phone || ''
            });

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
            return { text: `${grade}/100 (Excellent)`, color: '#28a745', icon: '🏆' };
        } else if (numericGrade >= 70) {
            return { text: `${grade}/100 (Good)`, color: '#17a2b8', icon: '👍' };
        } else if (numericGrade >= 60) {
            return { text: `${grade}/100 (Satisfactory)`, color: '#ffc107', icon: '✓' };
        } else if (numericGrade >= 50) {
            return { text: `${grade}/100 (Pass)`, color: '#fd7e14', icon: '📝' };
        } else {
            return { text: `${grade}/100 (Fail)`, color: '#dc3545', icon: '❌' };
        }
    };

    const getGradeTypeIcon = (gradeType) => {
        switch (gradeType) {
            case 'supervisor':
                return '👨‍🏫';
            case 'reviewer':
                return '👨‍💼';
            case 'committee':
                return '👥';
            default:
                return '📝';
        }
    };

    const getGradeTypeLabel = (gradeType) => {
        switch (gradeType) {
            case 'supervisor':
                return 'Supervisor Grade';
            case 'reviewer':
                return 'Reviewer Grade';
            case 'committee':
                return 'Committee Grade';
            default:
                return 'Grade';
        }
    };

    const calculateFinalGrade = () => {
        if (!thesis.grades || thesis.grades.length === 0) {
            return null;
        }

        // If there's a final grade in the thesis record, use it
        if (thesis.finalGrade !== null && thesis.finalGrade !== undefined) {
            return thesis.finalGrade;
        }

        // Otherwise, calculate average of all grades
        const validGrades = thesis.grades.filter(g => g.grade !== null && g.grade !== undefined);
        if (validGrades.length === 0) {
            return null;
        }

        const sum = validGrades.reduce((acc, grade) => acc + parseFloat(grade.grade), 0);
        return (sum / validGrades.length).toFixed(2);
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
            console.log(`Downloading ${type} file from path:`, filePath);
            
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

    if (loading) {
        return <div className="thesis-home">Loading...</div>;
    }

    if (!thesis) {
        return <div className="thesis-home">No thesis data available.</div>;
    }

    const finalGrade = calculateFinalGrade();

    return (
        <div className="dashboard-container">
            <h1>General Information</h1>
            <div className="prethesis-info-stack">
                <div className="prethesis-student-card">
                    <h2 className="prethesis-card-title">Supervisor Info</h2>
                    <table className="prethesis-info-table">
                        <tbody>
                            <tr>
                                <td className="table-label">Full Name:</td>
                                <td className="table-value" style={{ color: "#2096f2" }}>{teacher.fullName}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Email:</td>
                                <td className="table-value" style={{ textTransform: "lowercase" }}>{teacher.email}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Phone:</td>
                                <td className="table-value">{teacher.phone}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="prethesis-detail-card">
                    <h2 className="prethesis-card-title">Thesis Details</h2>
                    <table className="prethesis-info-table">
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

            {/* Grade Section */}
            <h1>Grades & Feedback</h1>
            <div className="prethesis-grade-card">
                <h2 className="prethesis-card-title">Thesis Evaluation</h2>
                <div className="grade-info-container">
                    {/* Final Grade Display */}
                    <div className="grade-display">
                        <div className="grade-header">
                            <h3>Final Grade</h3>
                        </div>
                        <div className="grade-value-container">
                            <span 
                                className="grade-value" 
                                style={{ color: getGradeDisplay(finalGrade).color }}
                            >
                                {getGradeDisplay(finalGrade).icon} {getGradeDisplay(finalGrade).text}
                            </span>
                            {thesis.gradedAt && (
                                <small className="grade-date">
                                    Last updated: {formatDateToVietnam(thesis.gradedAt)}
                                </small>
                            )}
                        </div>
                    </div>
                    
                    {/* Committee Members Information */}
                    <div className="committee-info-section">
                        <h4 className="committee-title">🏛️ Thesis Committee</h4>
                        
                        {/* Check if there are any committee members (reviewer or committee type) */}
                        {thesis.grades && (thesis.grades.find(g => g.gradeType === 'reviewer') || thesis.grades.filter(g => g.gradeType === 'committee').length > 0) ? (
                            <div className="committee-members-grid">
                                {/* Reviewer Info - Show if reviewer has graded */}
                                {thesis.grades.find(g => g.gradeType === 'reviewer') && (
                                    <div className="committee-member-card reviewer">
                                        <div className="member-header">
                                            <span className="member-icon">👨‍💼</span>
                                            <h5>Reviewer</h5>
                                        </div>
                                        <div className="member-info">
                                            <p><strong>{thesis.grades.find(g => g.gradeType === 'reviewer').teacher.fullName}</strong></p>
                                            <p>📧 {thesis.grades.find(g => g.gradeType === 'reviewer').teacher.email}</p>
                                            <p>📞 {thesis.grades.find(g => g.gradeType === 'reviewer').teacher.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Committee Members - Show all committee members who have graded */}
                                {thesis.grades.filter(g => g.gradeType === 'committee').map((committeeGrade, index) => (
                                    <div key={index} className="committee-member-card committee">
                                        <div className="member-header">
                                            <span className="member-icon">👥</span>
                                            <h5>Committee Member {index + 1}</h5>
                                        </div>
                                        <div className="member-info">
                                            <p><strong>{committeeGrade.teacher.fullName}</strong></p>
                                            <p>📧 {committeeGrade.teacher.email}</p>
                                            <p>📞 {committeeGrade.teacher.phone}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-committee-message">
                                <div className="info-box">
                                    <p>🏛️ No additional committee members have been assigned yet.</p>
                                    <p>Your supervisor will coordinate the assignment of reviewer and committee members when your thesis is ready for evaluation.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Individual Grades Display */}
                    {thesis.grades && thesis.grades.length > 0 && (
                        <div className="individual-grades-section">
                            <h4 className="grades-title">📊 Detailed Grades</h4>
                            <div className="grades-grid">
                                {thesis.grades.map((gradeRecord, index) => (
                                    <div key={index} className={`grade-card ${gradeRecord.gradeType}`}>
                                        <div className="grade-card-header">
                                            <span className="grade-type-icon">
                                                {getGradeTypeIcon(gradeRecord.gradeType)}
                                            </span>
                                            <h5 className="grade-type-title">
                                                {getGradeTypeLabel(gradeRecord.gradeType)}
                                            </h5>
                                        </div>
                                        <div className="grade-card-content">
                                            <div className="grade-value-display">
                                                <span 
                                                    className="individual-grade-value"
                                                    style={{ color: getGradeDisplay(gradeRecord.grade).color }}
                                                >
                                                    {getGradeDisplay(gradeRecord.grade).text}
                                                </span>
                                            </div>
                                            {gradeRecord.teacher && (
                                                <div className="grader-info">
                                                    <div className="grader-details">
                                                        <h6>👤 Graded by:</h6>
                                                        <p><strong>{gradeRecord.teacher.fullName}</strong></p>
                                                        <p>📧 {gradeRecord.teacher.email}</p>
                                                        <p>📞 {gradeRecord.teacher.phone}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {gradeRecord.feedback && (
                                                <div className="individual-feedback">
                                                    <h6>💬 Feedback:</h6>
                                                    <div className="feedback-content">
                                                        <p>{gradeRecord.feedback}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grade-date">
                                                <small>
                                                    📅 Graded: {formatDateToVietnam(gradeRecord.createdAt)}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Grade Statistics */}
                            <div className="grade-statistics">
                                <h5>📈 Grade Summary</h5>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Grades:</span>
                                        <span className="stat-value">{thesis.grades.length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Average Grade:</span>
                                        <span className="stat-value" style={{ color: getGradeDisplay(finalGrade).color }}>
                                            {finalGrade || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Highest Grade:</span>
                                        <span className="stat-value" style={{ color: '#28a745' }}>
                                            {thesis.grades.length > 0 ? Math.max(...thesis.grades.map(g => g.grade)) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Lowest Grade:</span>
                                        <span className="stat-value" style={{ color: '#dc3545' }}>
                                            {thesis.grades.length > 0 ? Math.min(...thesis.grades.map(g => g.grade)) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No grades message */}
                    {(!thesis.grades || thesis.grades.length === 0) && (
                        <div className="no-grade-message">
                            <div className="info-box">
                                <h4>📋 Grading Status</h4>
                                <p>Your thesis is currently being evaluated by the thesis committee. You will be notified once grading is complete.</p>
                                
                                <div className="grading-process-info">
                                    <h5>🔄 Grading Process:</h5>
                                    <ul>
                                        <li><strong>Step 1:</strong> Supervisor evaluation</li>
                                        <li><strong>Step 2:</strong> External reviewer assessment</li>
                                        <li><strong>Step 3:</strong> Committee member evaluations</li>
                                        <li><strong>Step 4:</strong> Final grade calculation</li>
                                    </ul>
                                </div>
                                
                                <div className="grading-tips">
                                    <h5>📝 What you can do:</h5>
                                    <ul>
                                        <li>Ensure all required materials are submitted</li>
                                        <li>Contact your supervisor if you have questions</li>
                                        <li>Check back regularly for updates</li>
                                        <li>Prepare for potential defense presentation</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <h1>Submission</h1>
            <div className="prethesis-submission-card">
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
                                    disabled={uploading && uploadType === 'report'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.report ? 'resubmit' : 'initial'}`}
                                disabled={uploading && uploadType === 'report'}
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
                                    disabled={uploading && uploadType === 'project'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.project ? 'resubmit' : 'initial'}`}
                                disabled={uploading && uploadType === 'project'}
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
                                    disabled={uploading && uploadType === 'presentation'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.presentation ? 'resubmit' : 'initial'}`}
                                disabled={uploading && uploadType === 'presentation'}
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
                                    disabled={uploading && uploadType === 'demo'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${thesis.demo ? 'resubmit' : 'initial'}`}
                                disabled={uploading && uploadType === 'demo'}
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