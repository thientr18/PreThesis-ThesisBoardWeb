import React from "react";

export default function Footer() {
    return (
        <footer className="bg-red-800 text-white py-4 mt-auto">
        <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} Footer.</p>
        </div>
        </footer>
    );
}