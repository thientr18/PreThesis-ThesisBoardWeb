<<<<<<< Updated upstream
# PreThesis-ThesisBoardWeb
=======
# ThesisBoard Web Application

ThesisBoard is a web application for managing pre-thesis and thesis processes at a university. It supports roles such as Admin, Moderator, Teacher (Lecturer/Supervisor), and Student, providing features for user management, semester management, topic assignment, grading, and announcements.

## Features

- **User Management:** Admins can create, edit, and manage students, teachers, and moderators.
- **Semester Management:** Assign users to semesters, manage active/current semesters.
- **Pre-Thesis Management:** Supervisors create topics, students apply, moderators set deadlines and assign topics.
- **Thesis Management:** Registration, eligibility checks, supervisor/reviewer assignment, grading, and final result export.
- **Announcements:** Role-based announcement system for communication.
- **Authentication:** JWT-based authentication with role-based access control.

## Project Structure

```
PreThesis-ThesisBoardWeb/
│
├── client/         # React frontend (Vite, TailwindCSS)
│   ├── public/     # Static assets (SVGs, icons)
│   ├── src/        # React components, pages, routes, styles
│   └── ...
│
├── server/         # Node.js backend (Express, Sequelize)
│   ├── app/
│   │   ├── configs/      # DB configs, seeders
│   │   ├── controllers/  # Route controllers (Admin, Announcement, etc.)
│   │   ├── helpers/
│   │   ├── middlewares/  # Auth, error handling
│   │   ├── models/       # Sequelize models (User, Student, Thesis, etc.)
│   │   └── utils/
│   ├── routes/     # Express route definitions
│   └── ...
│
├── README.md
├── use-case.md     # Detailed use cases and flows
├── ERD.drawio      # Entity Relationship Diagram (editable)
├── ERD.drawio.png  # ERD image
└── ...
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MySQL database

### Setup

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd PreThesis-ThesisBoardWeb
   ```

2. **Install dependencies:**
   - For the backend:
     ```sh
     cd server
     npm install
     ```
   - For the frontend:
     ```sh
     cd ../client
     npm install
     ```

3. **Configure environment variables:**
   - Copy the example environment file to create your own configuration:
     ```sh
     cp server/.env.example server/.env
     ```
   - Open `server/.env` and fill in the required values, such as:
     - `DB_HOST` - your MySQL database host (e.g., `localhost`)
     - `DB_USER` - your MySQL username
     - `DB_PASSWORD` - your MySQL password
     - `DB_NAME` - the database name to use
     - `JWT_SECRET` - a secret string for JWT authentication
     - Any other required variables as listed in `.env.example`

4. **Database setup:**
   - The backend will auto-sync and seed the database on first run using the scripts in [`server/app/configs/index.js`](server/app/configs/index.js).
   
   ```
    cd server
    node ./app/configs/index.js
   ```

5. **Run the backend:**
   ```sh
   cd server
   npm start
   ```
   The backend runs on `http://localhost:8080`.

6. **Run the frontend:**
   ```sh
   cd client
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`.

## Usage

- Access the app at [http://localhost:5173](http://localhost:5173).
- Login with seeded accounts (see `server/app/configs/index.js` for default users).
- Admin, Moderator, Teacher, and Student dashboards are available based on login role.

## Documentation

- See [`use-case.md`](use-case.md) for detailed use cases and flows.
- See [`ERD.drawio`](ERD.drawio) for the database schema.

## License

This project is for educational purposes.
>>>>>>> Stashed changes
