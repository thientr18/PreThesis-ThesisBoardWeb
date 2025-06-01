import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';

import Login from '@/pages/shared/Login';
import Unauthorized from '@/pages/shared/Unauthorized';
import Configuration from '@/pages/shared/Configuration';

import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import StudentConfig from '@/pages/admin/StudentConfig';
import TeacherConfig from '@/pages/admin/TeacherConfig';
import ModeratorConfig from '@/pages/admin/ModeratorConfig';
import SemesterAssignment from '@/pages/admin/SemesterAssignment';

import ModeratorLayout from '@/layouts/ModeratorLayout';
import ModeratorDashboard from '@/pages/moderator/ModeratorDashboard';

import TeacherLayout from '@/layouts/TeacherLayout';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import TeacherTopic from '@/pages/teacher/TeacherTopic';
import Registration from '@/pages/teacher/Registration';
import AssignThesis from '@/pages/teacher/AssignThesis';
import PreThesisStudent from '@/pages/teacher/PreThesisStudent';
import ThesisStudent from '@/pages/teacher/ThesisStudent';
import PreThesisHome from '@/pages/teacher/PreThesisHome';
import ThesisHome from '@/pages/teacher/ThesisHome';

import StudentLayout from '@/layouts/StudentLayout';
import StudentDashboard from '@/pages/student/StudentDashboard';
import TopicList from '@/pages/student/TopicList';
import ThesisContact from '@/pages/student/ThesisContact';
import PreThesisHomeStudent from '@/pages/student/PreThesisHome';
import ThesisHomeStudent from '@/pages/student/ThesisHome';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/logout" element={<Navigate to="/login" />} />
      
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                {/* <Route path="/student/dashboard" element={<StudentDashboard />} /> */}
                <Route path='/student/config' element={<StudentConfig />} />
                <Route path="/teacher/config" element={<TeacherConfig />} />
                <Route path="/teacher/semester-assignment" element={<SemesterAssignment />} />
                <Route path="/moderator/config" element={<ModeratorConfig />} />
                <Route path="/configurations" element={<Configuration />} />
                {/* Add more admin routes here */}
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/moderator/*'
        element={
          <ProtectedRoute roles={['moderator']}>
            <ModeratorLayout>
              <Routes>
                <Route path="/" element={<ModeratorDashboard />} />

                {/* Add more moderator routes here */}
              </Routes>
            </ModeratorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute roles={['teacher']}>
            <TeacherLayout>
              <Routes>

                <Route path="/" element={<TeacherDashboard />} />
                <Route path="/pre-thesis/topic" element={<TeacherTopic />} />
                <Route path="/pre-thesis/registration" element={<Registration />} />
                <Route path="/thesis/assign-student" element={<AssignThesis />} />
                <Route path="/pre-thesis/student" element={<PreThesisStudent />} />
                <Route path="/pre-thesis/:preThesisId" element={<PreThesisHome />} />
                <Route path="/thesis/student/" element={<ThesisStudent />} />
                <Route path="/thesis/:thesisId" element={<ThesisHome />} />
                {/* Add more teacher routes here */}
              </Routes>
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentLayout>
              <Routes>
                <Route path="/" element={<StudentDashboard />} />
                <Route path="/topic-list" element={<TopicList />} />
                <Route path="/contact-supervisor" element={<ThesisContact />} />
                <Route path="/pre-thesis/:semesterId" element={<PreThesisHomeStudent />} />
                <Route path="/thesis/:semesterId" element={<ThesisHomeStudent />} />
                {/* Add more student routes here */}
              </Routes>
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/unauthorized" />} />
    </Routes>
  );
};

export default AppRoutes;
