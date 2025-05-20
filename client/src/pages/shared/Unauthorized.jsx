import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
    const logout = () => {
        // Perform logout logic here, e.g., clear tokens, redirect to login page, etc.
        console.log("User logged out");
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-red-600">Unauthorized</h1>
            <p className="mt-4 text-lg text-gray-700">You do not have permission to access this page.</p>
            <Link onClick={logout} to="/login" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Go Back to Login
            </Link>
        </div>
    );
}
