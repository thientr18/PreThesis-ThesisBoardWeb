import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/shared/Login';
import Unauthorized from '@/pages/shared/Unauthorized';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
// import StudentDashboard from '@/pages/admin/StudentDashboard';
import StudentConfig from '@/pages/admin/StudentConfig';
import TeacherConfig from '@/pages/admin/TeacherConfig';
import ModeratorConfig from '@/pages/admin/ModeratorConfig';
import ProtectedRoute from './ProtectedRoute';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/logout" element={<Navigate to="/admin" />} />
      
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
                <Route path="/moderator/config" element={<ModeratorConfig />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      
      <Route path="*" element={<Navigate to="/unauthorized" />} />
    </Routes>
  );
};

export default AppRoutes;
