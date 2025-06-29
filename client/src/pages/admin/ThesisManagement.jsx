import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/utils/axios";

const ThesisManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [theses, setTheses] = useState([]);
    const [activeTeachers, setActiveTeachers] = useState([]);
    const [expandedThesis, setExpandedThesis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [exportingThesis, setExportingThesis] = useState(null);

    // Assignment states
    const [assignmentData, setAssignmentData] = useState({
        reviewerId: "",
        committeeMembers: [],
        defenseDate: "",
        defenseTime: ""
    });

    // Fetch initial data
    useEffect(() => {
        if (!user || !user.role) return;
        fetchSemesters();
        fetchActiveTeachers();
    }, [user]);

    // Auto-select newest semester
    useEffect(() => {
        if (semesters.length > 0 && !selectedSemester) {
            const newestSemester = semesters.reduce((newest, current) => {
                // Use createdAt as primary sort, fallback to startDate if available
                const newestDate = new Date(newest.createdAt || newest.startDate || 0);
                const currentDate = new Date(current.createdAt || current.startDate || 0);
                return currentDate > newestDate ? current : newest;
            });
            setSelectedSemester(newestSemester.id.toString());
        }
    }, [semesters]);

    // Fetch theses when semester changes
    useEffect(() => {
        if (selectedSemester) {
            fetchThesesBySemester(selectedSemester);
        }
    }, [selectedSemester]);

    const fetchSemesters = async () => {
        try {
            const response = await api.get(`/${user.role}/semesters`);

            // Process semesters to extract dates from configurations
            const processedSemesters = (response.data || []).map(semester => {
                const startDateConfig = semester.configurations?.find(config => config.key.includes('start_date'));
                const endDateConfig = semester.configurations?.find(config => config.key.includes('end_date'));
                
                return {
                    ...semester,
                    startDate: startDateConfig?.value || null,
                    endDate: endDateConfig?.value || null
                };
            });
            
            setSemesters(processedSemesters);
        } catch (error) {
            console.error('Error fetching semesters:', error);
            setError('Failed to fetch semesters');
        }
    };

    const fetchActiveTeachers = async () => {
        try {
            const response = await api.get(`/${user.role}/teachers/active`);
            setActiveTeachers(response.data || []);
        } catch (error) {
            console.error('Error fetching active teachers:', error);
            setError('Failed to fetch active teachers');
        }
    };

    const fetchThesesBySemester = async (semesterId) => {
        try {
            setLoading(true);
            const response = await api.get(`/${user.role}/semesters/${semesterId}/theses`);

            // Transform the data to match the expected structure
            const transformedTheses = (response.data || []).map(thesis => {
                // Find supervisor and reviewer from teachers array
                const supervisor = thesis.teachers?.find(t => t.role === 'supervisor')?.teacher;
                const reviewer = thesis.teachers?.find(t => t.role === 'reviewer')?.teacher;
                const committeeMembers = thesis.teachers?.filter(t => t.role === 'committee').map(t => t.teacher) || [];
                
                return {
                    ...thesis,
                    student: thesis.student,
                    supervisor: supervisor,
                    reviewer: reviewer,
                    supervisorId: supervisor?.id,
                    reviewerId: reviewer?.id,
                    committeeMembers: committeeMembers
                };
            });
            
            setTheses(transformedTheses);
        } catch (error) {
            console.error('Error fetching theses:', error);
            setError('Failed to fetch theses');
            setTheses([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleThesisExpansion = (thesisId) => {
        if (expandedThesis === thesisId) {
            setExpandedThesis(null);
            resetAssignmentData();
        } else {
            setExpandedThesis(thesisId);
            const thesis = theses.find(t => t.id === thesisId);
            if (thesis) {
                loadThesisAssignments(thesis);
            }
        }
    };

    const loadThesisAssignments = (thesis) => {
        setAssignmentData({
            reviewerId: thesis.reviewerId || "",
            committeeMembers: thesis.committeeMembers ? thesis.committeeMembers.map(cm => cm.id) : [],
            defenseDate: thesis.defenseDate ? new Date(thesis.defenseDate).toISOString().split('T')[0] : "",
            defenseTime: thesis.defenseDate ? new Date(thesis.defenseDate).toTimeString().slice(0, 5) : ""
        });
    };

    const resetAssignmentData = () => {
        setAssignmentData({
            reviewerId: "",
            committeeMembers: [],
            defenseDate: "",
            defenseTime: ""
        });
    };

    const handleCommitteeMemberToggle = (teacherId) => {
        setAssignmentData(prev => ({
            ...prev,
            committeeMembers: prev.committeeMembers.includes(teacherId)
                ? prev.committeeMembers.filter(id => id !== teacherId)
                : [...prev.committeeMembers, teacherId]
        }));
    };

    const assignReviewer = async (thesisId) => {
        if (!assignmentData.reviewerId) {
            setError('Please select a reviewer');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/${user.role}/theses/${thesisId}/assign-reviewer`, {
                reviewerId: assignmentData.reviewerId
            });
            
            setSuccess('Reviewer assigned successfully');
            fetchThesesBySemester(selectedSemester);
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error('Error assigning reviewer:', error);
            setError(error.response?.data?.message || 'Failed to assign reviewer');
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const assignCommitteeMembers = async (thesisId) => {
        if (assignmentData.committeeMembers.length === 0) {
            setError('Please select at least one committee member');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/${user.role}/theses/${thesisId}/assign-committee`, {
                committeeMembers: assignmentData.committeeMembers
            });
            
            setSuccess('Committee members assigned successfully');
            fetchThesesBySemester(selectedSemester);
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error('Error assigning committee members:', error);
            setError(error.response?.data?.message || 'Failed to assign committee members');
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const setDefenseDate = async (thesisId) => {
        if (!assignmentData.defenseDate || !assignmentData.defenseTime) {
            setError('Please select both date and time for defense');
            return;
        }

        try {
            setLoading(true);
            const defenseDateTime = new Date(`${assignmentData.defenseDate}T${assignmentData.defenseTime}`);

            await api.post(`/${user.role}/theses/${thesisId}/set-defense-date`, {
                defenseDate: defenseDateTime.toISOString()
            });
            
            setSuccess('Defense date set successfully');
            fetchThesesBySemester(selectedSemester);
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error('Error setting defense date:', error);
            setError(error.response?.data?.message || 'Failed to set defense date');
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const exportThesisReport = async (thesisId) => {
        try {
            setExportingThesis(thesisId);
            
            // Get thesis info for filename
            const thesis = theses.find(t => t.id === thesisId);
            const semester = semesters.find(s => s.id.toString() === selectedSemester);

            const response = await api.get(`/${user.role}/theses/${thesisId}/export-registration?format=pdf`, {
                responseType: 'blob'
            });

            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename
            const filename = `Thesis-Registration-Report-${semester?.name.replace(/\s+/g, '-') || 'semester'}-${thesis?.student?.fullName.replace(/\s+/g, '-') || 'student'}.pdf`;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setSuccess('Thesis report exported successfully');
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error('Error exporting thesis report:', error);
            setError(error.response?.data?.message || 'Failed to export thesis report');
            setTimeout(() => setError(""), 3000);
        } finally {
            setExportingThesis(null);
        }
    };

    const getAvailableTeachers = (thesis, excludeRole = null) => {
        return activeTeachers.filter(teacher => {
            // Exclude supervisor
            if (teacher.id === thesis.supervisorId) return false;
            
            // Exclude current reviewer if selecting committee members
            if (excludeRole === 'reviewer' && teacher.id === thesis.reviewerId) return false;
            
            // Exclude current committee members if selecting reviewer
            if (excludeRole === 'committee' && thesis.committeeMembers?.some(cm => cm.id === teacher.id)) return false;
            
            return true;
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'submitted': 'bg-blue-100 text-blue-800',
            'pending defense': 'bg-purple-100 text-purple-800',
            'rejected': 'bg-red-100 text-red-800',
            'defended': 'bg-green-100 text-green-800',
            'complete': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Filter theses based on search term
    const filteredTheses = theses.filter(thesis =>
        thesis.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thesis.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thesis.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thesis.supervisor?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Check if user is admin
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Thesis Management</h1>
                    <p className="mt-2 text-gray-600">Assign reviewers, committee members, and set defense dates for theses</p>
                </div>

                {/* Error and Success Messages */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                        {success}
                    </div>
                )}

                {/* Semester Selection */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Semester</h2>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Choose a semester...</option>
                        {semesters.map(semester => (
                            <option key={semester.id} value={semester.id}>
                                {semester.name} ({new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedSemester && (
                    <>
                        {/* Search and Filter */}
                        <div className="bg-white shadow rounded-lg p-6 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Thesis Management ({filteredTheses.length} theses)
                                </h2>
                                <div className="flex-1 max-w-md">
                                    <input
                                        type="text"
                                        placeholder="Search by title, student, or supervisor..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Theses List */}
                        <div className="bg-white shadow rounded-lg">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading theses...</p>
                                </div>
                            ) : (
                                <>
                                    {filteredTheses.length > 0 ? (
                                        <div className="divide-y divide-gray-200">
                                            {filteredTheses.map((thesis, index) => (
                                                <div key={thesis.id} className="border-b border-gray-200 last:border-b-0">
                                                    {/* Thesis Header */}
                                                    <div className="p-6">
                                                        <div className="flex items-center justify-between">
                                                            <div 
                                                                className="flex-1 cursor-pointer"
                                                                onClick={() => toggleThesisExpansion(thesis.id)}
                                                            >
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <h3 className="text-lg font-medium text-gray-900">
                                                                        {thesis.title || 'Untitled Thesis'}
                                                                    </h3>
                                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(thesis.status)}`}>
                                                                        {thesis.status}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                                                    <p><span className="font-medium">Student:</span> {thesis.student?.fullName || 'Unknown'}</p>
                                                                    <p><span className="font-medium">Supervisor:</span> {thesis.supervisor?.fullName || 'Not assigned'}</p>
                                                                    <p><span className="font-medium">Reviewer:</span> {thesis.reviewer?.fullName || 'Not assigned'}</p>
                                                                    <p><span className="font-medium">Defense:</span> {formatDateTime(thesis.defenseDate)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                {/* Export Button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        exportThesisReport(thesis.id);
                                                                    }}
                                                                    disabled={exportingThesis === thesis.id}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                                    title="Export Thesis Report (PDF)"
                                                                >
                                                                    {exportingThesis === thesis.id ? (
                                                                        <>
                                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Exporting...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            Export Registration Report
                                                                        </>
                                                                    )}
                                                                </button>

                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setExportingThesis(thesis.id);
                                                                        const semester = semesters.find(s => s.id.toString() === selectedSemester);

                                                                        try {
                                                                            const response = await api.get(`/${user.role}/theses/${thesis.id}/export-final`, {
                                                                                responseType: 'blob'
                                                                            });
                                                                            const blob = new Blob([response.data], { type: 'application/pdf' });
                                                                            const url = window.URL.createObjectURL(blob);
                                                                            const link = document.createElement('a');
                                                                            link.href = url;
                                                                            const filename = `Thesis-Final-Report-${semester?.name.replace(/\s+/g, '-') || 'semester'}-${thesis.student?.fullName?.replace(/\s+/g, '-') || 'student'}.pdf`;
                                                                            link.download = filename;
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            document.body.removeChild(link);
                                                                            window.URL.revokeObjectURL(url);
                                                                            setSuccess('Final report exported successfully');
                                                                            setTimeout(() => setSuccess(""), 3000);
                                                                        } catch (error) {
                                                                            setError(error.response?.data?.message || 'Failed to export final report');
                                                                            setTimeout(() => setError(""), 3000);
                                                                        } finally {
                                                                            setExportingThesis(null);
                                                                        }
                                                                    }}
                                                                    disabled={exportingThesis === thesis.id || !['complete', 'failed'].includes(thesis.status)}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                                    title="Export Final Thesis Report (PDF)"
                                                                >
                                                                    {exportingThesis === thesis.id ? (
                                                                        <>
                                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Exporting...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            Export Final Report
                                                                        </>
                                                                    )}
                                                                </button>
                                                                
                                                                <span className="text-sm text-gray-500">#{index + 1}</span>
                                                                <button
                                                                    onClick={() => toggleThesisExpansion(thesis.id)}
                                                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                                                >
                                                                    <svg
                                                                        className={`w-5 h-5 transform transition-transform duration-200 ${
                                                                            expandedThesis === thesis.id ? 'rotate-180' : ''
                                                                        }`}
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Content */}
                                                    {expandedThesis === thesis.id && (
                                                        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                                                            <div className="space-y-6">
                                                                {/* Student and Supervisor Info */}
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                    <div className="bg-white p-4 rounded-lg border">
                                                                        <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                                                                        <div className="space-y-2 text-sm">
                                                                            <p><span className="font-medium">Student ID:</span> {thesis.student?.user.username}</p>
                                                                            <p><span className="font-medium">Email:</span> {thesis.student?.email}</p>
                                                                            <p><span className="font-medium">Phone:</span> {thesis.student?.phone || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-white p-4 rounded-lg border">
                                                                        <h4 className="font-medium text-gray-900 mb-3">Supervisor Information</h4>
                                                                        <div className="space-y-2 text-sm">
                                                                            <p><span className="font-medium">Name:</span> {thesis.supervisor?.fullName || 'Not assigned'}</p>
                                                                            <p><span className="font-medium">Email:</span> {thesis.supervisor?.email || 'N/A'}</p>
                                                                            <p><span className="font-medium">Phone:</span> {thesis.supervisor?.phone || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Reviewer Assignment */}
                                                                <div className="bg-white p-4 rounded-lg border">
                                                                    <h4 className="font-medium text-gray-900 mb-3">Reviewer Assignment</h4>
                                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                                        <select
                                                                            value={assignmentData.reviewerId}
                                                                            onChange={(e) => setAssignmentData(prev => ({...prev, reviewerId: e.target.value}))}
                                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                                        >
                                                                            <option value="">Select reviewer...</option>
                                                                            {getAvailableTeachers(thesis, 'committee').map(teacher => (
                                                                                <option key={teacher.id} value={teacher.id}>
                                                                                    {teacher.fullName} ({teacher.email})
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <button
                                                                            onClick={() => assignReviewer(thesis.id)}
                                                                            disabled={loading || !assignmentData.reviewerId}
                                                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                                                        >
                                                                            Assign Reviewer
                                                                        </button>
                                                                    </div>
                                                                    {thesis.Reviewer && (
                                                                        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                                                            <p className="text-sm text-green-800">
                                                                                <span className="font-medium">Current Reviewer:</span> {thesis.Reviewer.fullName} ({thesis.Reviewer.email})
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Committee Members Assignment */}
                                                                <div className="bg-white p-4 rounded-lg border">
                                                                    <h4 className="font-medium text-gray-900 mb-3">Committee Members Assignment</h4>
                                                                    <div className="mb-4">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                                                                            {getAvailableTeachers(thesis, 'reviewer').map(teacher => (
                                                                                <label key={teacher.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={assignmentData.committeeMembers.includes(teacher.id)}
                                                                                        onChange={() => handleCommitteeMemberToggle(teacher.id)}
                                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                                    />
                                                                                    <span className="text-sm text-gray-700">{teacher.fullName}</span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-sm text-gray-600">
                                                                            {assignmentData.committeeMembers.length} member(s) selected
                                                                        </span>
                                                                        <button
                                                                            onClick={() => assignCommitteeMembers(thesis.id)}
                                                                            disabled={loading || assignmentData.committeeMembers.length === 0}
                                                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                                                        >
                                                                            Assign Committee
                                                                        </button>
                                                                    </div>
                                                                    {thesis.committeeMembers && thesis.committeeMembers.length > 0 && (
                                                                        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                                                            <p className="text-sm font-medium text-green-800 mb-1">Current Committee Members:</p>
                                                                            <div className="text-sm text-green-700">
                                                                                {thesis.committeeMembers.map((member, idx) => (
                                                                                    <span key={member.id}>
                                                                                        {member.fullName}
                                                                                        {idx < thesis.committeeMembers.length - 1 ? ', ' : ''}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Defense Date Setting */}
                                                                <div className="bg-white p-4 rounded-lg border">
                                                                    <h4 className="font-medium text-gray-900 mb-3">Defense Date & Time</h4>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                        <input
                                                                            type="date"
                                                                            value={assignmentData.defenseDate}
                                                                            onChange={(e) => setAssignmentData(prev => ({...prev, defenseDate: e.target.value}))}
                                                                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                                        />
                                                                        <input
                                                                            type="time"
                                                                            value={assignmentData.defenseTime}
                                                                            onChange={(e) => setAssignmentData(prev => ({...prev, defenseTime: e.target.value}))}
                                                                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                                        />
                                                                        <button
                                                                            onClick={() => setDefenseDate(thesis.id)}
                                                                            disabled={loading || !assignmentData.defenseDate || !assignmentData.defenseTime}
                                                                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                                                        >
                                                                            Set Defense Date
                                                                        </button>
                                                                    </div>
                                                                    {thesis.defenseDate && (
                                                                        <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                                                                            <p className="text-sm text-purple-800">
                                                                                <span className="font-medium">Current Defense Date:</span> {formatDateTime(thesis.defenseDate)}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            {searchTerm ? (
                                                <div>
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No theses found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        No theses match your search for "{searchTerm}"
                                                    </p>
                                                    <button
                                                        onClick={() => setSearchTerm("")}
                                                        className="mt-3 text-blue-600 hover:text-blue-500 text-sm"
                                                    >
                                                        Clear search
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No theses found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        No theses are available for this semester.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ThesisManagement;