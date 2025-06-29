import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/utils/axios";

const PreThesisManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [preTheses, setPreTheses] = useState([]);
    const [activeTeachers, setActiveTeachers] = useState([]);
    const [expandedPreThesis, setExpandedPreThesis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [exportingPreThesis, setExportingPreThesis] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchSemesters();
        fetchActiveTeachers();
    }, []);

    // Auto-select newest semester
    useEffect(() => {
        if (semesters.length > 0 && !selectedSemester) {
            const newestSemester = semesters.reduce((newest, current) => {
                const newestDate = new Date(newest.createdAt || newest.startDate || 0);
                const currentDate = new Date(current.createdAt || current.startDate || 0);
                return currentDate > newestDate ? current : newest;
            });
            setSelectedSemester(newestSemester.id.toString());
        }
    }, [semesters]);

    // Fetch pre-theses when semester changes
    useEffect(() => {
        if (selectedSemester) {
            fetchPreThesesBySemester(selectedSemester);
        }
    }, [selectedSemester]);

    // Export Pre-Thesis Final Report
    const exportPreThesisFinalReport = async (preThesis) => {
        try {
            setExportingPreThesis(preThesis.id);
            // Find semester for filename (optional, if you want to include semester name)
            const semester = semesters.find(s => s.id.toString() === selectedSemester);

            const response = await api.get(`/admin/prethesis/${preThesis.id}/export-final`, {
                responseType: 'blob'
            });
            console.log('Exporting pre-thesis final report:', response);

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = `PreThesis-Final-Report-${semester?.name?.replace(/\s+/g, '-') || 'semester'}-${preThesis.student?.fullName?.replace(/\s+/g, '-') || 'student'}.pdf`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess('Pre-thesis final report exported successfully');
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to export pre-thesis final report');
            setTimeout(() => setError(""), 3000);
        } finally {
            setExportingPreThesis(null);
        }
    };

    const fetchSemesters = async () => {
        try {
            const response = await api.get('/admin/semesters');
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
            setError('Failed to fetch semesters');
        }
    };

    const fetchActiveTeachers = async () => {
        try {
            const response = await api.get('/admin/teachers/active');
            setActiveTeachers(response.data || []);
        } catch (error) {
            setError('Failed to fetch active teachers');
        }
    };

    const fetchPreThesesBySemester = async (semesterId) => {
        try {
            setLoading(true);
            // Get all topics for this semester
            const preThesesRes = await api.get('/admin/prethesis', { params: { semesterId } });
            const preThesesData = preThesesRes.data || [];

            // Map pre-thesis to student/preThesisTopic/supervisor
            const mapped = preThesesData.map(pt => {
                const supervisor = activeTeachers.find(t => t.id === pt.preThesisTopic?.supervisorId);
                return {
                    ...pt,
                    supervisor,
                };
            });
            setPreTheses(mapped);
        } catch (error) {
            setError('Failed to fetch pre-theses');
            setPreTheses([]);
        } finally {
            setLoading(false);
        }
    };

    const togglePreThesisExpansion = (preThesisId) => {
        setExpandedPreThesis(expandedPreThesis === preThesisId ? null : preThesisId);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'submitted': 'bg-blue-100 text-blue-800',
            'approved': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Filter pre-theses based on search term
    const filteredPreTheses = preTheses.filter(pt =>
        pt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.supervisor?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user?.role !== 'admin') {
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
                    <h1 className="text-3xl font-bold text-gray-900">Pre-Thesis Management</h1>
                    <p className="mt-2 text-gray-600">View and manage pre-thesis assignments</p>
                </div>

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
                                {semester.name} ({semester.startDate ? new Date(semester.startDate).toLocaleDateString() : "?"} - {semester.endDate ? new Date(semester.endDate).toLocaleDateString() : "?"})
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
                                    Pre-Thesis Management ({filteredPreTheses.length})
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

                        {/* PreTheses List */}
                        <div className="bg-white shadow rounded-lg">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading pre-theses...</p>
                                </div>
                            ) : (
                                <>
                                    {filteredPreTheses.length > 0 ? (
                                        <div className="divide-y divide-gray-200">
                                            {filteredPreTheses.map((pt, index) => (
                                                <div key={pt.id} className="border-b border-gray-200 last:border-b-0">
                                                    {/* PreThesis Header */}
                                                    <div className="p-6">
                                                        <div className="flex items-center justify-between">
                                                            <div
                                                                className="flex-1 cursor-pointer"
                                                                onClick={() => togglePreThesisExpansion(pt.id)}
                                                            >
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <h3 className="text-lg font-medium text-gray-900">
                                                                        {pt.title || pt.topic?.topic || 'Untitled Pre-Thesis'}
                                                                    </h3>
                                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pt.status)}`}>
                                                                        {pt.status}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                                                    <p><span className="font-medium">Student:</span> {pt.student?.fullName || 'Unknown'}</p>
                                                                    <p><span className="font-medium">Supervisor:</span> {pt.supervisor?.fullName || pt.topic?.supervisorName || 'Not assigned'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                {/* --- Export Button --- */}
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        await exportPreThesisFinalReport(pt);
                                                                    }}
                                                                    disabled={exportingPreThesis === pt.id || !['approved', 'failed'].includes(pt.status)}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                                    title="Export Pre-Thesis Final Report (PDF)"
                                                                >
                                                                    {exportingPreThesis === pt.id ? (
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
                                                                    onClick={() => togglePreThesisExpansion(pt.id)}
                                                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                                                >
                                                                    <svg
                                                                        className={`w-5 h-5 transform transition-transform duration-200 ${expandedPreThesis === pt.id ? 'rotate-180' : ''}`}
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
                                                    {expandedPreThesis === pt.id && (
                                                        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                                                            <div className="space-y-6">
                                                                {/* Student and Supervisor Info */}
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                    <div className="bg-white p-4 rounded-lg border">
                                                                        <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                                                                        <div className="space-y-2 text-sm">
                                                                            <p><span className="font-medium">Student ID:</span> {pt.student?.user?.username}</p>
                                                                            <p><span className="font-medium">Email:</span> {pt.student?.email}</p>
                                                                            <p><span className="font-medium">Phone:</span> {pt.student?.phone || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-white p-4 rounded-lg border">
                                                                        <h4 className="font-medium text-gray-900 mb-3">Supervisor Information</h4>
                                                                        <div className="space-y-2 text-sm">
                                                                            <p><span className="font-medium">Name:</span> {pt.supervisor?.fullName || pt.topic?.supervisorName || 'Not assigned'}</p>
                                                                            <p><span className="font-medium">Email:</span> {pt.supervisor?.email || 'N/A'}</p>
                                                                            <p><span className="font-medium">Phone:</span> {pt.supervisor?.phone || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
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
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pre-theses found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        No pre-theses match your search for "{searchTerm}"
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
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pre-theses found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        No pre-theses are available for this semester.
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

export default PreThesisManagement;