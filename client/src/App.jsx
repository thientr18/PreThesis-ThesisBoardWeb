import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./components/Login/"
import Main from "./components/Main"
import ProtectedRoute from "./components/ProtectedRoute"
import Admin from "./components/Admin"
import Moderator from "./components/Moderator"
import Student from "./components/Student"
import Teacher from "./components/Teacher"

function App() {
  const user = localStorage.getItem("accessToken");

  return (
    <>
      <Routes>
      {user && <Route path='/' axact element={<Main />} />}
        <Route path="/login" exact element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute allowedRoles={["student", "teacher", "moderator", "admin"]}>
            <Main />
          </ProtectedRoute>
        } />

        <Route path="/student" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Student />
          </ProtectedRoute>
        } />

        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Teacher />
          </ProtectedRoute>
        } />

        <Route path="/moderator" element={
          <ProtectedRoute allowedRoles={["moderator"]}>
            <Moderator />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="*" exact element={<Navigate replace to="/login" />} />
      </Routes>
    </>
  );
}

export default App

// import { Route, Routes, Navigate } from "react-router-dom"
// import Login from "./components/Login/"
// import Main from "./components/Main"

// function App() {
//   const user = localStorage.getItem("accessToken");

//   return (
//     <>
//       <Routes>
//       {user && <Route path='/' axact element={<Main />} />}
//         <Route path="/login" exact element={<Login />} />
//         <Route path="*" exact element={<Navigate replace to="/login" />} />
//       </Routes>
//     </>
//   );
// }

// export default App